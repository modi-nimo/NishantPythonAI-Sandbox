import Link from "next/link";
import { PhotoGallery } from "./components/PhotoGallery";
import { fetchPublishedDrivePhotos } from "./lib/googleDrive";

export const runtime = "nodejs";
export const revalidate = 60;

export default async function HomePage() {
  const photoResult = await fetchPublishedDrivePhotos();

  return (
    <main className="site-shell">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy-block">
            <div className="eyebrow">GANPATI FESTIVAL 2026</div>
            <h1>Ganapati Photo Wall</h1>
            <p className="hero-copy">
              Celebrate Bappa through our community&apos;s favorite darshan photos,
              aarti moments, decorations, prasad, smiles, and festival memories.
            </p>

            <div className="hero-actions">
              <Link href="/upload" className="button button-primary">
                Share a Moment
              </Link>
              <a href="#wall" className="button button-secondary">
                See Photos
              </a>
            </div>
          </div>

          <div className="hero-feature" aria-label="Festival greeting">
            <div className="mandala-mark">ॐ</div>
            <p>गणपती बाप्पा मोरया</p>
            <span>Mangal Murti Morya</span>
          </div>
        </div>
      </section>

      <section id="wall" className="wall-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="section-kicker">COMMUNITY MEMORIES</div>
              <h2>Recent Celebrations</h2>
            </div>
            <p>
              {photoResult.message}
            </p>
          </div>

          {photoResult.photos.length > 0 ? (
            <PhotoGallery photos={photoResult.photos} />
          ) : (
            <div className="empty-state">
              <div className="empty-mark">ॐ</div>
              <h3>No photos yet</h3>
              <p>
                Share your favorite Ganapati moment and help begin the photo
                wall.
              </p>
              <Link href="/upload" className="button button-primary">
                Share a Moment
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-card">
          <div>
            <div className="section-kicker">YOUR TURN</div>
            <h2>Captured a beautiful moment?</h2>
            <p>Send it in and let the whole community enjoy the celebration.</p>
          </div>
          <Link href="/upload" className="button button-primary">
            Share a Moment
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <span>Ganapati Photo Wall</span>
          <span>गणपती बाप्पा मोरया ❤️</span>
        </div>
      </footer>
    </main>
  );
}
