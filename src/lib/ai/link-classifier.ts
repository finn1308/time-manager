export interface ClassifiedUrl {
  originalUrl: string;
  type: "MEETING" | "STORAGE" | "LEARNING" | "OTHER";
  subType: "ZOOM" | "MEET" | "TEAMS" | "GDRIVE" | "ONEDRIVE" | "DROPBOX" | "YOUTUBE" | "LMS" | "WEB" | "OTHER";
  suggestedTitle: string;
  badgeLabel: string;
  iconName: string;
}

/**
 * Deterministic URL classifier ensuring zero hallucination or mangling of URLs
 */
export function classifyUrl(rawUrl: string): ClassifiedUrl {
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  // 1. Meeting URLs
  if (lower.includes("zoom.us") || lower.includes("zoom.com")) {
    return {
      originalUrl: url,
      type: "MEETING",
      subType: "ZOOM",
      suggestedTitle: "Phòng học Zoom Meeting",
      badgeLabel: "Zoom",
      iconName: "Video",
    };
  }
  if (lower.includes("meet.google.com")) {
    return {
      originalUrl: url,
      type: "MEETING",
      subType: "MEET",
      suggestedTitle: "Google Meet",
      badgeLabel: "Google Meet",
      iconName: "Video",
    };
  }
  if (lower.includes("teams.microsoft.com") || lower.includes("teams.live.com")) {
    return {
      originalUrl: url,
      type: "MEETING",
      subType: "TEAMS",
      suggestedTitle: "Microsoft Teams",
      badgeLabel: "MS Teams",
      iconName: "Video",
    };
  }

  // 2. Storage URLs
  if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) {
    return {
      originalUrl: url,
      type: "STORAGE",
      subType: "GDRIVE",
      suggestedTitle: "Google Drive Folder / Document",
      badgeLabel: "Google Drive",
      iconName: "FolderOpen",
    };
  }
  if (lower.includes("onedrive.live.com") || lower.includes("1drv.ms") || lower.includes("sharepoint.com")) {
    return {
      originalUrl: url,
      type: "STORAGE",
      subType: "ONEDRIVE",
      suggestedTitle: "OneDrive Document",
      badgeLabel: "OneDrive",
      iconName: "Cloud",
    };
  }
  if (lower.includes("dropbox.com")) {
    return {
      originalUrl: url,
      type: "STORAGE",
      subType: "DROPBOX",
      suggestedTitle: "Dropbox Folder / File",
      badgeLabel: "Dropbox",
      iconName: "Box",
    };
  }

  // 3. Learning URLs
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return {
      originalUrl: url,
      type: "LEARNING",
      subType: "YOUTUBE",
      suggestedTitle: "Video bài giảng YouTube",
      badgeLabel: "YouTube",
      iconName: "Youtube",
    };
  }
  if (
    lower.includes("coursera.org") ||
    lower.includes("udemy.com") ||
    lower.includes("edx.org") ||
    lower.includes("canvas") ||
    lower.includes("moodle") ||
    lower.includes("classroom.google.com")
  ) {
    return {
      originalUrl: url,
      type: "LEARNING",
      subType: "LMS",
      suggestedTitle: "Khóa học trực tuyến / LMS",
      badgeLabel: "LMS",
      iconName: "GraduationCap",
    };
  }

  // 4. Fallback: External Link
  return {
    originalUrl: url,
    type: "OTHER",
    subType: "WEB",
    suggestedTitle: "Tài liệu / Trang web học tập",
    badgeLabel: "External Link",
    iconName: "ExternalLink",
  };
}

/**
 * Extracts all URLs from any natural language Vietnamese text
 */
export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches.map(u => u.replace(/[.,;!?)]+$/, ""))));
}
