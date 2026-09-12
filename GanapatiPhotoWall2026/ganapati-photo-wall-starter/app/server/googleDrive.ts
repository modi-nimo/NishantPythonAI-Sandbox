import { createSign } from "node:crypto";
import type { GalleryPhoto, PhotoResult } from "./photos";
import { getFallbackPhotos } from "./photos";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const TOKEN_LIFETIME_SECONDS = 3600;

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
  };
};

type AccessToken = {
  token: string;
  expiresAt: number;
};

let cachedAccessToken: AccessToken | null = null;

export function getDriveConfig() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (
    !clientEmail ||
    !privateKey ||
    !folderId ||
    privateKey === "PASTE_PRIVATE_KEY_HERE"
  ) {
    return null;
  }

  return { clientEmail, privateKey, folderId };
}

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwt(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  );
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: DRIVE_SCOPE,
      aud: TOKEN_URL,
      exp: now + TOKEN_LIFETIME_SECONDS,
      iat: now,
    }),
  );
  const unsignedToken = `${header}.${claimSet}`;
  const signer = createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  const signature = signer
    .sign(privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${unsignedToken}.${signature}`;
}

export async function getGoogleDriveAccessToken() {
  const config = getDriveConfig();

  if (!config) {
    throw new Error("Google Drive environment variables are not configured.");
  }

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const assertion = createJwt(config.clientEmail, config.privateKey);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google auth failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedAccessToken = {
    token: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };

  return cachedAccessToken.token;
}

function getAspect(file: DriveFile): GalleryPhoto["aspect"] {
  const width = file.imageMediaMetadata?.width;
  const height = file.imageMediaMetadata?.height;

  if (!width || !height) {
    return "portrait";
  }

  const ratio = width / height;

  if (ratio > 1.25) {
    return "landscape";
  }

  if (ratio < 0.72) {
    return "tall";
  }

  if (ratio > 0.9 && ratio < 1.1) {
    return "square";
  }

  return "portrait";
}

function isUuidLike(value: string) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
    value.trim(),
  );
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function getDisplayName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "").trim();
  const parts = withoutExtension
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1 && isUuidLike(parts[0])) {
    return toTitleCase(parts.slice(1).join(" - "));
  }

  return toTitleCase(withoutExtension) || "Ganapati festival moment";
}

function mapDriveFileToPhoto(file: DriveFile): GalleryPhoto {
  const displayName = getDisplayName(file.name);

  return {
    id: file.id,
    src: `/api/photos/${file.id}/image`,
    alt: `Ganapati festival photo: ${displayName}`,
    caption: displayName,
    credit: "Community photo",
    aspect: getAspect(file),
    source: "drive",
  };
}

export async function fetchPublishedDrivePhotos(): Promise<PhotoResult> {
  const config = getDriveConfig();

  if (!config) {
    return getFallbackPhotos();
  }

  try {
    const accessToken = await getGoogleDriveAccessToken();
    const params = new URLSearchParams({
      q: `'${config.folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      orderBy: "createdTime desc",
      pageSize: "48",
      fields:
        "files(id,name,mimeType,createdTime,modifiedTime,imageMediaMetadata(width,height))",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    const response = await fetch(`${DRIVE_FILES_URL}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Google Drive list failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as { files?: DriveFile[] };
    const photos = (payload.files ?? []).map(mapDriveFileToPhoto);

    if (photos.length === 0) {
      return {
        photos: [],
        status: "empty",
        message: "Shared photos from residents will appear here soon.",
      };
    }

    return {
      photos,
      status: "connected",
      message: "Fresh moments from Sensorium's Ganapati celebration.",
    };
  } catch (error) {
    console.error(error);

    return {
      ...getFallbackPhotos(),
      status: "error",
      message:
        "A few festive moments are shown here while the celebration wall refreshes.",
    };
  }
}
