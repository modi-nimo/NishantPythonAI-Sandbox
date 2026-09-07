import Link from "next/link";
import Image from "next/image";

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/1FJ1bAcL3eqps91xjSW1uJHU1INnrBbPiXpRFNL9yt-c/viewform";

export default function UploadPage() {
  return (
    <main className="upload-page">
      <div className="upload-topbar">
        <div className="container topbar-inner">
          <Link href="/" className="back-link">Back to Photos</Link>
          <span>Sensorium Cha Vighnaharta</span>
        </div>
      </div>

      <section className="upload-hero">
        <div className="container narrow">
          <div className="section-kicker">SOCIETY PHOTO WALL</div>
          <h1>Share Your Photo</h1>
          <p>
            Add your favorite Sensorium Ganapati photo to the common celebration
            wall. It only takes a minute.
          </p>
        </div>
      </section>

      <section className="form-section">
        <div className="container narrow">
          <div className="upload-card">
            <div className="upload-card-image">
              <Image
                src="/sensorium-cha-vighnaharta-hero.jpeg"
                alt="Sensorium Cha Vighnaharta festival artwork"
                fill
                sizes="(max-width: 700px) 72vw, 220px"
                priority
              />
            </div>
            <h2>Ready to add your memory?</h2>
            <p>
              The photo form opens in Google Forms so image upload works
              smoothly on mobile and desktop.
            </p>

            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="button button-primary"
            >
              Open Photo Form
            </a>

            <ul className="upload-tips" aria-label="Photo sharing tips">
              <li>Choose a clear Sensorium Ganapati festival photo.</li>
              <li>Add your name or caption if you want to.</li>
              <li>Your moment will be part of the society Photo Wall.</li>
            </ul>
          </div>

          <p className="form-note">
            After submitting, you can come back to the Photo Wall to enjoy the
            celebration.
          </p>
        </div>
      </section>
    </main>
  );
}
