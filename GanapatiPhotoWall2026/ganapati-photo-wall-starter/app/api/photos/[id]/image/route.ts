import { getGoogleDriveAccessToken } from "../../../../server/googleDrive";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const accessToken = await getGoogleDriveAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 86_400 },
    },
  );

  if (!response.ok || !response.body) {
    return new Response("Photo not found", { status: response.status || 404 });
  }

  return new Response(response.body, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
    },
  });
}
