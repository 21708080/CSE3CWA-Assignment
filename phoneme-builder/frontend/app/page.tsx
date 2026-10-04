import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

export default function HomePage() {
  return (
    <SiteShell>
      <div className="page-stack">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Assessment project · teacher-facing application</span>
            <h1>Build phoneme activities from stored classroom data.</h1>
            <p>
              Create reusable word lists, configure Wordle or Word Search activities,
              preview the backend-generated result, and download a standalone HTML game.
            </p>
            <div className="button-row">
              <Link className="button primary" href="/wordlists">Create word list</Link>
              <Link className="button secondary" href="/wordle">Build Wordle</Link>
              <Link className="button secondary" href="/word-search">Build Word Search</Link>
            </div>
          </div>

        </section>

        <section>
          <div className="section-heading">
            <span className="eyebrow">Teacher workflow</span>
            <h2>Everything needed from one frontend</h2>
          </div>
          <div className="feature-grid">
            <Link className="feature-card" href="/wordlists">
              <span className="feature-number">01</span>
              <h3>Manage word lists</h3>
              <p>Create, read, edit and delete lists and their phoneme-based words.</p>
              <span className="text-link">Open word lists →</span>
            </Link>
            <Link className="feature-card" href="/wordle">
              <span className="feature-number">02</span>
              <h3>Configure Wordle</h3>
              <p>Choose stored data, difficulty, hints, attempts and answer settings.</p>
              <span className="text-link">Open Wordle builder →</span>
            </Link>
            <Link className="feature-card" href="/word-search">
              <span className="feature-number">03</span>
              <h3>Configure Word Search</h3>
              <p>Generate a phoneme grid from a saved word list and activity configuration.</p>
              <span className="text-link">Open Word Search builder →</span>
            </Link>
            <Link className="feature-card" href="/settings">
              <span className="feature-number">04</span>
              <h3>Accessible interface</h3>
              <p>Use light, dark or system theme plus optional text and motion preferences.</p>
              <span className="text-link">Open settings →</span>
            </Link>
          </div>
        </section>

      </div>
    </SiteShell>
  );
}
