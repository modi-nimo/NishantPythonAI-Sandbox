import { NextResponse } from "next/server";
import { fetchPublishedDrivePhotos } from "../../server/googleDrive";

export const runtime = "nodejs";

function getPageSize(value: string | null) {
  const pageSize = Number(value ?? 30);

  if (!Number.isFinite(pageSize)) {
    return 30;
  }

  return Math.min(Math.max(Math.trunc(pageSize), 1), 100);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await fetchPublishedDrivePhotos(
    getPageSize(url.searchParams.get("pageSize")),
    url.searchParams.get("pageToken") ?? undefined,
  );

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
