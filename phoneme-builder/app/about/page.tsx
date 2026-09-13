import SiteShell from "@/app/components/site-shell";
import {
  ABOUT_YOUTUBE_URL,
  SITE_NAME,
  STUDENT_NAME,
  STUDENT_NUMBER,
} from "@/app/lib/site-config";

function youtubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace(/^\/+/, "").split("/")[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }

    if (
      url.hostname === "youtube.com" ||
      url.hostname === "www.youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
      }

      const embedMatch = url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/);
      if (embedMatch?.[1]) {
        return `https://www.youtube-nocookie.com/embed/${embedMatch[1]}`;
      }
    }
  } catch {
    return "";
  }

  return "";
}

export default function AboutPage() {
  const embedUrl = youtubeEmbedUrl(ABOUT_YOUTUBE_URL);
  const hasVideo = Boolean(embedUrl) && !ABOUT_YOUTUBE_URL.includes("YOUR_VIDEO_ID");

  return (
    <SiteShell>
      <div className="page-stack narrow-page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">About</span>
            <h1>{SITE_NAME}</h1>
            <p>
              A teacher-facing Next.js application for preparing Speech Pathology classroom
              activities using phoneme-based Wordle and Word Search games.
            </p>
          </div>
        </section>

        <section className="two-card-grid">
          <article className="panel">
            <span className="eyebrow">Student</span>
            <h2>{STUDENT_NAME}</h2>
            <p className="record-line">Student number: <strong>{STUDENT_NUMBER}</strong></p>
            {(STUDENT_NAME === "Your name" || STUDENT_NUMBER === "Your student number") && (
              <div className="notice warning">
               <code>app/lib/site-config.ts</code>
              </div>
            )}
          </article>

          <article className="panel">
            <span className="eyebrow">Project purpose</span>
            <h2>From frontend builder to data-driven application</h2>
            <p>
              Teachers do manage phoneme words and activity settings in the frontend parts of the application. The
              application stores them in PostgreSQL through Next.js API routes and Prisma,
              then generates standalone classroom HTML from those saved records.
            </p>
          </article>
        </section>

        <section className="panel">
          <span className="eyebrow">How to use the website</span>
          <h2>Instructional video</h2>
          {hasVideo ? (
            <div className="youtube-frame">
              <iframe
                src={embedUrl}
                title={`How to use ${SITE_NAME}`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="video-placeholder">
              <strong>YouTube instructional video.</strong>
              <p>
              https://youtu.be/4hYfNyQiyxM
              </p>
            </div>
          )}
        </section>

      </div>
    </SiteShell>
  );
}
