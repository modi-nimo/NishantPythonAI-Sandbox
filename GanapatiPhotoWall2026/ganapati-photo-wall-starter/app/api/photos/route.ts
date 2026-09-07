import { NextResponse } from "next/server";
import { fetchPublishedDrivePhotos } from "../../lib/googleDrive";

export const runtime = "nodejs";

export async function GET() {
  const result = await fetchPublishedDrivePhotos();

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
