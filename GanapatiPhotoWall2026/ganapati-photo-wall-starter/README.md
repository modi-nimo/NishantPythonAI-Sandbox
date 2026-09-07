# Sensorium Cha Vighnaharta Organizer Guide

This website is a common Ganapati celebration page for Sensorium residents.
Residents can share photos, and everyone can enjoy the society memory wall.

## What Visitors Can Do

- Open the society Photo Wall.
- See recent Ganapati celebration photos.
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

The site sends residents to this public Google Form:

```text
https://docs.google.com/forms/d/1FJ1bAcL3eqps91xjSW1uJHU1INnrBbPiXpRFNL9yt-c/viewform
```

Do not use the Google Form `/edit` URL for visitors.

## Photo Flow

Simple workflow:

1. A resident opens `/upload`.
2. They tap `Open Photo Form`.
3. They upload a Ganapati festival photo.
4. The photo appears on the Sensorium Photo Wall from the connected Drive folder.

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

## Google Drive Folder

The website reads photos from the folder ID in `.env.local`.

To find a folder ID:

1. Open the folder in Google Drive.
2. Look at the browser address bar.
3. Copy the long ID after `/folders/`.

Example:

```text
https://drive.google.com/drive/folders/PASTE_THIS_PART_ONLY
```

## Google Account Setup

The website uses a Google service account to read photos.

Service account email:

```text
sensorium@sensorium-507910.iam.gserviceaccount.com
```

Make sure the photo folder is shared with this email as `Viewer`.

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
GOOGLE_DRIVE_FOLDER_ID="your-photo-folder-id"
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

- `/` shows the Sensorium Photo Wall.
- `/upload` opens the sharing page.
- `/api/health` says `googleDriveConfigured: true`.
- `/api/photos` says `status: connected`.

## How New Photos Appear

The home page refreshes photo data every 60 seconds.

When a resident uploads a photo into the connected folder, it should appear on
the Photo Wall after the refresh.

If something goes wrong, the site shows a friendly fallback instead of breaking
for visitors.
