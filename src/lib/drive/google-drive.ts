import { google, drive_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";
import { encryptApiKey, decryptApiKey } from "@/lib/crypto";
import { Readable } from "stream";

// Scope strictly limited to files created or opened by this app (Principle of least privilege)
export const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
];

export function getGoogleOAuth2Client(redirectUri?: string) {
  const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
  const baseAppUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const callbackUrl = redirectUri || `${baseAppUrl}/api/drive/auth/callback`;

  return new google.auth.OAuth2(clientId, clientSecret, callbackUrl);
}

/**
 * Returns OAuth authorization URL for the user to grant Google Drive file access
 */
export function getDriveAuthUrl(userId: string, returnUrl?: string, redirectUri?: string): string {
  const oauth2Client = getGoogleOAuth2Client(redirectUri);
  const state = JSON.stringify({ userId, returnUrl: returnUrl || "/calendar" });

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_DRIVE_SCOPES,
    state: Buffer.from(state).toString("base64"),
  });
}

/**
 * Encrypt and store tokens in the database
 */
export async function saveUserDriveTokens(userId: string, tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  id_token?: string | null;
  scope?: string | null;
}) {
  let encAccessToken = null;
  let encRefreshToken = null;

  if (tokens.access_token) {
    const enc = encryptApiKey(tokens.access_token);
    encAccessToken = JSON.stringify(enc);
  }

  if (tokens.refresh_token) {
    const enc = encryptApiKey(tokens.refresh_token);
    encRefreshToken = JSON.stringify(enc);
  }

  // Check if account already exists
  const existing = await prisma.account.findFirst({
    where: { userId, provider: "google_drive" },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: {
        access_token: encAccessToken || existing.access_token,
        refresh_token: encRefreshToken || existing.refresh_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : existing.expires_at,
        scope: tokens.scope || existing.scope,
      },
    });
  } else {
    await prisma.account.create({
      data: {
        userId,
        type: "oauth",
        provider: "google_drive",
        providerAccountId: userId,
        access_token: encAccessToken,
        refresh_token: encRefreshToken,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        scope: tokens.scope || GOOGLE_DRIVE_SCOPES.join(" "),
      },
    });
  }
}

/**
 * Gets an authenticated Google Drive API client for the user.
 * Automatically refreshes access tokens if needed.
 */
export async function getUserDriveClient(userId: string): Promise<drive_v3.Drive | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google_drive" },
  });

  if (!account || !account.refresh_token) {
    return null;
  }

  try {
    const encRefresh = JSON.parse(account.refresh_token);
    const refreshToken = decryptApiKey(encRefresh.encryptedKey, encRefresh.iv, encRefresh.authTag);

    let accessToken: string | undefined = undefined;
    if (account.access_token) {
      try {
        const encAccess = JSON.parse(account.access_token);
        accessToken = decryptApiKey(encAccess.encryptedKey, encAccess.iv, encAccess.authTag);
      } catch {
        // will refresh below
      }
    }

    const oauth2Client = getGoogleOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
      access_token: accessToken,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    });

    // Listen to token refresh events
    oauth2Client.on("tokens", async (newTokens) => {
      await saveUserDriveTokens(userId, {
        ...newTokens,
        refresh_token: newTokens.refresh_token || refreshToken,
      });
    });

    return google.drive({ version: "v3", auth: oauth2Client });
  } catch (err) {
    console.error("Failed to initialize Google Drive client for user", userId, err);
    return null;
  }
}

/**
 * Disconnects and removes Google Drive access for the user
 */
export async function disconnectUserDrive(userId: string): Promise<boolean> {
  try {
    await prisma.account.deleteMany({
      where: { userId, provider: "google_drive" },
    });
    return true;
  } catch (err) {
    console.error("Error disconnecting Google Drive:", err);
    return false;
  }
}

/**
 * Checks connection status of Google Drive
 */
export async function checkDriveConnectionStatus(userId: string): Promise<{
  connected: boolean;
  email?: string;
}> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google_drive" },
  });

  if (!account || !account.refresh_token) {
    return { connected: false };
  }

  const drive = await getUserDriveClient(userId);
  if (!drive) return { connected: false };

  try {
    const about = await drive.about.get({ fields: "user" });
    return {
      connected: true,
      email: about.data.user?.emailAddress || undefined,
    };
  } catch (err) {
    console.warn("Could not query Google Drive user info:", err);
    return { connected: true };
  }
}

/**
 * Finds or creates a folder in Google Drive. Prevents duplicate folder creation.
 */
export async function getOrCreateDriveFolder(
  drive: drive_v3.Drive,
  folderName: string,
  parentId?: string
): Promise<string> {
  const safeName = folderName.replace(/['\\]/g, "").trim();
  let query = `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const searchRes = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    return searchRes.data.files[0].id!;
  }

  // Create folder if not found
  const fileMetadata: drive_v3.Schema$File = {
    name: safeName,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentId ? [parentId] : undefined,
  };

  const createRes = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });

  return createRes.data.id!;
}

/**
 * Resolves the structured folder hierarchy in Google Drive:
 * Study Manager / [Subject Name] / [Lesson or Session Title]
 */
export async function resolveStudyFolderHierarchy(
  drive: drive_v3.Drive,
  subjectName: string = "General",
  sessionTitle: string = "General Session"
): Promise<string> {
  const rootFolderId = await getOrCreateDriveFolder(drive, "Study Manager");
  const subjectFolderId = await getOrCreateDriveFolder(drive, subjectName, rootFolderId);
  const sessionFolderId = await getOrCreateDriveFolder(drive, sessionTitle, subjectFolderId);
  return sessionFolderId;
}

/**
 * Checks if a file with the given name already exists in the target folder
 */
export async function checkFileExistsInFolder(
  drive: drive_v3.Drive,
  folderId: string,
  fileName: string
): Promise<{ exists: boolean; file?: drive_v3.Schema$File }> {
  const safeName = fileName.replace(/['\\]/g, "").trim();
  const q = `name = '${safeName}' and '${folderId}' in parents and trashed = false`;

  const res = await drive.files.list({
    q,
    fields: "files(id, name, webViewLink, mimeType, size)",
    spaces: "drive",
  });

  if (res.data.files && res.data.files.length > 0) {
    return { exists: true, file: res.data.files[0] };
  }

  return { exists: false };
}

/**
 * Uploads a file stream/buffer to Google Drive into the organized folder
 */
export async function uploadFileToDriveFolder(
  drive: drive_v3.Drive,
  params: {
    folderId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    autoShare: boolean;
  }
): Promise<{
  fileId: string;
  webViewLink: string;
  name: string;
  mimeType: string;
  size: number;
}> {
  const stream = new Readable();
  stream.push(params.buffer);
  stream.push(null);

  const fileMetadata: drive_v3.Schema$File = {
    name: params.fileName,
    parents: [params.folderId],
  };

  const media = {
    mimeType: params.mimeType,
    body: stream,
  };

  const createRes = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink, mimeType, size",
  });

  const fileId = createRes.data.id!;
  let webViewLink = createRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  // Set sharing permissions strictly according to user preference
  if (params.autoShare) {
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      // Fetch fresh shareable link
      const updatedFile = await drive.files.get({
        fileId,
        fields: "webViewLink",
      });
      if (updatedFile.data.webViewLink) {
        webViewLink = updatedFile.data.webViewLink;
      }
    } catch (permErr) {
      console.warn("Could not set anyone-with-link permission, file remains restricted:", permErr);
    }
  }

  return {
    fileId,
    webViewLink,
    name: createRes.data.name || params.fileName,
    mimeType: createRes.data.mimeType || params.mimeType,
    size: parseInt(createRes.data.size || "0", 10) || params.buffer.length,
  };
}
