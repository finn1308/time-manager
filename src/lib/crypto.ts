import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes for AES-GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a strictly 32-byte key from the environment variable
 */
function getDerivedKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET_KEY || "chronomind_default_secret_key_32bytes_change_in_env";
  return crypto.createHash("sha256").update(secret).digest();
}

export interface EncryptedData {
  encryptedKey: string; // Base64
  iv: string;           // Base64
  authTag: string;      // Base64
}

/**
 * Encrypts a plain text API key using AES-256-GCM
 */
export function encryptApiKey(plainText: string): EncryptedData {
  if (!plainText || typeof plainText !== "string") {
    throw new Error("Invalid plain text key to encrypt");
  }

  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return {
    encryptedKey: encrypted,
    iv: iv.toString("base64"),
    authTag: authTag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted API key
 */
export function decryptApiKey(encrypted: string, iv: string, authTag: string): string {
  try {
    const key = getDerivedKey();
    const ivBuffer = Buffer.from(iv, "base64");
    const authTagBuffer = Buffer.from(authTag, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);

    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt API key:", error);
    throw new Error("Decryption failed. Invalid key or corrupted data.");
  }
}

/**
 * Masks an API key for safe client display (e.g. "sk-abc...1234")
 */
export function maskApiKey(plainText: string): string {
  if (!plainText) return "";
  if (plainText.length <= 8) return "••••••••";
  return `${plainText.slice(0, 4)}••••••••${plainText.slice(-4)}`;
}
