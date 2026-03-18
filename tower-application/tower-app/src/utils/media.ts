/**
 * Transforms Google Drive "share" links into direct image viewing links.
 * Works for both /file/d/ID/view and /open?id=ID formats.
 */
export function transformGDriveUrl(url: string | null): string | null {
    if (!url) return null;

    // Check if it's a Google Drive link
    if (!url.includes('drive.google.com')) return url;

    try {
        let fileId = '';

        // Format 1: https://drive.google.com/file/d/FILE_ID/view...
        const fileDMatch = url.match(/\/file\/d\/([^/]+)/);
        if (fileDMatch && fileDMatch[1]) {
            fileId = fileDMatch[1];
        }
        // Format 2: https://drive.google.com/open?id=FILE_ID
        else {
            const urlObj = new URL(url);
            fileId = urlObj.searchParams.get('id') || '';
        }

        if (fileId) {
            // The most reliable endpoint for embedding GDrive images in <img> tags
            // without triggering redirects to HTML pages or cookie requirements is:
            return `https://lh3.googleusercontent.com/d/${fileId}`;
        }
    } catch (e) {
        console.error("GDrive URL parsing error:", e);
    }

    return url;
}
