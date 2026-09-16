import { NextResponse } from "next/server";
import { getGoogleDriveAccessToken } from "../../../../server/googleDrive";

export const runtime = "nodejs";

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const THUMBNAIL_SIZE = "s900";

function resizeThumbnailUrl(url: string) {
  if (/=s\d+/.test(url)) {
    return url.replace(/=s\d+/, `=${THUMBNAIL_SIZE}`);
  }

  return `${url}${url.includes("=") ? "" : `=${THUMBNAIL_SIZE}`}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const accessToken = await getGoogleDriveAccessToken();
  const metadataResponse = await fetch(
    `${DRIVE_FILES_URL}/${encodeURIComponent(
      id,
    )}?fields=thumbnailLink&supportsAllDrives=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 3_600 },
    },
  );

  if (!metadataResponse.ok) {
    return new Response("Thumbnail not found", {
      status: metadataResponse.status || 404,
    });
  }

  const metadata = (await metadataResponse.json()) as { thumbnailLink?: string };

  if (!metadata.thumbnailLink) {
    return new Response("Thumbnail not available", { status: 404 });
  }

  return NextResponse.redirect(resizeThumbnailUrl(metadata.thumbnailLink), {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
