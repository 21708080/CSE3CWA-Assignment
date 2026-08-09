"use client";

import { useEffect, useMemo, useState } from "react";
import { starterWords } from "@/data/phonemeWords";
import { downloadHtml } from "@/lib/downloadHtml";
import { generateWordSearchHtml } from "@/lib/generators/generateWordSearchHtml";
import { createWordSearchPuzzle } from "@/lib/word-search/generatePuzzle";
import type { Difficulty } from "@/types/wordSearch";
import { WordSearchPreview } from "./WordSearchPreview";
import { GAME_THEME_EVENT, readGameThemePreference } from "@/lib/gameThemePreference";

export function WordSearchBuilder() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [showHints, setShowHints] = useState(true);
  const [words, setWords] = useState(starterWords);
  const [puzzleVersion, setPuzzleVersion] = useState(0);
  const [customCss, setCustomCss] = useState("");

  useEffect(() => {
    const syncTheme = () => {
      const theme = readGameThemePreference();
      setCustomCss(theme.customCss);
    };

    syncTheme();
    window.addEventListener(GAME_THEME_EVENT, syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener(GAME_THEME_EVENT, syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const validWords = useMemo(
    () => words.filter((word) => word.english.trim() && word.phonemes.length > 0),
    [words],
  );

  const puzzleResult = useMemo(() => {
    try {
      return { puzzle: createWordSearchPuzzle(validWords, difficulty), error: "" };
    } catch (caught) {
      return {
        puzzle: null,
        error: caught instanceof Error ? caught.message : "Could not build puzzle.",
      };
    }

  }, [validWords, difficulty, puzzleVersion]);

  const { puzzle, error } = puzzleResult;

  function updateWord(index: number, field: "english" | "phonemes", value: string) {
    setWords((current) =>
      current.map((word, i) =>
        i === index
          ? {
              ...word,
              [field]:
                field === "phonemes"
                  ? value.trim().split(/\s+/).filter(Boolean)
                  : value,
              hint:
                field === "english" && value.trim()
                  ? `${value.trim()} hint`
                  : word.hint,
            }
          : word,
      ),
    );
  }

  function addWord() {
    setWords((current) => {
      if (current.length >= 15) return current;

      const id = `word-${Date.now()}-${current.length + 1}`;
      return [
        ...current,
        {
          id,
          english: "",
          phonemes: [],
          hint: "",
        },
      ];
    });
  }

  function removeWord(index: number) {
    setWords((current) => current.filter((_, i) => i !== index));
  }

  function handleGenerate() {
    if (!puzzle || validWords.length === 0) return;
    downloadHtml(
      generateWordSearchHtml(
        { words: validWords, difficulty, showHints },
        puzzle,
        customCss,
      ),
      "phoneme-word-search.html",
    );
  }

  return (
    <div className="builder-layout">
      <section className="builder-panel" aria-labelledby="settings-title">
        <div className="section-kicker">Step 1</div>
        <h2 id="settings-title">Activity settings</h2>
        <p className="muted">
          Edit the starter words or add more. Separate each phoneme with a space.
        </p>

        <div className="word-editor-heading">
          <span>{words.length} word{words.length === 1 ? "" : "s"}</span>
          <span>Up to 15</span>
        </div>

        <div className="word-editor">
          {words.map((word, index) => (
            <div className="word-row" key={word.id}>
              <span className="word-number">{index + 1}</span>
              <label>
                <span>Phonemes</span>
                <input
                  value={word.phonemes.join(" ")}
                  onChange={(event) =>
                    updateWord(index, "phonemes", event.target.value)
                  }
                  aria-label={`Word ${index + 1} phonemes`}
                />
              </label>
              <label>
                <span>English</span>
                <input
                  value={word.english}
                  onChange={(event) =>
                    updateWord(index, "english", event.target.value)
                  }
                  aria-label={`Word ${index + 1} English equivalent`}
                />
              </label>
              <button
                type="button"
                className="remove-word-button"
                onClick={() => removeWord(index)}
                aria-label={`Remove word ${index + 1}`}
                title="Remove word"
                disabled={words.length <= 1}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="add-word-button"
          onClick={addWord}
          disabled={words.length >= 15}
        >
          <span aria-hidden="true">＋</span> Add another word
        </button>

        <div className="control-grid">
          <label>
            <span>Difficulty</span>
            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as Difficulty)
              }
            >
              <option value="easy">Easy — 8 × 8</option>
              <option value="medium">Medium — 10 × 10</option>
              <option value="hard">Hard — 12 × 12</option>
            </select>
          </label>

          <label className="toggle-line">
            <span>
              <strong>Show hints</strong>
              <small>Show the English equivalent beside each target.</small>
            </span>
            <input
              type="checkbox"
              checked={showHints}
              onChange={(event) => setShowHints(event.target.checked)}
            />
          </label>
        </div>


        {error && <p className="builder-error">{error}</p>}

        <button
          className="primary-button"
          onClick={handleGenerate}
          disabled={!puzzle || validWords.length === 0}
        >
          Generate playable HTML <span aria-hidden="true">↗</span>
        </button>
      </section>

      <section className="preview-shell" aria-labelledby="preview-title">
        <div className="preview-top">
          <div>
            <div className="section-kicker">Step 2</div>
            <h2 id="preview-title">Live playable preview</h2>
          </div>
          
        </div>

        {puzzle ? (
          <WordSearchPreview
            key={`${difficulty}-${puzzleVersion}-${validWords.map((word) => word.phonemes.join(".")).join("|")}`}
            puzzle={puzzle}
            words={validWords}
            showHints={showHints}
            onRegenerate={() => setPuzzleVersion((current) => current + 1)}
          />
        ) : (
          <div className="paper-preview">
            <p className="builder-error">{error || "Add at least one valid word."}</p>
          </div>
        )}
      </section>
    </div>
  );
}
