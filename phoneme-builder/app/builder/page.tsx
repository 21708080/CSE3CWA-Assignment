"use client";

import { useEffect, useMemo, useState } from "react";
import SiteShell from "@/app/components/site-shell";

type Activity = {
  id: number;
  name: string;
  type: "WORDLE" | "WORD_SEARCH";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  wordList?: { id: number; name: string };
};

type ActivityStyle = {
  activityId: number;
  themeMode: "LIGHT" | "DARK" | "SYSTEM";
  accentColor: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  fontScale: number;
  highContrast: boolean;
  reducedMotion: boolean;
  enhancedFocus: boolean;
  largeControls: boolean;
  customCss: string | null;
};


const DEFAULT_STYLE: Omit<ActivityStyle, "activityId"> = {
  themeMode: "LIGHT",
  accentColor: "#e11d48",
  backgroundColor: "#ffe4e7",
  textColor: "#0f172a",
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  enhancedFocus: true,
  largeControls: false,
  customCss: "",
};

function filenameFromDisposition(value: string | null, fallback: string): string {
  const match = value?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

export default function BuilderPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [style, setStyle] = useState<ActivityStyle | null>(null);
  const [status, setStatus] = useState("Loading activities…");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  useEffect(() => {
    void loadActivities();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  useEffect(() => {
    if (selectedId !== null) void loadStyle(selectedId);
  }, [selectedId]);

  const selectedActivity = useMemo(
    () => activities.find((activity) => activity.id === selectedId) ?? null,
    [activities, selectedId]
  );

  async function loadActivities() {
    try {
      const response = await fetch("/api/activities", { cache: "no-store" });
      if (!response.ok) throw new Error(`Activities request failed (${response.status})`);
      const data = (await response.json()) as Activity[];
      setActivities(data);
      if (data.length > 0) {
        setSelectedId((current) => current ?? data[0].id);
        setStatus("Choose an activity and edit its embedded style.");
      } else {
        setStatus("No activities yet. Run make demo-activities or create an activity first.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load activities");
    }
  }

  async function loadStyle(activityId: number) {
    setStatus("Loading activity style…");
    try {
      const response = await fetch(`/api/activities/${activityId}/style`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Style request failed (${response.status})`);
      const data = (await response.json()) as ActivityStyle;
      setStyle({ ...DEFAULT_STYLE, ...data, activityId });
      setStatus("Style loaded.");
    } catch (error) {
      setStyle({ ...DEFAULT_STYLE, activityId });
      setStatus(error instanceof Error ? error.message : "Could not load style");
    }
  }

  function updateStyle<K extends keyof ActivityStyle>(key: K, value: ActivityStyle[K]) {
    setStyle((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveStyle() {
    if (!selectedId || !style) return;
    setStatus("Saving style…");
    const payload = {
      themeMode: style.themeMode,
      accentColor: style.accentColor,
      backgroundColor: style.backgroundColor,
      textColor: style.textColor,
      fontScale: Number(style.fontScale),
      highContrast: style.highContrast,
      reducedMotion: style.reducedMotion,
      enhancedFocus: style.enhancedFocus,
      largeControls: style.largeControls,
      customCss: style.customCss || null,
    };

    try {
      const response = await fetch(`/api/activities/${selectedId}/style`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Save failed (${response.status})`);
      setStyle({ ...DEFAULT_STYLE, ...data, activityId: selectedId });
      setStatus("Style saved to PostgreSQL. It will be embedded in generated HTML.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save style");
    }
  }

  async function previewActivity() {
    if (!selectedId) return;
    setStatus("Generating preview…");
    try {
      const response = await fetch(`/api/activities/${selectedId}/generate`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Preview failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      setStatus("Preview regenerated from saved backend data and embedded style.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not generate preview");
    }
  }

  async function downloadActivity() {
    if (!selectedId || !selectedActivity) return;
    setStatus("Generating download…");
    try {
      const response = await fetch(`/api/activities/${selectedId}/generate`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Download failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filenameFromDisposition(
        response.headers.get("Content-Disposition"),
        `${selectedActivity.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`
      );
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus("Standalone activity downloaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not download activity");
    }
  }


  return (
    <SiteShell>
      <div className="builder-root">
      <div className="builder-main">
        <section className="editor-card">
          <h1>Activity style editor</h1>
          <p>
            Pick a saved activity, choose its theme and accessibility settings, then save. The generated Wordle or Word Search carries the styling inside the standalone HTML file.
          </p>

          <label className="field">
            <span>Saved activity</span>
            <select
              value={selectedId ?? ""}
              onChange={(event) => setSelectedId(Number(event.target.value))}
              disabled={activities.length === 0}
            >
              {activities.length === 0 && <option value="">No saved activities</option>}
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  #{activity.id} {activity.name} — {activity.type.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          {selectedActivity && (
            <div className="activity-summary">
              <strong>{selectedActivity.name}</strong>
              <span>{selectedActivity.type.replace("_", " ")}</span>
              <span>{selectedActivity.difficulty}</span>
              {selectedActivity.wordList && <span>{selectedActivity.wordList.name}</span>}
            </div>
          )}

          {style && (
            <>
              <div className="form-grid">
                <label className="field">
                  <span>Activity theme</span>
                  <select
                    value={style.themeMode}
                    onChange={(event) => updateStyle("themeMode", event.target.value as ActivityStyle["themeMode"])}
                  >
                    <option value="LIGHT">Light</option>
                    <option value="DARK">Dark</option>
                    <option value="SYSTEM">Follow device</option>
                  </select>
                </label>

                <label className="field">
                  <span>Accent colour</span>
                  <input
                    type="color"
                    value={style.accentColor || "#e11d48"}
                    onChange={(event) => updateStyle("accentColor", event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Background colour</span>
                  <input
                    type="color"
                    value={style.backgroundColor || "#ffe4e7"}
                    onChange={(event) => updateStyle("backgroundColor", event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Text colour</span>
                  <input
                    type="color"
                    value={style.textColor || "#0f172a"}
                    onChange={(event) => updateStyle("textColor", event.target.value)}
                  />
                </label>

                <label className="field wide">
                  <span>Text scale: {style.fontScale.toFixed(1)}×</span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.6"
                    step="0.1"
                    value={style.fontScale}
                    onChange={(event) => updateStyle("fontScale", Number(event.target.value))}
                  />
                </label>
              </div>

              <fieldset className="accessibility-box">
                <legend>Accessibility embedded in the activity</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={style.highContrast}
                    onChange={(event) => updateStyle("highContrast", event.target.checked)}
                  />
                  High contrast
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={style.largeControls}
                    onChange={(event) => updateStyle("largeControls", event.target.checked)}
                  />
                  Larger phoneme buttons and grid cells
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={style.enhancedFocus}
                    onChange={(event) => updateStyle("enhancedFocus", event.target.checked)}
                  />
                  Enhanced keyboard focus outlines
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={style.reducedMotion}
                    onChange={(event) => updateStyle("reducedMotion", event.target.checked)}
                  />
                  Reduced motion
                </label>
              </fieldset>

              <label className="field">
                <span>Advanced CSS</span>
                <textarea
                  rows={10}
                  spellCheck={false}
                  value={style.customCss || ""}
                  onChange={(event) => updateStyle("customCss", event.target.value)}
                  placeholder={".activity-shell {\n  max-width: 1000px;\n}\n\n.phoneme-key {\n  border-radius: 14px;\n}"}
                />
                <small>
                  Optional CSS is saved with this activity and embedded after the generated activity stylesheet. Script tags, @import and JavaScript URLs are rejected.
                </small>
              </label>

              <div className="actions">
                <button className="primary" type="button" onClick={saveStyle}>Save style</button>
                <button type="button" onClick={previewActivity}>Preview generated activity</button>
                <button type="button" onClick={downloadActivity}>Download HTML</button>
              </div>
            </>
          )}

          <p className="status" role="status" aria-live="polite">{status}</p>
        </section>

        <section className="preview-card" aria-label="Generated activity preview">
          <div className="preview-head">
            <h2>Preview</h2>
            <span>Generated by the backend from the saved database activity</span>
          </div>
          {previewUrl ? (
            <iframe title="Generated activity preview" src={previewUrl} />
          ) : (
            <div className="preview-empty">
              Save the style, then choose <strong>Preview generated activity</strong>.
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        :root { color-scheme: light dark; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        .builder-root {
          --builder-bg: var(--bg);
          --builder-text: var(--text);
          --builder-card: var(--surface);
          --builder-muted: var(--muted);
          --builder-border: var(--border);
          --builder-accent: var(--accent);
          min-height: 100%;
          background: var(--builder-bg);
          color: var(--builder-text);
          font-family: inherit;
        }
        button, select, input, textarea { font: inherit; }
        button, select, textarea, input[type="color"] {
          border: 1px solid var(--builder-border);
          border-radius: 9px;
          background: var(--builder-card);
          color: var(--builder-text);
        }
        button { cursor: pointer; padding: 0.65rem 0.9rem; }
        button:hover { border-color: var(--builder-accent); }
        button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 3px solid var(--builder-accent);
          outline-offset: 2px;
        }
        .builder-main {
          width: min(1500px, 100%);
          margin: 0 auto;
          padding: 1rem;
          display: grid;
          grid-template-columns: minmax(320px, 520px) minmax(0, 1fr);
          gap: 1rem;
          align-items: start;
        }
        .editor-card, .preview-card {
          background: var(--builder-card);
          border: 1px solid var(--builder-border);
          border-radius: 14px;
          padding: 1rem;
        }
        h1, h2 { margin-top: 0; }
        .field { display: grid; gap: 0.4rem; margin: 0.9rem 0; }
        .field > span { font-weight: 700; }
        select, textarea { width: 100%; padding: 0.7rem; }
        input[type="color"] { width: 100%; height: 2.8rem; padding: 0.2rem; }
        input[type="range"] { width: 100%; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 0.8rem; }
        .form-grid .wide { grid-column: 1 / -1; }
        .activity-summary { display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0.8rem 0; }
        .activity-summary span, .activity-summary strong {
          border: 1px solid var(--builder-border);
          border-radius: 999px;
          padding: 0.35rem 0.65rem;
        }
        .accessibility-box { display: grid; gap: 0.2rem; }
        .actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1rem; }
        .primary { background: var(--builder-accent); color: white; border-color: var(--builder-accent); }
        .status { min-height: 1.5rem; margin: 1rem 0 0; color: var(--builder-muted); }
        .preview-card { min-height: 75vh; padding: 0; overflow: hidden; }
        .preview-head { padding: 1rem; border-bottom: 1px solid var(--builder-border); }
        .preview-head h2 { margin-bottom: 0.25rem; }
        .preview-head span { color: var(--builder-muted); }
        iframe { width: 100%; height: 72vh; border: 0; background: white; }
        .preview-empty { min-height: 60vh; display: grid; place-items: center; padding: 2rem; text-align: center; color: var(--builder-muted); }
        @media (max-width: 900px) {
          .builder-main { grid-template-columns: 1fr; }
          .preview-card { min-height: 60vh; }
          iframe { height: 65vh; }
        }
        @media (max-width: 520px) {
          .form-grid { grid-template-columns: 1fr; }
          .form-grid .wide { grid-column: auto; }
          .actions { display: grid; }
        }
      `}</style>
      </div>
    </SiteShell>
  );
}
