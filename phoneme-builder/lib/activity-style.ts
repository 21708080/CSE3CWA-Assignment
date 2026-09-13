
export type ActivityStyleData = {
  themeMode?: "LIGHT" | "DARK" | "SYSTEM";
  accentColor?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  fontScale?: number | null;
  highContrast?: boolean | null;
  reducedMotion?: boolean | null;
  enhancedFocus?: boolean | null;
  largeControls?: boolean | null;
  customCss?: string | null;
} | null;

function safeHex(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

function safeScale(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1.6, Math.max(0.8, value))
    : 1;
}

function safeCustomCss(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<\/?style/gi, "")
    .replace(/<\/?script/gi, "")
    .replace(/@import/gi, "")
    .replace(/javascript:/gi, "");
}

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function applyActivityStyle(html: string, style: ActivityStyleData): string {
  const themeMode = style?.themeMode ?? "LIGHT";
  const theme = themeMode.toLowerCase();
  const accent = safeHex(style?.accentColor, "#e11d48");
  const configuredBg = safeHex(style?.backgroundColor, "#ffe4e7");
  const configuredText = safeHex(style?.textColor, "#0f172a");
  const scale = safeScale(style?.fontScale);
  const highContrast = style?.highContrast === true;
  const reducedMotion = style?.reducedMotion === true;
  const enhancedFocus = style?.enhancedFocus !== false;
  const largeControls = style?.largeControls === true;
  const customCss = safeCustomCss(style?.customCss);

  const defaults = {
    theme,
    highContrast,
    reducedMotion,
    enhancedFocus,
    largeControls,
    fontScale: scale,
  };

  const css = `
<style id="embedded-activity-theme">
  html {
    --theme-bg: ${configuredBg};
    --theme-text: ${configuredText};
    --theme-surface: #ffffff;
    --theme-surface-2: #fff1f2;
    --theme-border: #fecdd3;
    --theme-accent: ${accent};
    --theme-focus: ${accent};
    --theme-font-scale: ${scale};
    color-scheme: light;
  }

  html[data-activity-theme="dark"] {
    --theme-bg: #0b1220;
    --theme-text: #f8fafc;
    --theme-surface: #111827;
    --theme-surface-2: #1f2937;
    --theme-border: #475569;
    --theme-accent: ${accent};
    --theme-focus: #facc15;
    color-scheme: dark;
  }

  html[data-activity-theme="system"] {
    --theme-bg: ${configuredBg};
    --theme-text: ${configuredText};
    --theme-surface: #ffffff;
    --theme-surface-2: #fff1f2;
    --theme-border: #fecdd3;
    color-scheme: light dark;
  }

  @media (prefers-color-scheme: dark) {
    html[data-activity-theme="system"] {
      --theme-bg: #0b1220;
      --theme-text: #f8fafc;
      --theme-surface: #111827;
      --theme-surface-2: #1f2937;
      --theme-border: #475569;
      --theme-focus: #facc15;
    }
  }

  body {
    background: var(--theme-bg) !important;
    color: var(--theme-text) !important;
    font-size: calc(1rem * var(--theme-font-scale));
  }

  main, section, aside, header, footer,
  .activity-shell, .game-shell, .panel, .card, .legend, .status,
  .word-list, .target-list, .instructions {
    color: inherit;
  }

  .panel, .card, .legend, .status, .instructions,
  .word-card, .target-item, .keyboard-section {
    background-color: var(--theme-surface) !important;
    border-color: var(--theme-border) !important;
    color: var(--theme-text) !important;
  }

  button:not(.correct):not(.present):not(.absent):not(.found),
  select,
  input,
  .phoneme-key:not(.correct):not(.present):not(.absent),
  .grid-cell:not(.found):not(.selected):not(.selection-preview) {
    background-color: var(--theme-surface) !important;
    border-color: var(--theme-border) !important;
    color: var(--theme-text) !important;
  }

  button:hover:not(:disabled):not(.correct):not(.present):not(.absent):not(.found),
  .phoneme-key:hover:not(:disabled):not(.correct):not(.present):not(.absent) {
    border-color: var(--theme-accent) !important;
  }

  a { color: var(--theme-accent); }

  html[data-enhanced-focus="true"] :focus-visible {
    outline: 4px solid var(--theme-focus) !important;
    outline-offset: 3px !important;
  }

  html[data-large-controls="true"] button:not(.cell),
  html[data-large-controls="true"] .phoneme-key,
  html[data-large-controls="true"] .grid-cell {
    min-width: 3rem;
    min-height: 3rem;
    padding: 0.7rem !important;
  }

  html[data-large-controls="true"] .cell {
    min-width: 0 !important;
    min-height: 0 !important;
    width: 100% !important;
    aspect-ratio: 1 / 1;
    padding: 0 !important;
  }

  html[data-reduced-motion="true"] *,
  html[data-reduced-motion="true"] *::before,
  html[data-reduced-motion="true"] *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }

  html[data-high-contrast="true"] {
    --theme-bg: #000000;
    --theme-text: #ffffff;
    --theme-surface: #000000;
    --theme-surface-2: #111111;
    --theme-border: #ffffff;
    --theme-accent: #00ffff;
    --theme-focus: #ffff00;
    color-scheme: dark;
  }

  html[data-high-contrast="true"] button:not(.correct):not(.present):not(.absent):not(.found),
  html[data-high-contrast="true"] .phoneme-key:not(.correct):not(.present):not(.absent),
  html[data-high-contrast="true"] .grid-cell:not(.found):not(.selected):not(.selection-preview) {
    border-width: 2px !important;
  }


  #keyboard button.correct,
  .tile.correct {
    background-color: #15803d !important;
    border-color: #166534 !important;
    color: #ffffff !important;
  }

  #keyboard button.present,
  .tile.present {
    background-color: #a16207 !important;
    border-color: #854d0e !important;
    color: #ffffff !important;
  }

  #keyboard button.absent,
  .tile.absent {
    background-color: #475569 !important;
    border-color: #334155 !important;
    color: #ffffff !important;
  }

  #keyboard button.correct .choice-label,
  #keyboard button.present .choice-label,
  #keyboard button.absent .choice-label {
    color: #ffffff !important;
  }

  .game-result-mask {
    position: fixed !important;
    inset: 0 !important;
    z-index: 12000 !important;
    display: grid !important;
    place-items: center !important;
    padding: 20px !important;
    background: rgba(15, 23, 42, 0.76) !important;
    backdrop-filter: blur(4px);
  }

  .game-result-mask[hidden] {
    display: none !important;
  }

  .game-result-dialog {
    width: min(92vw, 480px);
    max-height: 90vh;
    overflow: auto;
    padding: clamp(22px, 5vw, 34px);
    border: 2px solid var(--theme-border);
    border-radius: 18px;
    background: var(--theme-surface) !important;
    color: var(--theme-text) !important;
    box-shadow: 0 24px 80px rgba(0,0,0,0.38);
    text-align: center;
  }

  .game-result-icon {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    margin: 0 auto 14px;
    border-radius: 999px;
    border: 2px solid var(--theme-border);
    font-size: 2rem;
    font-weight: 900;
  }

  .game-result-dialog[data-result="win"] .game-result-icon {
    background: #dcfce7 !important;
    border-color: #15803d !important;
    color: #14532d !important;
  }

  .game-result-dialog[data-result="lose"] .game-result-icon {
    background: #fee2e2 !important;
    border-color: #b91c1c !important;
    color: #7f1d1d !important;
  }

  .game-result-new {
    min-width: 180px;
    margin-top: 16px;
    background: var(--theme-accent) !important;
    border-color: var(--theme-accent) !important;
    color: #ffffff !important;
    font-weight: 800;
  }

  #activity-settings-toggle {
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 10001;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-width: auto;
    border: 2px solid var(--theme-border);
    border-radius: 999px;
    padding: 0.65rem 0.85rem;
    background: var(--theme-surface) !important;
    color: var(--theme-text) !important;
    box-shadow: 0 6px 24px rgba(0,0,0,0.16);
    font-weight: 700;
  }

  #activity-settings-toggle .burger-icon {
    font-size: 1.25em;
    line-height: 1;
  }

  #activity-settings-panel {
    position: fixed;
    top: 64px;
    right: 12px;
    z-index: 10000;
    width: min(360px, calc(100vw - 24px));
    max-height: calc(100vh - 80px);
    overflow: auto;
    border: 2px solid var(--theme-border);
    border-radius: 14px;
    padding: 16px;
    background: var(--theme-surface) !important;
    color: var(--theme-text) !important;
    box-shadow: 0 14px 42px rgba(0,0,0,0.25);
  }

  #activity-settings-panel[hidden] {
    display: none !important;
  }

  .activity-settings-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .activity-settings-heading h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  #activity-settings-close {
    min-width: 2.5rem;
    min-height: 2.5rem;
    padding: 0.35rem;
    font-size: 1.25rem;
  }

  .activity-settings-group {
    border: 0;
    border-top: 1px solid var(--theme-border);
    margin: 0;
    padding: 14px 0 0;
  }

  .activity-settings-group + .activity-settings-group {
    margin-top: 14px;
  }

  .activity-settings-group legend {
    padding-right: 8px;
    font-weight: 800;
  }

  .activity-settings-field {
    display: grid;
    gap: 6px;
    margin: 10px 0;
  }

  .activity-settings-field select,
  .activity-settings-field input[type="range"] {
    width: 100%;
    min-height: 2.6rem;
  }

  .activity-settings-check {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 11px 0;
    line-height: 1.4;
  }

  .activity-settings-check input {
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.05rem;
    flex: 0 0 auto;
  }

  .activity-settings-help {
    color: inherit;
    opacity: 0.78;
    font-size: 0.86rem;
    line-height: 1.4;
  }

  .activity-settings-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  html[data-large-controls="true"] #activity-settings-toggle,
  html[data-large-controls="true"] #activity-settings-panel button,
  html[data-large-controls="true"] #activity-settings-panel select {
    min-height: 3rem;
  }

  @media (max-width: 560px) {
    #activity-settings-toggle .settings-label {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
      border: 0;
    }

    #activity-settings-panel {
      top: 60px;
      left: 8px;
      right: 8px;
      width: auto;
    }
  }

  ${customCss}
</style>`;

  const attributes = [
    `data-activity-theme="${theme}"`,
    `data-high-contrast="${highContrast}"`,
    `data-reduced-motion="${reducedMotion}"`,
    `data-enhanced-focus="${enhancedFocus}"`,
    `data-large-controls="${largeControls}"`,
  ].join(" ");

  const controls = `
<button
  id="activity-settings-toggle"
  type="button"
  aria-expanded="false"
  aria-controls="activity-settings-panel"
  aria-label="Open appearance and accessibility settings"
>
  <span class="burger-icon" aria-hidden="true">☰</span>
  <span class="settings-label">Appearance</span>
</button>

<aside
  id="activity-settings-panel"
  aria-label="Appearance and accessibility settings"
  hidden
>
  <div class="activity-settings-heading">
    <h2>Appearance &amp; accessibility</h2>
    <button id="activity-settings-close" type="button" aria-label="Close settings">×</button>
  </div>

  <fieldset class="activity-settings-group">
    <legend>Theme</legend>
    <label class="activity-settings-field" for="activity-theme-select">
      <span>Colour mode</span>
      <select id="activity-theme-select">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </label>
  </fieldset>

  <fieldset class="activity-settings-group">
    <legend>Accessibility</legend>

    <label class="activity-settings-check">
      <input id="activity-high-contrast" type="checkbox">
      <span>
        <strong>High contrast</strong><br>
        <span class="activity-settings-help">Uses black, white, cyan and yellow for stronger visual separation.</span>
      </span>
    </label>

    <label class="activity-settings-check">
      <input id="activity-large-controls" type="checkbox">
      <span>
        <strong>Larger controls</strong><br>
        <span class="activity-settings-help">Makes phoneme keys, grid cells and buttons easier to target.</span>
      </span>
    </label>

    <label class="activity-settings-check">
      <input id="activity-enhanced-focus" type="checkbox">
      <span>
        <strong>Enhanced keyboard focus</strong><br>
        <span class="activity-settings-help">Adds a strong outline to the currently focused control.</span>
      </span>
    </label>

    <label class="activity-settings-check">
      <input id="activity-reduced-motion" type="checkbox">
      <span>
        <strong>Reduced motion</strong><br>
        <span class="activity-settings-help">Minimises animations and transitions.</span>
      </span>
    </label>

    <label class="activity-settings-field" for="activity-font-scale">
      <span><strong>Text size</strong>: <output id="activity-font-scale-output">100%</output></span>
      <input id="activity-font-scale" type="range" min="0.8" max="1.6" step="0.05" value="1">
    </label>
  </fieldset>

  <div class="activity-settings-actions">
    <button id="activity-settings-reset" type="button">Reset to activity defaults</button>
    <button id="activity-settings-done" type="button">Done</button>
  </div>
</aside>`;

  const script = `
<script id="embedded-activity-settings-script">
(function () {
  "use strict";

  var DEFAULTS = ${safeJson(defaults)};
  var root = document.documentElement;
  var toggle = document.getElementById("activity-settings-toggle");
  var panel = document.getElementById("activity-settings-panel");
  var closeButton = document.getElementById("activity-settings-close");
  var doneButton = document.getElementById("activity-settings-done");
  var resetButton = document.getElementById("activity-settings-reset");
  var themeSelect = document.getElementById("activity-theme-select");
  var highContrastInput = document.getElementById("activity-high-contrast");
  var largeControlsInput = document.getElementById("activity-large-controls");
  var enhancedFocusInput = document.getElementById("activity-enhanced-focus");
  var reducedMotionInput = document.getElementById("activity-reduced-motion");
  var fontScaleInput = document.getElementById("activity-font-scale");
  var fontScaleOutput = document.getElementById("activity-font-scale-output");

  if (!toggle || !panel || !themeSelect || !fontScaleInput) return;

  var storageKey = "phoneme-activity-display-preferences-v1";

  function clampScale(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return DEFAULTS.fontScale;
    return Math.min(1.6, Math.max(0.8, number));
  }

  function normalise(value) {
    var source = value && typeof value === "object" ? value : {};
    return {
      theme: source.theme === "dark" || source.theme === "system" ? source.theme : "light",
      highContrast: source.highContrast === true,
      reducedMotion: source.reducedMotion === true,
      enhancedFocus: source.enhancedFocus !== false,
      largeControls: source.largeControls === true,
      fontScale: clampScale(source.fontScale)
    };
  }

  function readSaved() {
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) return normalise(DEFAULTS);
      return normalise(Object.assign({}, DEFAULTS, JSON.parse(raw)));
    } catch (_error) {
      return normalise(DEFAULTS);
    }
  }

  function savePreferences(preferences) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch (_error) {}
  }

  function apply(preferences, persist) {
    var prefs = normalise(preferences);

    root.dataset.activityTheme = prefs.theme;
    root.dataset.highContrast = String(prefs.highContrast);
    root.dataset.reducedMotion = String(prefs.reducedMotion);
    root.dataset.enhancedFocus = String(prefs.enhancedFocus);
    root.dataset.largeControls = String(prefs.largeControls);
    root.style.setProperty("--theme-font-scale", String(prefs.fontScale));

    themeSelect.value = prefs.theme;
    highContrastInput.checked = prefs.highContrast;
    reducedMotionInput.checked = prefs.reducedMotion;
    enhancedFocusInput.checked = prefs.enhancedFocus;
    largeControlsInput.checked = prefs.largeControls;
    fontScaleInput.value = String(prefs.fontScale);
    fontScaleOutput.textContent = Math.round(prefs.fontScale * 100) + "%";

    if (persist) savePreferences(prefs);
    return prefs;
  }

  function currentFromControls() {
    return {
      theme: themeSelect.value,
      highContrast: highContrastInput.checked,
      reducedMotion: reducedMotionInput.checked,
      enhancedFocus: enhancedFocusInput.checked,
      largeControls: largeControlsInput.checked,
      fontScale: Number(fontScaleInput.value)
    };
  }

  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    window.setTimeout(function () { themeSelect.focus(); }, 0);
  }

  function closePanel() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  }

  function updateFromControls() {
    apply(currentFromControls(), true);
  }

  toggle.addEventListener("click", function () {
    if (panel.hidden) openPanel();
    else closePanel();
  });

  closeButton.addEventListener("click", closePanel);
  doneButton.addEventListener("click", closePanel);

  themeSelect.addEventListener("change", updateFromControls);
  highContrastInput.addEventListener("change", updateFromControls);
  reducedMotionInput.addEventListener("change", updateFromControls);
  enhancedFocusInput.addEventListener("change", updateFromControls);
  largeControlsInput.addEventListener("change", updateFromControls);

  fontScaleInput.addEventListener("input", function () {
    fontScaleOutput.textContent = Math.round(Number(fontScaleInput.value) * 100) + "%";
    updateFromControls();
  });

  resetButton.addEventListener("click", function () {
    try { localStorage.removeItem(storageKey); } catch (_error) {}
    apply(DEFAULTS, false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });

  document.addEventListener("pointerdown", function (event) {
    if (panel.hidden) return;
    if (panel.contains(event.target) || toggle.contains(event.target)) return;
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  });

  apply(readSaved(), false);
})();
</script>`;

  let result = html.replace(/<html(\s[^>]*)?>/i, (match) => {
    if (/data-activity-theme=/i.test(match)) return match;
    return match.replace(/>$/, ` ${attributes}>`);
  });

  if (/<\/head>/i.test(result)) {
    result = result.replace(/<\/head>/i, `${css}\n</head>`);
  } else {
    result = css + result;
  }

  if (/<\/body>/i.test(result)) {
    result = result.replace(/<\/body>/i, `${controls}\n${script}\n</body>`);
  } else {
    result += controls + script;
  }

  return result;
}
