import { NextResponse } from "next/server";
import { fetchPublishedDrivePhotos } from "../../server/googleDrive";

export const runtime = "nodejs";

export async function GET() {
  const result = await fetchPublishedDrivePhotos();

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
