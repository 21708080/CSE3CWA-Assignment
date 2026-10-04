"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

type Phoneme = {
  symbol: string;
  englishLabel: string;
  example: string | null;
};

type WordRecord = {
  id: number;
  englishWord: string;
  hint: string | null;
  phonemes: Array<{ position: number; phoneme: Phoneme }>;
};

type WordListSummary = {
  id: number;
  name: string;
  description: string | null;
  _count?: { words: number; activities: number };
};

type WordListDetail = {
  id: number;
  name: string;
  description: string | null;
  words: WordRecord[];
  activities?: Array<{ id: number; name: string; type: string }>;
};

async function apiError(response: Response) {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

function parsePhonemeInput(value: string): Phoneme[] {
  const tokens = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) throw new Error("Enter at least one phoneme.");

  return tokens.map((token) => {
    const [symbolRaw = "", labelRaw = "", exampleRaw = ""] = token.split("|").map((part) => part.trim());
    if (!symbolRaw) throw new Error(`Invalid phoneme entry: "${token}"`);

    return {
      symbol: symbolRaw,
      englishLabel: labelRaw || symbolRaw,
      example: exampleRaw || null,
    };
  });
}

function phonemeText(word: WordRecord) {
  return word.phonemes.map((item) => `/${item.phoneme.symbol}/`).join(" ");
}

function phonemeEditorText(word: WordRecord) {
  return word.phonemes
    .map((item) =>
      [
        item.phoneme.symbol,
        item.phoneme.englishLabel,
        item.phoneme.example ?? "",
      ].join("|"),
    )
    .join(", ");
}

export default function WordListsPage() {
  const [lists, setLists] = useState<WordListSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<WordListDetail | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [englishWord, setEnglishWord] = useState("");
  const [hint, setHint] = useState("");
  const [phonemes, setPhonemes] = useState("θ|TH|thin, ɪ|I|sit, n|N|net");
  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [status, setStatus] = useState("Loading word lists…");
  const [statusKind, setStatusKind] = useState<"info" | "success" | "error">("info");
  const [busy, setBusy] = useState(false);

  const selectedSummary = useMemo(
    () => lists.find((item) => String(item.id) === selectedId),
    [lists, selectedId],
  );

  async function loadLists(preferredId?: number) {
    const response = await fetch("/api/wordlists", { cache: "no-store" });
    if (!response.ok) throw new Error(await apiError(response));
    const data = (await response.json()) as WordListSummary[];
    setLists(data);

    const targetId = preferredId
      ? String(preferredId)
      : selectedId && data.some((item) => String(item.id) === selectedId)
        ? selectedId
        : data.length > 0
          ? String(data[0].id)
          : "";

    setSelectedId(targetId);

    if (targetId) {
      await loadDetail(Number(targetId));
    } else {
      setDetail(null);
      setListName("");
      setListDescription("");
    }

    return data;
  }

  async function loadDetail(id: number) {
    const response = await fetch(`/api/wordlists/${id}`, { cache: "no-store" });
    if (!response.ok) throw new Error(await apiError(response));
    const data = (await response.json()) as WordListDetail;
    setDetail(data);
    setListName(data.name);
    setListDescription(data.description ?? "");
    setEditingWordId(null);
    return data;
  }

  useEffect(() => {
    setBusy(true);
    loadLists()
      .then((data) => {
        setStatus(data.length ? "Select a list to manage its words." : "Create your first word list.");
        setStatusKind("info");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load word lists.");
        setStatusKind("error");
      })
      .finally(() => setBusy(false));
  }, []);

  async function selectList(value: string) {
    setSelectedId(value);
    if (!value) {
      setDetail(null);
      return;
    }

    setBusy(true);
    try {
      await loadDetail(Number(value));
      setStatus("Word list loaded from the database.");
      setStatusKind("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load word list.");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  async function createList() {
    if (!newListName.trim()) {
      setStatus("Word list name is required.");
      setStatusKind("error");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/wordlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName.trim(),
          description: newListDescription.trim() || null,
        }),
      });
      if (!response.ok) throw new Error(await apiError(response));
      const created = (await response.json()) as WordListSummary;
      setNewListName("");
      setNewListDescription("");
      await loadLists(created.id);
      setStatus(`Created "${created.name}".`);
      setStatusKind("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create word list.");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  async function updateList() {
    if (!detail) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/wordlists/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: listName.trim(),
          description: listDescription.trim() || null,
        }),
      });
      if (!response.ok) throw new Error(await apiError(response));
      await loadLists(detail.id);
      setStatus("Word list details updated.");
      setStatusKind("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update word list.");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteList() {
    if (!detail) return;
    if (!window.confirm(
      `Delete "${detail.name}"? Its words and linked activity configurations will also be deleted.`,
    )) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/wordlists/${detail.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await apiError(response));
      setSelectedId("");
      setDetail(null);
      await loadLists();
      setStatus("Word list deleted.");
      setStatusKind("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete word list.");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  function resetWordForm() {
    setEditingWordId(null);
    setEnglishWord("");
    setHint("");
    setPhonemes("");
  }

  function editWord(word: WordRecord) {
    setEditingWordId(word.id);
    setEnglishWord(word.englishWord);
    setHint(word.hint ?? "");
    setPhonemes(phonemeEditorText(word));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveWord() {
    if (!detail) {
      setStatus("Choose a word list first.");
      setStatusKind("error");
      return;
    }

    setBusy(true);
    try {
      const parsedPhonemes = parsePhonemeInput(phonemes);
      if (!englishWord.trim()) throw new Error("English word is required.");

      const payload = {
        englishWord: englishWord.trim(),
        hint: hint.trim() || null,
        phonemes: parsedPhonemes,
      };

      const response = await fetch(
        editingWordId
          ? `/api/words/${editingWordId}`
          : `/api/wordlists/${detail.id}/words`,
        {
          method: editingWordId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error(await apiError(response));

      await loadLists(detail.id);
      resetWordForm();
      setStatus(editingWordId ? "Word updated." : "Word added to the list.");
      setStatusKind("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save word.");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteWord(word: WordRecord) {
    if (!detail) return;
    if (!window.confirm(`Delete "${word.englishWord}" from this word list?`)) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/words/${word.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await apiError(response));
      await loadLists(detail.id);
      setStatus(`Deleted "${word.englishWord}".`);
      setStatusKind("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete word.");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <div className="page-stack">
        <section className="page-heading">
          <div>
            <span className="eyebrow">Database content</span>
            <h1>Word lists and phonemes</h1>
            <p>
              Manage the stored content that drives both generated activity types. Phonemes
              are entered as values, so multi-character symbols such as <code>tʃ</code> remain one phoneme.
            </p>
          </div>
          <div className="button-row">
            <Link className="button secondary" href="/wordle">Build Wordle</Link>
            <Link className="button secondary" href="/word-search">Build Word Search</Link>
          </div>
        </section>

        <section className="wordlist-layout">
          <aside className="panel list-sidebar">
            <span className="eyebrow">Stored lists</span>
            <h2>Choose a word list</h2>
            <label className="field">
              <span>Existing list</span>
              <select value={selectedId} onChange={(event) => void selectList(event.target.value)}>
                <option value="">No list selected</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}{typeof list._count?.words === "number" ? ` (${list._count.words})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="divider" />

            <h3>Create new list</h3>
            <label className="field">
              <span>Name</span>
              <input value={newListName} onChange={(event) => setNewListName(event.target.value)} placeholder="TH Practice Set" />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea value={newListDescription} onChange={(event) => setNewListDescription(event.target.value)} rows={3} placeholder="Words practising /θ/" />
            </label>
            <button className="button primary full-width" type="button" onClick={createList} disabled={busy}>
              Create word list
            </button>

            <p className={`status-message ${statusKind}`} role="status">{busy ? "Working…" : status}</p>
          </aside>

          <div className="page-stack">
            {detail ? (
              <>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">Read / update / delete</span>
                      <h2>{detail.name}</h2>
                    </div>
                    <span className="record-badge">List #{detail.id}</span>
                  </div>

                  <div className="two-column-fields">
                    <label className="field">
                      <span>List name</span>
                      <input value={listName} onChange={(event) => setListName(event.target.value)} />
                    </label>
                    <label className="field">
                      <span>Description</span>
                      <input value={listDescription} onChange={(event) => setListDescription(event.target.value)} />
                    </label>
                  </div>

                  <div className="button-row">
                    <button className="button secondary" type="button" onClick={updateList} disabled={busy}>
                      Save list changes
                    </button>
                    <button className="button danger" type="button" onClick={deleteList} disabled={busy}>
                      Delete list
                    </button>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">{editingWordId ? "Update word" : "Create word"}</span>
                      <h2>{editingWordId ? `Editing word #${editingWordId}` : "Add a phoneme word"}</h2>
                    </div>
                    {editingWordId && (
                      <button className="button ghost" type="button" onClick={resetWordForm}>
                        Cancel edit
                      </button>
                    )}
                  </div>

                  <div className="two-column-fields">
                    <label className="field">
                      <span>English word</span>
                      <input value={englishWord} onChange={(event) => setEnglishWord(event.target.value)} placeholder="thin" />
                    </label>
                    <label className="field">
                      <span>Hint</span>
                      <input value={hint} onChange={(event) => setHint(event.target.value)} placeholder="Not thick" />
                    </label>
                  </div>

                  <label className="field">
                    <span>Phonemes</span>
                    <textarea value={phonemes} onChange={(event) => setPhonemes(event.target.value)} rows={3} placeholder="θ|TH|thin, ɪ|I|sit, n|N|net" />
                    <small>
                      Format: <code>symbol|English label|example</code>, separated by commas.
                      Example: <code>θ|TH|thin, ɪ|I|sit, n|N|net</code>.
                    </small>
                  </label>

                  <button className="button primary" type="button" onClick={saveWord} disabled={busy}>
                    {editingWordId ? "Update word" : "Add word"}
                  </button>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">Stored words</span>
                      <h2>{detail.words.length} word{detail.words.length === 1 ? "" : "s"} in this list</h2>
                    </div>
                  </div>

                  {detail.words.length === 0 ? (
                    <div className="empty-state">No words yet. Add the first phoneme word above.</div>
                  ) : (
                    <div className="word-table-wrap">
                      <table className="word-table">
                        <thead>
                          <tr>
                            <th>English</th>
                            <th>Phoneme sequence</th>
                            <th>Hint</th>
                            <th><span className="sr-only">Actions</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.words.map((word) => (
                            <tr key={word.id}>
                              <td><strong>{word.englishWord}</strong></td>
                              <td className="phoneme-display">{phonemeText(word)}</td>
                              <td>{word.hint || "—"}</td>
                              <td>
                                <div className="table-actions">
                                  <button className="button ghost small" type="button" onClick={() => editWord(word)}>Edit</button>
                                  <button className="button danger small" type="button" onClick={() => void deleteWord(word)}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : (
              <section className="panel empty-state large">
                <h2>Create or choose a word list</h2>
                <p>The selected list will appear here with full word CRUD controls.</p>
              </section>
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
