# Ganapati Photo Wall 2026 Organizer Guide

This website lets visitors see Ganapati festival photos and share their own
moments through a Google Form.

## What Visitors Can Do

- Open the Photo Wall.
- See recent community photos.
- Tap a photo to view it larger.
- Open the sharing page.
- Submit a festival photo through the Google Form.

## Visitor Links

Home page:

```text
/
```

Share-photo page:

```text
/upload
```

## Google Form

The site embeds this public responder URL:

```text
https://docs.google.com/forms/d/1FJ1bAcL3eqps91xjSW1uJHU1INnrBbPiXpRFNL9yt-c/viewform
```

Do not embed the Google Form `/edit` URL on the public site.

## Photo Approval Flow

Use these two folders in Google Drive:

```text
Pending
Published
```

Simple workflow:

1. New form uploads arrive from Google Forms.
2. You review the submitted photos.
3. Move selected photos into the `Published` folder.
4. The website shows photos from `Published`.

Only photos in `Published` appear on the public wall.

## Start The Website On Your Computer

From this folder:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

If port 3000 is busy, Next.js will show a different local URL such as `http://localhost:3001`.

## Check That Everything Works

```bash
npm run lint
npm run build
```

Both commands should finish without errors.

## Published Folder ID

The website needs the folder ID for the `Published` folder.

To find the folder ID:

1. Open the `Published` folder in Google Drive.
2. Look at the browser address bar.
3. Copy the long ID after `/folders/`.

Example:

```text
https://drive.google.com/drive/folders/PASTE_THIS_PART_ONLY
```

Your current Published folder ID is:

```text
1-aw-B_5NYVY5JSs7X_rDSsdPbMwpTXV-
```

## Google Account Setup

The website uses a Google service account to read selected photos.

Service account email:

```text
sensorium@sensorium-507910.iam.gserviceaccount.com
```

Make sure the `Published` folder is shared with this email as `Viewer`.

If you ever need to create a new key:

1. Go to Google Cloud Console.
2. Open the service account.
3. Click `Keys`.
4. Click `Add key`.
5. Click `Create new key`.
6. Choose `JSON`.
7. Download the file.
8. Copy the `private_key` value into `.env.local`.

## Local Settings File

Your local settings live in `.env.local`.

It should look like this:

```bash
GOOGLE_CLIENT_EMAIL="sensorium@sensorium-507910.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="your-private-key"
GOOGLE_DRIVE_FOLDER_ID="1-aw-B_5NYVY5JSs7X_rDSsdPbMwpTXV-"
```

Keep `.env.local` private. Do not share it publicly.

## Quick Browser Checks

After starting the site, open:

```text
http://localhost:3000/api/health
```

Good result:

```text
googleDriveConfigured: true
```

Then open:

```text
http://localhost:3000/api/photos
```

Good result:

```text
status: connected
```

If there are no photos yet, `status: empty` is also okay.

## Deploy On Vercel

This is the simplest deployment path for a Next.js app.

1. Push this project to GitHub.
2. Go to Vercel.
3. Click `Add New...`.
4. Click `Project`.
5. Import the GitHub repository.
6. Set the framework to `Next.js` if Vercel does not detect it automatically.
7. Add these Environment Variables in Vercel:

```text
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_DRIVE_FOLDER_ID
```

8. Click `Deploy`.

After deployment, open the Vercel URL and check:

- `/` shows the photo wall.
- `/upload` shows the Google Form.
- `/api/health` says `googleDriveConfigured: true`.
- `/api/photos` says `status: connected` or `status: empty`.

## How New Photos Appear

The home page refreshes photo data every 60 seconds.

When you add a selected image to the `Published` folder, it should appear on the public wall after the refresh.

If something goes wrong, the site shows a friendly fallback instead of breaking for visitors.
