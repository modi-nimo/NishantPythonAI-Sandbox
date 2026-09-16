import Link from "next/link";
import { PhotoWallWithMore } from "../components/PhotoWallWithMore";
import { fetchPublishedDrivePhotos } from "../server/googleDrive";

export const runtime = "nodejs";
export const revalidate = 600;

export default async function PhotosPage() {
  const photoResult = await fetchPublishedDrivePhotos(100);
  const photoCount = photoResult.photos.length;

  return (
    <main className="site-shell">
      <header className="site-nav">
        <div className="container nav-inner">
          <Link href="/" className="brand-link">
            Sensorium Cha Vighnaharta
          </Link>
          <nav className="nav-links" aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/upload">Share Photo</Link>
          </nav>
        </div>
      </header>

      <section className="photos-page-hero">
        <div className="container photos-page-heading">
          <div>
            <div className="section-kicker">SOCIETY MEMORIES</div>
            <h1>All Photos</h1>
            <p>
              {photoCount} shared {photoCount === 1 ? "moment" : "moments"} from
              Sensorium&apos;s Ganapati celebration.
            </p>
          </div>
          <Link href="/upload" className="button button-primary">
            Share Your Photo
          </Link>
        </div>
      </section>

      <section className="photos-page-section">
        <div className="container">
          {photoResult.photos.length > 0 ? (
            <PhotoWallWithMore
              initialNextPageToken={photoResult.nextPageToken}
              initialPhotos={photoResult.photos}
            />
          ) : (
            <div className="empty-state">
              <h2>No photos yet</h2>
              <p>Shared photos from Sensorium residents will appear here soon.</p>
              <Link href="/upload" className="button button-primary">
                Share Your Photo
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
