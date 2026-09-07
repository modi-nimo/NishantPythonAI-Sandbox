import { NextResponse } from "next/server";
import { getDriveConfig } from "../../server/googleDrive";

export const runtime = "nodejs";

export async function GET() {
  const checks = {
    googleClientEmail: Boolean(process.env.GOOGLE_CLIENT_EMAIL),
    googlePrivateKey:
      Boolean(process.env.GOOGLE_PRIVATE_KEY) &&
      process.env.GOOGLE_PRIVATE_KEY !== "PASTE_PRIVATE_KEY_HERE",
    googleDriveFolderId: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
  };
  const googleDriveConfigured = Boolean(getDriveConfig());

  return NextResponse.json({
    ok: true,
    googleDriveConfigured,
    checks,
  });
}
