"use client";

import { useRef, type ChangeEvent } from "react";

const MAX_THEME_BYTES = 100 * 1024;

const CRIMSON_THEME_CSS = `/* WordleStyle — Crimson game theme */
:root {
  --game-bg: #fff7f7;
  --game-bg-accent: #ffe8e9;
  --game-surface: #ffffff;
  --game-surface-soft: #fffafa;
  --game-text: #29181b;
  --game-muted: #79676a;
  --game-primary: #b4232d;
  --game-primary-hover: #8f1b24;
  --game-border: #ead7da;
  --game-highlight: #fff0a8;
  --game-found: #dff6e9;
  --game-found-text: #176443;
  --game-answer: #f9dcef;
  --game-correct: #2f7d5b;
  --game-present: #b5851e;
  --game-absent: #81777a;
  --game-radius: 16px;
}
`;

type GameThemeUploadProps = {
  fileName: string;
  customCss: string;
  onChange: (value: { fileName: string; customCss: string }) => void;
};

export function GameThemeUpload({ fileName, customCss, onChange }: GameThemeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".css")) {
      window.alert("Please choose a .css theme file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_THEME_BYTES) {
      window.alert("Theme files must be 100 KB or smaller.");
      event.target.value = "";
      return;
    }

    const text = await file.text();
    onChange({ fileName: file.name, customCss: text });
  }

  function clearTheme() {
    onChange({ fileName: "", customCss: "" });
    if (inputRef.current) inputRef.current.value = "";
  }

  function downloadCurrentTheme() {
    const css = customCss || CRIMSON_THEME_CSS;
    const name = customCss
      ? (fileName || "wordlestyle-custom-theme.css")
      : "wordlestyle-crimson-theme.css";

    const blob = new Blob([css], { type: "text/css;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="game-theme-upload">
      <div className="game-theme-heading">
        <div>
          <strong>Game theme</strong>
          <small>{customCss ? `${fileName || "Custom theme"} is active` : "Crimson default is active"}</small>
        </div>
        <span className={`theme-file-status ${customCss ? "has-file" : ""}`} aria-live="polite">
          {customCss ? "Custom" : "Crimson"}
        </span>
      </div>

      <div className="theme-upload-actions">
        <label className="theme-upload-button">
          <input
            ref={inputRef}
            type="file"
            accept=".css,text/css"
            onChange={handleUpload}
          />
          <span aria-hidden="true">↑</span>
          {customCss ? "Replace theme" : "Upload theme"}
        </label>

        <button type="button" className="theme-download-button" onClick={downloadCurrentTheme}>
          <span aria-hidden="true">↓</span>
          Download current
        </button>

        {customCss && (
          <button type="button" className="theme-remove-button" onClick={clearTheme}>
            Restore default
          </button>
        )}
      </div>

      {customCss && (
        <div className="uploaded-theme-file" aria-live="polite">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>{fileName || "Custom theme"}</strong>
            <small>{new Blob([customCss]).size.toLocaleString()} bytes · active for future exports</small>
          </div>
        </div>
      )}
    </div>
  );
}
