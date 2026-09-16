import { createSign } from "node:crypto";
import type { GalleryPhoto, PhotoResult } from "./photos";
import { getFallbackPhotos } from "./photos";

const GOOGLE_API_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
].join(" ");
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const SHEETS_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const TOKEN_LIFETIME_SECONDS = 3600;
const PHOTO_LIST_REVALIDATE_SECONDS = 600;

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

type ResponseLabel = {
  caption: string;
  uploader: string;
};

type ResponseLabels = {
  byFileId: Map<string, ResponseLabel>;
  byFileName: Array<{
    key: string;
    label: ResponseLabel;
  }>;
  debug: {
    captionIndex: number;
    headers: string[];
    rowCount: number;
    uploaderIndex: number;
  };
};

type SheetCell = {
  formattedValue?: string;
  hyperlink?: string;
  textFormatRuns?: Array<{
    format?: {
      link?: {
        uri?: string;
      };
    };
  }>;
};

type SheetPayload = {
  sheets?: Array<{
    data?: Array<{
      rowData?: Array<{
        values?: SheetCell[];
      }>;
    }>;
  }>;
};

let cachedAccessToken: AccessToken | null = null;

export function getDriveConfig() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const responsesSheetId = process.env.GOOGLE_FORM_RESPONSES_SHEET_ID;
  const responsesSheetRange =
    process.env.GOOGLE_FORM_RESPONSES_SHEET_RANGE || "Form Responses 1";

  if (
    !clientEmail ||
    !privateKey ||
    !folderId ||
    privateKey === "PASTE_PRIVATE_KEY_HERE"
  ) {
    return null;
  }

  return {
    clientEmail,
    privateKey,
    folderId,
    responsesSheetId,
    responsesSheetRange,
  };
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
      scope: GOOGLE_API_SCOPES,
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

function cleanLabelPart(value: string) {
  return value
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function getDisplayName(fileName: string, responseLabel?: ResponseLabel) {
  const responseCaption = cleanLabelPart(responseLabel?.caption ?? "");
  const responseUploader = cleanLabelPart(responseLabel?.uploader ?? "");

  if (responseCaption && responseUploader) {
    return `${responseCaption} - ${responseUploader}`;
  }

  if (responseCaption) {
    return responseCaption;
  }

  const withoutExtension = fileName.replace(/\.[^/.]+$/, "").trim();
  let parts = withoutExtension
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1 && isUuidLike(parts[0])) {
    parts = parts.slice(1);
  }

  const cleanedParts = parts.map(cleanLabelPart).filter(Boolean);

  if (cleanedParts.length >= 2) {
    return `${cleanedParts[0]} - ${cleanedParts.slice(1).join(" - ")}`;
  }

  return cleanedParts[0] || "Ganapati festival moment";
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findHeaderIndex(headers: string[], candidates: string[]) {
  const normalizedCandidates = candidates.map(normalizeHeader);

  return headers.findIndex((header) => {
    const normalizedHeader = normalizeHeader(header);

    return normalizedCandidates.some((candidate) =>
      normalizedHeader.includes(candidate),
    );
  });
}

function extractDriveFileIds(value: string) {
  return Array.from(
    value.matchAll(/(?:id=|\/d\/|\/file\/d\/)?([a-zA-Z0-9_-]{25,})/g),
    (match) => match[1],
  );
}

function normalizeFileReference(value: string) {
  return value
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getCellText(cell: SheetCell) {
  return cell.formattedValue ?? "";
}

function getCellLinks(cell: SheetCell) {
  const links = new Set<string>();

  if (cell.hyperlink) {
    links.add(cell.hyperlink);
  }

  for (const run of cell.textFormatRuns ?? []) {
    const uri = run.format?.link?.uri;

    if (uri) {
      links.add(uri);
    }
  }

  return Array.from(links);
}

function getEmptyResponseLabels(): ResponseLabels {
  return {
    byFileId: new Map<string, ResponseLabel>(),
    byFileName: [],
    debug: {
      captionIndex: -1,
      headers: [],
      rowCount: 0,
      uploaderIndex: -1,
    },
  };
}

function getSheetRange(sheetRange?: string) {
  const range = sheetRange || "Form Responses 1";

  if (range.includes("!") || /^'.*'$/.test(range)) {
    return range;
  }

  return `'${range.replaceAll("'", "''")}'`;
}

async function fetchResponseLabels(
  accessToken: string,
  sheetId?: string,
  sheetRange?: string,
) {
  if (!sheetId) {
    return getEmptyResponseLabels();
  }

  const params = new URLSearchParams({
    includeGridData: "true",
    ranges: getSheetRange(sheetRange),
    fields:
      "sheets(data(rowData(values(formattedValue,hyperlink,textFormatRuns(format/link/uri)))))",
  });
  const response = await fetch(`${SHEETS_URL}/${encodeURIComponent(sheetId)}?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: PHOTO_LIST_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets read failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as SheetPayload;
  const rows =
    payload.sheets?.flatMap((sheet) =>
      sheet.data?.flatMap((data) => data.rowData ?? []) ?? [],
    ) ?? [];
  const [headerRow, ...responseRows] = rows;
  const headers = headerRow?.values?.map(getCellText) ?? [];
  const captionIndex = findHeaderIndex(headers, ["captionforyourphoto"]);
  const uploaderIndex = findHeaderIndex(headers, [
    "personwhouploadedit",
    "uploadedby",
    "yourname",
    "name",
  ]);
  const labels = getEmptyResponseLabels();
  labels.debug = {
    captionIndex,
    headers,
    rowCount: responseRows.length,
    uploaderIndex,
  };

  for (const row of responseRows) {
    const cells = row.values ?? [];
    const caption = captionIndex >= 0 ? getCellText(cells[captionIndex] ?? {}) : "";
    const uploader =
      uploaderIndex >= 0 ? getCellText(cells[uploaderIndex] ?? {}) : "";
    const label = { caption, uploader };

    for (const cell of cells) {
      const text = getCellText(cell);
      const links = getCellLinks(cell);
      const fileIds = [
        ...extractDriveFileIds(text),
        ...links.flatMap(extractDriveFileIds),
      ];
      const fileNameKey = normalizeFileReference(text);

      for (const fileId of fileIds) {
        labels.byFileId.set(fileId, label);
      }

      if (fileNameKey.length >= 6) {
        labels.byFileName.push({ key: fileNameKey, label });
      }
    }
  }

  return labels;
}

function findResponseLabel(file: DriveFile, responseLabels: ResponseLabels) {
  const labelById = responseLabels.byFileId.get(file.id);

  if (labelById) {
    return labelById;
  }

  const fileNameKey = normalizeFileReference(file.name);

  return responseLabels.byFileName.find(
    ({ key }) => fileNameKey.includes(key) || key.includes(fileNameKey),
  )?.label;
}

function mapDriveFileToPhoto(
  file: DriveFile,
  responseLabels: ResponseLabels,
): GalleryPhoto {
  const displayName = getDisplayName(file.name, findResponseLabel(file, responseLabels));

  return {
    id: file.id,
    src: `/api/photos/${file.id}/thumb`,
    fullSrc: `/api/photos/${file.id}/image`,
    alt: `Ganapati festival photo: ${displayName}`,
    caption: displayName,
    credit: "",
    aspect: getAspect(file),
    source: "drive",
  };
}

async function fetchDriveFiles(accessToken: string, folderId: string) {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
    orderBy: "createdTime desc",
    pageSize: "30",
    fields:
      "files(id,name,mimeType,createdTime,modifiedTime,imageMediaMetadata(width,height))",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const response = await fetch(`${DRIVE_FILES_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: PHOTO_LIST_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Google Drive list failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { files?: DriveFile[] };

  return payload.files ?? [];
}

async function getResponseLabelsSafely(
  accessToken: string,
  sheetId?: string,
  sheetRange?: string,
) {
  try {
    return await fetchResponseLabels(accessToken, sheetId, sheetRange);
  } catch (error) {
    console.error(error);

    return getEmptyResponseLabels();
  }
}

export async function getPhotoLabelDiagnostics() {
  const config = getDriveConfig();

  if (!config) {
    return {
      configured: false,
      error: "Google configuration is missing.",
    };
  }

  const accessToken = await getGoogleDriveAccessToken();
  const files = await fetchDriveFiles(accessToken, config.folderId);
  const responseLabels = await getResponseLabelsSafely(
    accessToken,
    config.responsesSheetId,
    config.responsesSheetRange,
  );
  const samples = files.slice(0, 12).map((file) => {
    const label = findResponseLabel(file, responseLabels);

    return {
      fileName: file.name,
      matched: Boolean(label),
      label: getDisplayName(file.name, label),
    };
  });

  return {
    configured: true,
    driveFileCount: files.length,
    responseSheetConfigured: Boolean(config.responsesSheetId),
    responseSheetRange: getSheetRange(config.responsesSheetRange),
    sheet: {
      captionIndex: responseLabels.debug.captionIndex,
      headers: responseLabels.debug.headers,
      rowCount: responseLabels.debug.rowCount,
      uploaderIndex: responseLabels.debug.uploaderIndex,
    },
    labelCounts: {
      byFileId: responseLabels.byFileId.size,
      byFileName: responseLabels.byFileName.length,
    },
    samples,
  };
}

export async function fetchPublishedDrivePhotos(): Promise<PhotoResult> {
  const config = getDriveConfig();

  if (!config) {
    return getFallbackPhotos();
  }

  try {
    const accessToken = await getGoogleDriveAccessToken();
    const files = await fetchDriveFiles(accessToken, config.folderId);
    const responseLabels = await getResponseLabelsSafely(
      accessToken,
      config.responsesSheetId,
      config.responsesSheetRange,
    );

    const photos = files.map((file) =>
      mapDriveFileToPhoto(file, responseLabels),
    );

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
