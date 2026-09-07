import Link from "next/link";

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/1FJ1bAcL3eqps91xjSW1uJHU1INnrBbPiXpRFNL9yt-c/viewform";

export default function UploadPage() {
  return (
    <main className="upload-page">
      <div className="upload-topbar">
        <div className="container topbar-inner">
          <Link href="/" className="back-link">Back to Photos</Link>
          <span>Ganapati Festival 2026</span>
        </div>
      </div>

      <section className="upload-hero">
        <div className="container narrow">
          <div className="section-kicker">SHARE YOUR MOMENT</div>
          <h1>Share Your Ganapati Moment</h1>
          <p>
            Send your favorite festival photo for the community wall. It only
            takes a minute.
          </p>
        </div>
      </section>

      <section className="form-section">
        <div className="container narrow">
          <div className="upload-card">
            <div className="upload-card-mark">ॐ</div>
            <h2>Ready to share?</h2>
            <p>
              The photo form opens securely in Google Forms so your image upload
              works properly on mobile and desktop.
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
              <li>Choose a clear Ganapati festival photo.</li>
              <li>Add your name or caption if the form asks for it.</li>
              <li>Selected moments will appear on the Photo Wall.</li>
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
