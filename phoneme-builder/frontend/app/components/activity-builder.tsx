"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ActivityType = "WORDLE" | "WORD_SEARCH";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

type WordListSummary = {
  id: number;
  name: string;
  description: string | null;
  _count?: { words: number; activities: number };
};

type ActivitySummary = {
  id: number;
  name: string;
  type: ActivityType;
  difficulty: Difficulty;
  hintsEnabled: boolean;
  showEnglishAnswer: boolean;
  maxAttempts: number | null;
  gridSize: number | null;
  wordListId: number;
  wordList: { id: number; name: string };
};

async function apiError(response: Response) {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "phoneme-activity";
}

export default function ActivityBuilder({ type }: { type: ActivityType }) {
  const isWordle = type === "WORDLE";
  const typeLabel = isWordle ? "Wordle" : "Word Search";

  const [wordLists, setWordLists] = useState<WordListSummary[]>([]);
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState(`New Phoneme ${typeLabel}`);
  const [wordListId, setWordListId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("EASY");
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [showEnglishAnswer, setShowEnglishAnswer] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(6);
  const [gridSize, setGridSize] = useState(12);
  const [status, setStatus] = useState("Loading stored data…");
  const [statusKind, setStatusKind] = useState<"info" | "success" | "error">("info");
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const selectedList = useMemo(
    () => wordLists.find((item) => String(item.id) === wordListId),
    [wordLists, wordListId],
  );

  async function loadData(preferredActivityId?: number) {
    try {
      const [listsResponse, activitiesResponse] = await Promise.all([
        fetch("/api/wordlists", { cache: "no-store" }),
        fetch("/api/activities", { cache: "no-store" }),
      ]);

      if (!listsResponse.ok) throw new Error(await apiError(listsResponse));
      if (!activitiesResponse.ok) throw new Error(await apiError(activitiesResponse));

      const lists = (await listsResponse.json()) as WordListSummary[];
      const allActivities = (await activitiesResponse.json()) as ActivitySummary[];
      const matching = allActivities.filter((item) => item.type === type);

      setWordLists(lists);
      setActivities(matching);

      if (!wordListId && lists.length > 0) {
        setWordListId(String(lists[0].id));
      }

      if (preferredActivityId) {
        const saved = matching.find((item) => item.id === preferredActivityId);
        if (saved) loadActivityIntoForm(saved);
      }

      setStatus(
        lists.length === 0
          ? "Create a word list before saving an activity."
          : `${lists.length} word list${lists.length === 1 ? "" : "s"} available.`,
      );
      setStatusKind("info");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load builder data.");
      setStatusKind("error");
    }
  }

  useEffect(() => {
    void loadData();
  }, [type]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function loadActivityIntoForm(activity: ActivitySummary) {
    setSelectedId(String(activity.id));
    setName(activity.name);
    setWordListId(String(activity.wordListId));
    setDifficulty(activity.difficulty);
    setHintsEnabled(activity.hintsEnabled);
    setShowEnglishAnswer(activity.showEnglishAnswer);
    setMaxAttempts(activity.maxAttempts ?? 6);
    setGridSize(activity.gridSize ?? 12);
  }

  function chooseExisting(value: string) {
    if (!value) {
      newActivity();
      return;
    }

    const activity = activities.find((item) => String(item.id) === value);
    if (activity) {
      loadActivityIntoForm(activity);
      setStatus(`Loaded "${activity.name}" from the database.`);
      setStatusKind("success");
    }
  }

  function newActivity() {
    setSelectedId("");
    setName(`New Phoneme ${typeLabel}`);
    setDifficulty("EASY");
    setHintsEnabled(true);
    setShowEnglishAnswer(true);
    setMaxAttempts(6);
    setGridSize(12);
    if (wordLists.length > 0) setWordListId(String(wordLists[0].id));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setStatus("New unsaved activity.");
    setStatusKind("info");
  }

  async function saveActivity(): Promise<ActivitySummary> {
    if (!name.trim()) throw new Error("Activity name is required.");
    if (!wordListId) throw new Error("Choose a word list first.");

    const payload = {
      name: name.trim(),
      type,
      difficulty,
      hintsEnabled,
      showEnglishAnswer,
      wordListId: Number(wordListId),
      maxAttempts: isWordle ? maxAttempts : null,
      gridSize: isWordle ? null : gridSize,
    };

    const url = selectedId ? `/api/activities/${selectedId}` : "/api/activities";
    const method = selectedId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(await apiError(response));

    const saved = (await response.json()) as ActivitySummary;
    setSelectedId(String(saved.id));
    await loadData(saved.id);
    return saved;
  }

  async function handleSave() {
    setBusy(true);
    try {
      const saved = await saveActivity();
      setStatus(`Saved "${saved.name}" to the database.`);
      setStatusKind("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save activity.");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  async function generate(mode: "preview" | "download") {
    setBusy(true);
    try {
      const saved = await saveActivity();
      const response = await fetch(`/api/activities/${saved.id}/generate`, { method: "POST" });
      if (!response.ok) throw new Error(await apiError(response));

      const blob = await response.blob();

      if (mode === "preview") {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const nextUrl = URL.createObjectURL(blob);
        setPreviewUrl(nextUrl);
        setStatus(`Preview generated from saved activity #${saved.id}.`);
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${slugify(saved.name)}.html`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus(`Downloaded ${slugify(saved.name)}.html`);
      }

      setStatusKind("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not generate activity.");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteActivity() {
    if (!selectedId) return;
    if (!window.confirm("Delete this saved activity configuration? The word list will remain.")) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/activities/${selectedId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await apiError(response));

      newActivity();
      await loadData();
      setStatus("Activity configuration deleted.");
      setStatusKind("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete activity.");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  const wordCount = selectedList?._count?.words;

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Teacher builder</span>
          <h1>Phoneme {typeLabel}</h1>
          <p>
            Configure a saved database activity, preview the backend-generated result,
            then download it as one standalone HTML file.
          </p>
        </div>
        <Link className="button secondary" href="/wordlists">Manage word lists</Link>
      </section>

      {wordLists.length === 0 && (
        <section className="notice warning">
          <strong>No word lists yet.</strong>
          <span>
            Create a phoneme word list first, then return here to build the activity.
          </span>
          <Link href="/wordlists">Create word list</Link>
        </section>
      )}

      <section className="builder-layout">
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <span className="step-number">1</span>
              <h2>Activity settings</h2>
            </div>
            <button type="button" className="button ghost" onClick={newActivity} disabled={busy}>
              New activity
            </button>
          </div>

          <label className="field">
            <span>Saved {typeLabel} configuration</span>
            <select value={selectedId} onChange={(event) => chooseExisting(event.target.value)}>
              <option value="">New / unsaved</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  #{activity.id} — {activity.name}
                </option>
              ))}
            </select>
            <small>Loading an existing item demonstrates the read/update part of CRUD.</small>
          </label>

          <label className="field">
            <span>Activity name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="field">
            <span>Word list</span>
            <select value={wordListId} onChange={(event) => setWordListId(event.target.value)}>
              <option value="">Choose a word list</option>
              {wordLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}{typeof list._count?.words === "number" ? ` (${list._count.words} words)` : ""}
                </option>
              ))}
            </select>
            {typeof wordCount === "number" && (
              <small>
                Selected list contains {wordCount} word{wordCount === 1 ? "" : "s"}.
                {!isWordle && wordCount < 5 ? " Word Search works best with about five or more." : ""}
              </small>
            )}
          </label>

          <div className="two-column-fields">
            <label className="field">
              <span>Difficulty</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </label>

            {isWordle ? (
              <label className="field">
                <span>Maximum attempts</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={maxAttempts}
                  onChange={(event) => setMaxAttempts(Math.max(1, Number(event.target.value) || 1))}
                />
              </label>
            ) : (
              <label className="field">
                <span>Grid size</span>
                <input
                  type="number"
                  min={6}
                  max={20}
                  value={gridSize}
                  onChange={(event) => setGridSize(Math.max(6, Number(event.target.value) || 6))}
                />
              </label>
            )}
          </div>

          <div className="check-grid">
            <label className="check-card">
              <input
                type="checkbox"
                checked={hintsEnabled}
                onChange={(event) => setHintsEnabled(event.target.checked)}
              />
              <span>
                <strong>Hints enabled</strong>
                <small>Show the stored teacher hint during play.</small>
              </span>
            </label>
            <label className="check-card">
              <input
                type="checkbox"
                checked={showEnglishAnswer}
                onChange={(event) => setShowEnglishAnswer(event.target.checked)}
              />
              <span>
                <strong>English equivalence</strong>
                <small>Reveal the English word when the answer is completed.</small>
              </span>
            </label>
          </div>

          <div className="button-row">
            <button className="button secondary" type="button" onClick={handleSave} disabled={busy || wordLists.length === 0}>
              {selectedId ? "Update saved activity" : "Save activity"}
            </button>
            <button className="button primary" type="button" onClick={() => void generate("preview")} disabled={busy || wordLists.length === 0}>
              Preview generated activity
            </button>
            <button className="button primary" type="button" onClick={() => void generate("download")} disabled={busy || wordLists.length === 0}>
              Download HTML
            </button>
            {selectedId && (
              <button className="button danger" type="button" onClick={deleteActivity} disabled={busy}>
                Delete activity
              </button>
            )}
          </div>

          <p className={`status-message ${statusKind}`} role="status">{busy ? "Working…" : status}</p>

          {selectedId && (
            <div className="linked-action">
              <div>
                <strong>Appearance and accessibility</strong>
                <p>Theme, contrast, text size, focus and generated-game styling are stored separately for this activity.</p>
              </div>
              <Link className="button ghost" href="/builder">Open appearance editor</Link>
            </div>
          )}
        </div>

        <section className="panel preview-panel">
          <div className="panel-heading">
            <div>
              <span className="step-number">2</span>
              <h2>Generated preview</h2>
            </div>
            {selectedId && <span className="record-badge">Activity #{selectedId}</span>}
          </div>

          {previewUrl ? (
            <iframe
              className="activity-preview"
              src={previewUrl}
              title={`Generated ${typeLabel} activity preview`}
            />
          ) : (
            <div className="preview-placeholder">
              <span aria-hidden="true" className="preview-icon">{isWordle ? "W" : "⌗"}</span>
              <h3>No preview generated yet</h3>
              <p>
                Save the configuration and choose <strong>Preview generated activity</strong>.
                The iframe receives the same standalone HTML that can be downloaded.
              </p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
