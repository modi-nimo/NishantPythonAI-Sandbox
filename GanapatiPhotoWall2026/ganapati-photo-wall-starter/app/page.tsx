import Image from "next/image";
import Link from "next/link";
import { PhotoGallery } from "./components/PhotoGallery";
import { fetchPublishedDrivePhotos } from "./server/googleDrive";

export const runtime = "nodejs";
export const revalidate = 60;

export default async function HomePage() {
  const photoResult = await fetchPublishedDrivePhotos();
  const photoCount = photoResult.photos.length;

  return (
    <main className="site-shell">
      <header className="site-nav">
        <div className="container nav-inner">
          <Link href="/" className="brand-link">
            Sensorium Cha Vighnaharta
          </Link>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#wall">Memories</a>
            <a href="#how-it-works">How It Works</a>
            <Link href="/upload">Share Photo</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy-block">
            <div className="eyebrow">GANPATI FESTIVAL 2026</div>
            <h1>Sensorium Cha Vighnaharta</h1>
            <p className="hero-copy">
              Our society&apos;s shared album for Bappa&apos;s darshan, aarti,
              decorations, prasad, smiles, family moments, and every celebration
              we want to remember together.
            </p>

            <div className="hero-actions">
              <Link href="/upload" className="button button-primary">
                Share Your Photo
              </Link>
              <a href="#wall" className="button button-secondary">
                View Memories
              </a>
            </div>

            <div className="hero-meta" aria-label="Photo wall status">
              <span>
                {photoCount} shared {photoCount === 1 ? "moment" : "moments"}
              </span>
              <span>Updated automatically</span>
            </div>
          </div>

          <div className="hero-image-panel">
            <Image
              src="/sensorium-cha-vighnaharta-hero.jpeg"
              alt="Sensorium Cha Vighnaharta festival artwork"
              fill
              sizes="(max-width: 980px) 100vw, 520px"
              priority
            />
          </div>
        </div>
      </section>

      <section id="wall" className="wall-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="section-kicker">SOCIETY MEMORIES</div>
              <h2>Photo Wall</h2>
            </div>
            <p>
              {photoResult.message}
            </p>
          </div>

          {photoResult.photos.length > 0 ? (
            <PhotoGallery photos={photoResult.photos} />
          ) : (
            <div className="empty-state">
              <h3>No photos yet</h3>
              <p>
                Shared photos from Sensorium residents will appear here soon.
              </p>
              <Link href="/upload" className="button button-primary">
                Share Your Photo
              </Link>
            </div>
          )}
        </div>
      </section>

      <section id="how-it-works" className="steps-section">
        <div className="container">
          <div className="section-heading section-heading-centered">
            <div>
              <div className="section-kicker">SIMPLE FOR EVERYONE</div>
              <h2>How It Works</h2>
            </div>
            <p>
              Residents share photos, the wall refreshes, and everyone can enjoy
              the celebration from one common place.
            </p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <span>1</span>
              <h3>Take a festival photo</h3>
              <p>
                Darshan, aarti, decoration, prasad, family, friends, or any
                joyful moment.
              </p>
            </article>
            <article className="step-card">
              <span>2</span>
              <h3>Share it with the society</h3>
              <p>Open the photo form and upload your favorite Ganapati memory.</p>
            </article>
            <article className="step-card">
              <span>3</span>
              <h3>Enjoy the wall</h3>
              <p>Come back anytime to see new photos from Sensorium residents.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-card">
          <div>
            <div className="section-kicker">JOIN THE WALL</div>
            <h2>Have a beautiful Bappa moment?</h2>
            <p>Share it so everyone in Sensorium can enjoy the memory.</p>
          </div>
          <Link href="/upload" className="button button-primary">
            Share Your Photo
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <span>Sensorium Cha Vighnaharta</span>
          <span>गणपती बाप्पा मोरया</span>
        </div>
      </footer>
    </main>
  );
}
