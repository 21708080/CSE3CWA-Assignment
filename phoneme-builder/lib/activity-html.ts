
type Difficulty = "EASY" | "MEDIUM" | "HARD";
type ActivityType = "WORDLE" | "WORD_SEARCH";

type GenerationActivity = {
  id: number;
  name: string;
  type: ActivityType;
  difficulty: Difficulty;
  hintsEnabled: boolean;
  showEnglishAnswer: boolean;
  maxAttempts: number | null;
  gridSize: number | null;
  wordList: {
    id: number;
    name: string;
    description: string | null;
    words: Array<{
      id: number;
      englishWord: string;
      hint: string | null;
      phonemes: Array<{
        position: number;
        phoneme: {
          symbol: string;
          englishLabel: string;
          example: string | null;
        };
      }>;
    }>;
  };
};

type SerializablePhoneme = {
  symbol: string;
  englishLabel: string;
  example: string | null;
};

type SerializableWord = {
  englishWord: string;
  hint: string | null;
  phonemes: SerializablePhoneme[];
};

const STANDARD_ENGLISH_PHONEMES: SerializablePhoneme[] = [
  { symbol: "p", englishLabel: "P", example: "pen" },
  { symbol: "b", englishLabel: "B", example: "bat" },
  { symbol: "t", englishLabel: "T", example: "top" },
  { symbol: "d", englishLabel: "D", example: "dog" },
  { symbol: "k", englishLabel: "K", example: "cat" },
  { symbol: "g", englishLabel: "G", example: "go" },
  { symbol: "f", englishLabel: "F", example: "fish" },
  { symbol: "v", englishLabel: "V", example: "van" },
  { symbol: "θ", englishLabel: "TH", example: "thin" },
  { symbol: "ð", englishLabel: "TH", example: "this" },
  { symbol: "s", englishLabel: "S", example: "sun" },
  { symbol: "z", englishLabel: "Z", example: "zoo" },
  { symbol: "ʃ", englishLabel: "SH", example: "ship" },
  { symbol: "ʒ", englishLabel: "ZH", example: "vision" },
  { symbol: "h", englishLabel: "H", example: "hat" },
  { symbol: "tʃ", englishLabel: "CH", example: "chip" },
  { symbol: "dʒ", englishLabel: "J", example: "jam" },
  { symbol: "m", englishLabel: "M", example: "map" },
  { symbol: "n", englishLabel: "N", example: "net" },
  { symbol: "ŋ", englishLabel: "NG", example: "sing" },
  { symbol: "l", englishLabel: "L", example: "lip" },
  { symbol: "r", englishLabel: "R", example: "red" },
  { symbol: "j", englishLabel: "Y", example: "yes" },
  { symbol: "w", englishLabel: "W", example: "wet" },
  { symbol: "iː", englishLabel: "EE", example: "see" },
  { symbol: "ɪ", englishLabel: "I", example: "sit" },
  { symbol: "e", englishLabel: "E", example: "bed" },
  { symbol: "æ", englishLabel: "A", example: "cat" },
  { symbol: "ɑː", englishLabel: "AR", example: "father" },
  { symbol: "ɒ", englishLabel: "O", example: "hot" },
  { symbol: "ɔː", englishLabel: "OR", example: "saw" },
  { symbol: "ʊ", englishLabel: "OO", example: "book" },
  { symbol: "uː", englishLabel: "OO", example: "food" },
  { symbol: "ʌ", englishLabel: "U", example: "cup" },
  { symbol: "ɜː", englishLabel: "ER", example: "bird" },
  { symbol: "ə", englishLabel: "UH", example: "about" },
  { symbol: "eɪ", englishLabel: "AY", example: "day" },
  { symbol: "aɪ", englishLabel: "EYE", example: "my" },
  { symbol: "ɔɪ", englishLabel: "OY", example: "boy" },
  { symbol: "aʊ", englishLabel: "OW", example: "now" },
  { symbol: "əʊ", englishLabel: "OH", example: "go" },
  { symbol: "ɪə", englishLabel: "EAR", example: "near" },
  { symbol: "eə", englishLabel: "AIR", example: "hair" },
  { symbol: "ʊə", englishLabel: "URE", example: "tour" },
];

const CONSONANT_SYMBOLS = new Set([
  "p", "b", "t", "d", "k", "g", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ", "h", "tʃ", "dʒ", "m", "n", "ŋ", "l", "r", "j", "w",
]);

function keyboardPhonemesFor(words: SerializableWord[]): SerializablePhoneme[] {
  const map = new Map<string, SerializablePhoneme>();
  for (const phoneme of STANDARD_ENGLISH_PHONEMES) map.set(phoneme.symbol, phoneme);
  for (const word of words) {
    for (const phoneme of word.phonemes) map.set(phoneme.symbol, phoneme);
  }
  return Array.from(map.values());
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function wordsFor(activity: GenerationActivity): SerializableWord[] {
  return activity.wordList.words.map((word) => ({
    englishWord: word.englishWord,
    hint: word.hint,
    phonemes: [...word.phonemes]
      .sort((a, b) => a.position - b.position)
      .map((entry) => ({
        symbol: entry.phoneme.symbol,
        englishLabel: entry.phoneme.englishLabel,
        example: entry.phoneme.example,
      })),
  }));
}

function defaultAttempts(difficulty: Difficulty): number {
  if (difficulty === "HARD") return 4;
  if (difficulty === "MEDIUM") return 5;
  return 6;
}

function defaultGridSize(difficulty: Difficulty): number {
  if (difficulty === "HARD") return 12;
  if (difficulty === "MEDIUM") return 10;
  return 8;
}

function sharedStyles(): string {
  return `
    :root {
      color-scheme: light;
      font-family: Arial, Helvetica, sans-serif;
      --ink: #172033;
      --muted: #5c677d;
      --border: #c7cfdb;
      --surface: #ffffff;
      --page: #f5f7fb;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--page); color: var(--ink); }
    main { width: min(100% - 24px, 980px); margin: 24px auto; }
    .card { background: var(--surface); border: 1px solid #dce2ec; border-radius: 14px; padding: clamp(16px, 4vw, 28px); box-shadow: 0 8px 30px rgba(18, 33, 61, 0.08); }
    h1 { margin: 0 0 8px; line-height: 1.15; }
    h2 { margin-top: 0; }
    .meta { color: var(--muted); margin-bottom: 18px; }
    .instructions { line-height: 1.55; }
    .status { min-height: 1.5em; margin: 14px 0; font-weight: 700; }
    .hint { padding: 12px 14px; background: #eef5ff; border-radius: 10px; margin: 12px 0; }
    button { border: 1px solid #b9c3d3; background: white; border-radius: 8px; padding: 10px 14px; font: inherit; cursor: pointer; }
    button:hover { background: #f0f3f8; }
    button:focus-visible { outline: 3px solid #315fd5; outline-offset: 2px; }
    button.primary { background: var(--ink); color: white; border-color: var(--ink); }
    button:disabled { opacity: 0.45; cursor: not-allowed; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .phoneme-sequence { font-size: clamp(1.05rem, 3vw, 1.35rem); font-weight: 800; letter-spacing: 0.02em; }
    .phoneme-tooltip { position: relative; }
    .phoneme-tooltip::after {
      content: attr(data-tooltip);
      position: absolute;
      z-index: 20;
      left: 50%;
      bottom: calc(100% + 8px);
      transform: translateX(-50%);
      width: max-content;
      max-width: min(260px, 80vw);
      padding: 7px 9px;
      border-radius: 7px;
      background: #172033;
      color: white;
      font-size: 0.78rem;
      font-weight: 600;
      line-height: 1.25;
      text-align: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 120ms ease;
    }
    .phoneme-tooltip:hover::after,
    .phoneme-tooltip:focus-visible::after { opacity: 1; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    footer { margin-top: 24px; color: #6b7280; font-size: 0.9rem; }

    .game-result-mask {
      position: fixed;
      inset: 0;
      z-index: 12000;
      display: grid;
      place-items: center;
      padding: 20px;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(4px);
    }
    .game-result-mask[hidden] { display: none !important; }
    .game-result-dialog {
      width: min(92vw, 480px);
      max-height: 90vh;
      overflow: auto;
      padding: clamp(22px, 5vw, 34px);
      border: 2px solid var(--theme-border, #c7cfdb);
      border-radius: 18px;
      background: var(--theme-surface, #ffffff);
      color: var(--theme-text, #172033);
      box-shadow: 0 24px 80px rgba(0,0,0,0.35);
      text-align: center;
    }
    .game-result-icon {
      display: grid;
      place-items: center;
      width: 72px;
      height: 72px;
      margin: 0 auto 14px;
      border-radius: 999px;
      font-size: 2rem;
      font-weight: 900;
      background: var(--theme-surface-2, #f1f5f9);
      border: 2px solid var(--theme-border, #c7cfdb);
    }
    .game-result-dialog[data-result="win"] .game-result-icon {
      background: #dcfce7;
      border-color: #15803d;
      color: #14532d;
    }
    .game-result-dialog[data-result="lose"] .game-result-icon {
      background: #fee2e2;
      border-color: #b91c1c;
      color: #7f1d1d;
    }
    .game-result-dialog h2 {
      margin: 0 0 10px;
      font-size: clamp(1.7rem, 6vw, 2.4rem);
    }
    .game-result-message {
      margin: 0 auto 14px;
      max-width: 38ch;
      line-height: 1.55;
    }
    .game-result-answer {
      margin: 14px 0;
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--theme-surface-2, #f8fafc);
      border: 1px solid var(--theme-border, #c7cfdb);
      line-height: 1.5;
    }
    .game-result-actions {
      display: flex;
      justify-content: center;
      margin-top: 18px;
    }
    .game-result-new {
      min-width: 180px;
      font-weight: 800;
      background: var(--theme-accent, #2563eb) !important;
      border-color: var(--theme-accent, #2563eb) !important;
      color: #ffffff !important;
    }
    @media (max-width: 560px) {
      main { width: min(100% - 12px, 980px); margin: 8px auto; }
      .card { border-radius: 10px; }
      button { padding: 9px 11px; }
    }
  `;
}

function wordleHtml(activity: GenerationActivity): string {
  const words = wordsFor(activity);
  const data = {
    activityId: activity.id,
    title: activity.name,
    difficulty: activity.difficulty,
    hintsEnabled: activity.hintsEnabled,
    showEnglishAnswer: activity.showEnglishAnswer,
    maxAttempts: activity.maxAttempts ?? defaultAttempts(activity.difficulty),
    words,
    keyboardPhonemes: keyboardPhonemesFor(words),
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(activity.name)}</title>
  <style>
    ${sharedStyles()}
    

    #board { display: grid; gap: 8px; margin: 18px 0; }
    .attempt {
      display: grid;
      gap: 6px;
      grid-template-columns: repeat(var(--phoneme-count), minmax(0, 64px));
      justify-content: start;
    }
    .tile {
      width: 100%;
      min-width: 0;
      min-height: 58px;
      aspect-ratio: 1 / 1;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 9px;
      border: 2px solid #c7cfdb;
      font-size: clamp(0.82rem, 2vw, 1.1rem);
      font-weight: 800;
      padding: 5px 4px;
      overflow: hidden;
    }
    .tile.empty {
      background: transparent;
      border-color: #c7cfdb;
    }
    .tile.correct { background: #d9f5df; border-color: #247c3b; }
    .tile.present { background: #fff0bf; border-color: #946d08; }
    .tile.absent { background: #e7eaf0; border-color: #6e7683; }
    #current { min-height: 64px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px; border: 1px dashed #aeb8c7; border-radius: 10px; }
    #keyboard { display: grid; gap: 18px; margin-top: 12px; }
    .keyboard-section { display: grid; gap: 8px; }
    .keyboard-section h3 { margin: 0; font-size: 0.95rem; color: #4b5563; }
    .keyboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(74px, 1fr)); gap: 8px; }
    #keyboard button { min-height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font-weight: 700; }
    #keyboard button.correct { background: #d9f5df; border-color: #247c3b; }
    #keyboard button.present { background: #fff0bf; border-color: #946d08; }
    #keyboard button.absent { background: #e7eaf0; border-color: #6e7683; }
    .keyboard-note { margin: 8px 0 0; color: #5c677d; font-size: 0.88rem; line-height: 1.4; }
    .choice-symbol { font-size: 1.08rem; }
    .choice-label { font-size: 0.82rem; color: #586174; }
    .legend { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .legend span { padding: 5px 8px; border-radius: 7px; border: 1px solid #c7cfdb; font-size: 0.86rem; }
    .legend .correct { background: #d9f5df; }
    .legend .present { background: #fff0bf; }
    .legend .absent { background: #e7eaf0; }
    .answer { margin-top: 12px; padding: 13px 14px; background: #f6f0ff; border-radius: 10px; }
    .answer .english { margin-top: 8px; }
    #target-info { padding: 10px 12px; border-radius: 9px; background: #f8fafc; margin: 12px 0; }
  </style>
</head>
<body>
  <main>
    <section class="card">
      <h1>${escapeHtml(activity.name)}</h1>
      <div class="meta">Phoneme Wordle · ${escapeHtml(activity.difficulty)}</div>
      <p class="instructions">Build the hidden word using phonemes rather than spelling letters. Hover over or focus a phoneme button to see its English-letter equivalence and example.</p>
      <div class="legend" aria-label="Guess feedback legend">
        <span class="correct">Correct position</span>
        <span class="present">Present elsewhere</span>
        <span class="absent">Not in word</span>
      </div>
      <div id="target-info"></div>
      <div id="hint" class="hint" hidden></div>
      <div id="status" class="status" role="status" aria-live="polite"></div>
      <div id="board" aria-label="Previous guesses"></div>
      <h2>Current phoneme guess</h2>
      <div id="current" aria-live="polite"></div>
      <h2>Full phoneme keyboard</h2>
      <p class="keyboard-note">Choose from the full classroom English phoneme set. After each guess, keyboard feedback appears briefly, then resets automatically for the next guess. Hover or focus any button for its English-letter equivalence and example.</p>
      <div id="keyboard" aria-label="Full English phoneme keyboard"></div>
      <div class="actions">
        <button id="backspace" type="button">Backspace</button>
        <button id="clear" type="button">Clear guess</button>
        <button id="submit" type="button" class="primary">Submit guess</button>
        <button id="new-word" type="button">New word</button>
      </div>
      <div id="answer" aria-live="polite"></div>

      <div id="game-result-mask" class="game-result-mask" hidden>
        <section
          id="game-result-dialog"
          class="game-result-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-result-title"
          aria-describedby="game-result-message"
        >
          <div id="game-result-icon" class="game-result-icon" aria-hidden="true">✓</div>
          <h2 id="game-result-title">Winner!</h2>
          <p id="game-result-message" class="game-result-message"></p>
          <div id="game-result-answer" class="game-result-answer"></div>
          <div class="game-result-actions">
            <button id="game-result-new" class="game-result-new" type="button">Start new game</button>
          </div>
        </section>
      </div>

      <footer>Generated from saved activity data. Activity ID ${activity.id}.</footer>
    </section>
  </main>
  <script>
    const DATA = ${safeJson(data)};
    const board = document.getElementById("board");
    const current = document.getElementById("current");
    const keyboard = document.getElementById("keyboard");
    const statusBox = document.getElementById("status");
    const hintBox = document.getElementById("hint");
    const answerBox = document.getElementById("answer");
    const targetInfo = document.getElementById("target-info");
    const backspaceButton = document.getElementById("backspace");
    const clearButton = document.getElementById("clear");
    const submitButton = document.getElementById("submit");
    const newWordButton = document.getElementById("new-word");
    const resultMask = document.getElementById("game-result-mask");
    const resultDialog = document.getElementById("game-result-dialog");
    const resultIcon = document.getElementById("game-result-icon");
    const resultTitle = document.getElementById("game-result-title");
    const resultMessage = document.getElementById("game-result-message");
    const resultAnswer = document.getElementById("game-result-answer");
    const resultNewButton = document.getElementById("game-result-new");

    function tooltip(phoneme) {
      return "/" + phoneme.symbol + "/ = " + phoneme.englishLabel + (phoneme.example ? " (as in " + phoneme.example + ")" : "");
    }

    function ariaPhoneme(phoneme) {
      return "phoneme " + phoneme.symbol + ", " + phoneme.englishLabel + (phoneme.example ? ", as in " + phoneme.example : "");
    }

    const choiceMap = new Map();
    DATA.keyboardPhonemes.forEach(function (phoneme) {
      choiceMap.set(phoneme.symbol, phoneme);
    });
    DATA.words.forEach(function (word) {
      word.phonemes.forEach(function (phoneme) {
        choiceMap.set(phoneme.symbol, phoneme);
      });
    });

    const consonantSymbols = new Set(${safeJson(Array.from(CONSONANT_SYMBOLS))});
    const standardSymbols = new Set(["p", "b", "t", "d", "k", "g", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ", "h", "tʃ", "dʒ", "m", "n", "ŋ", "l", "r", "j", "w", "iː", "ɪ", "e", "æ", "ɑː", "ɒ", "ɔː", "ʊ", "uː", "ʌ", "ɜː", "ə", "eɪ", "aɪ", "ɔɪ", "aʊ", "əʊ", "ɪə", "eə", "ʊə"]);
    const consonants = [];
    const vowels = [];
    const custom = [];
    choiceMap.forEach(function (phoneme) {
      if (consonantSymbols.has(phoneme.symbol)) consonants.push(phoneme);
      else if (standardSymbols.has(phoneme.symbol)) vowels.push(phoneme);
      else custom.push(phoneme);
    });
    function sortPhonemes(values) {
      return values.sort(function (a, b) { return a.englishLabel.localeCompare(b.englishLabel) || a.symbol.localeCompare(b.symbol); });
    }
    sortPhonemes(consonants);
    sortPhonemes(vowels);
    sortPhonemes(custom);

    const keyStatus = new Map();

    let target = null;
    let guess = [];
    let submittedGuesses = [];
    let keyboardResetTimer = null;
    let attempt = 0;
    let complete = false;

    function chooseTarget() {
      return DATA.words[Math.floor(Math.random() * DATA.words.length)];
    }

    function findPhoneme(symbol) {
      return choiceMap.get(symbol) || { symbol: symbol, englishLabel: symbol, example: null };
    }

    function phonemeSequence(word) {
      return word.phonemes.map(function (phoneme) {
        return "/" + phoneme.symbol + "/";
      }).join(" ");
    }

    function makePhonemeTile(phoneme, className) {
      const tile = document.createElement("span");
      tile.className = "tile phoneme-tooltip" + (className ? " " + className : "");
      tile.textContent = "/" + phoneme.symbol + "/";
      tile.setAttribute("data-tooltip", tooltip(phoneme));
      tile.setAttribute("title", tooltip(phoneme));
      return tile;
    }

    function keyRank(value) {
      if (value === "correct") return 3;
      if (value === "present") return 2;
      if (value === "absent") return 1;
      return 0;
    }

    function updateKeyStatus(symbol, value) {
      const currentValue = keyStatus.get(symbol);
      if (keyRank(value) > keyRank(currentValue)) keyStatus.set(symbol, value);
    }

    function makeKeyboardButton(phoneme) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "phoneme-tooltip";
      const state = keyStatus.get(phoneme.symbol);
      if (state) button.classList.add(state);
      button.setAttribute("data-tooltip", tooltip(phoneme));
      button.setAttribute("title", tooltip(phoneme));
      button.setAttribute("aria-label", ariaPhoneme(phoneme) + (state ? ", " + feedbackText(state) : ""));

      const symbol = document.createElement("span");
      symbol.className = "choice-symbol";
      symbol.textContent = "/" + phoneme.symbol + "/";
      const label = document.createElement("span");
      label.className = "choice-label";
      label.textContent = phoneme.englishLabel;
      button.appendChild(symbol);
      button.appendChild(label);

      button.addEventListener("click", function () {
        if (complete || guess.length >= target.phonemes.length) return;
        guess.push(phoneme.symbol);
        renderCurrent();
      });
      return button;
    }

    function addKeyboardSection(title, values) {
      if (values.length === 0) return;
      const section = document.createElement("section");
      section.className = "keyboard-section";
      const heading = document.createElement("h3");
      heading.textContent = title;
      const grid = document.createElement("div");
      grid.className = "keyboard-grid";
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", title);
      values.forEach(function (phoneme) { grid.appendChild(makeKeyboardButton(phoneme)); });
      section.appendChild(heading);
      section.appendChild(grid);
      keyboard.appendChild(section);
    }

    function renderKeyboard() {
      keyboard.innerHTML = "";
      addKeyboardSection("Consonants", consonants);
      addKeyboardSection("Vowels and diphthongs", vowels);
      addKeyboardSection("Activity-specific phonemes", custom);
    }

    function refreshKeyboard() {
      renderKeyboard();
    }

    function renderCurrent() {
      current.innerHTML = "";
      current.style.setProperty("--phoneme-count", String(target.phonemes.length));
      current.style.display = "grid";
      current.style.gridTemplateColumns =
        "repeat(" + target.phonemes.length + ", minmax(0, 64px))";
      current.style.gap = "6px";

      for (let index = 0; index < target.phonemes.length; index += 1) {
        if (index < guess.length) {
          current.appendChild(makePhonemeTile(findPhoneme(guess[index]), ""));
        } else {
          const empty = document.createElement("span");
          empty.className = "tile empty";
          empty.setAttribute("aria-label", "Empty phoneme slot " + (index + 1));
          current.appendChild(empty);
        }
      }

      current.setAttribute(
        "aria-label",
        "Current guess: " + guess.length + " of " + target.phonemes.length + " phoneme slots filled."
      );
    }

    function evaluateGuess(values, answer) {
      const result = new Array(answer.length).fill("absent");
      const remaining = new Map();
      for (let i = 0; i < answer.length; i += 1) {
        if (values[i] === answer[i]) {
          result[i] = "correct";
        } else {
          remaining.set(answer[i], (remaining.get(answer[i]) || 0) + 1);
        }
      }
      for (let i = 0; i < values.length; i += 1) {
        if (result[i] === "correct") continue;
        const count = remaining.get(values[i]) || 0;
        if (count > 0) {
          result[i] = "present";
          remaining.set(values[i], count - 1);
        }
      }
      return result;
    }

    function feedbackText(value) {
      if (value === "correct") return "correct position";
      if (value === "present") return "present elsewhere";
      return "not in target word";
    }

    function renderBoard() {
      board.innerHTML = "";
      board.style.setProperty("--phoneme-count", String(target.phonemes.length));

      for (let rowIndex = 0; rowIndex < DATA.maxAttempts; rowIndex += 1) {
        const row = document.createElement("div");
        row.className = "attempt";
        row.setAttribute("aria-label", "Attempt " + (rowIndex + 1));

        const submitted = submittedGuesses[rowIndex] || null;

        for (let column = 0; column < target.phonemes.length; column += 1) {
          if (submitted) {
            row.appendChild(
              makePhonemeTile(
                findPhoneme(submitted.values[column]),
                submitted.evaluation[column]
              )
            );
          } else {
            const empty = document.createElement("span");
            empty.className = "tile empty";
            empty.setAttribute("aria-hidden", "true");
            row.appendChild(empty);
          }
        }

        board.appendChild(row);
      }
    }

    function showAnswer() {
      answerBox.innerHTML = "";
      const answer = document.createElement("div");
      answer.className = "answer";

      const heading = document.createElement("strong");
      heading.textContent = "Phoneme word:";
      const sequence = document.createElement("div");
      sequence.className = "phoneme-sequence";
      sequence.textContent = phonemeSequence(target);
      answer.appendChild(heading);
      answer.appendChild(sequence);

      if (DATA.showEnglishAnswer) {
        const english = document.createElement("div");
        english.className = "english";
        english.innerHTML = "<strong>English equivalence:</strong> ";
        english.appendChild(document.createTextNode(target.englishWord));
        answer.appendChild(english);
      }
      answerBox.appendChild(answer);
    }

    function hideResultMask() {
      resultMask.hidden = true;
    }

    function showResultMask(outcome) {
      const won = outcome === "win";

      resultDialog.dataset.result = won ? "win" : "lose";
      resultIcon.textContent = won ? "✓" : "×";
      resultTitle.textContent = won ? "Winner!" : "You lose";

      resultMessage.textContent = won
        ? "Great work — you found the phoneme word in " + attempt +
          " attempt" + (attempt === 1 ? "" : "s") + "."
        : "No attempts remaining. The correct answer is shown below.";

      resultAnswer.innerHTML = "";

      const sequence = document.createElement("div");
      sequence.className = "phoneme-sequence";
      sequence.textContent = phonemeSequence(target);
      resultAnswer.appendChild(sequence);

      if (DATA.showEnglishAnswer) {
        const english = document.createElement("div");
        english.style.marginTop = "8px";
        english.innerHTML =
          "<strong>English equivalence:</strong> " + target.englishWord;
        resultAnswer.appendChild(english);
      }

      resultMask.hidden = false;
      window.setTimeout(function () {
        resultNewButton.focus();
      }, 0);
    }

    function finishRound(outcome) {
      complete = true;

      if (keyboardResetTimer !== null) {
        window.clearTimeout(keyboardResetTimer);
        keyboardResetTimer = null;
      }

      showAnswer();
      showResultMask(outcome);
    }

    function submitGuess() {
      if (complete) return;

      if (guess.length !== target.phonemes.length) {
        statusBox.textContent =
          "Fill all " + target.phonemes.length +
          " phoneme slots before submitting.";
        return;
      }

      const answer = target.phonemes.map(function (phoneme) {
        return phoneme.symbol;
      });

      const evaluation = evaluateGuess(guess, answer);

      submittedGuesses.push({
        values: guess.slice(),
        evaluation: evaluation.slice(),
      });

      renderBoard();

      guess.forEach(function (symbol, index) {
        updateKeyStatus(symbol, evaluation[index]);
      });

      refreshKeyboard();
      attempt += 1;

      const won = evaluation.every(function (value) {
        return value === "correct";
      });

      if (won) {
        statusBox.textContent =
          "Correct in " + attempt +
          " attempt" + (attempt === 1 ? "" : "s") + ".";
        finishRound("win");
      } else if (attempt >= DATA.maxAttempts) {
        statusBox.textContent =
          "No attempts remaining. Review the answer.";
        finishRound("lose");
      } else {
        statusBox.textContent =
          (DATA.maxAttempts - attempt) +
          " attempt" +
          (DATA.maxAttempts - attempt === 1 ? "" : "s") +
          " remaining.";

        keyboardResetTimer = window.setTimeout(function () {
          keyStatus.clear();
          refreshKeyboard();
          keyboardResetTimer = null;
        }, 650);
      }

      guess = [];
      renderCurrent();
    }

    function startRound() {
      if (keyboardResetTimer !== null) {
        window.clearTimeout(keyboardResetTimer);
        keyboardResetTimer = null;
      }

      hideResultMask();
      target = chooseTarget();
      guess = [];
      submittedGuesses = [];
      attempt = 0;
      complete = false;
      keyStatus.clear();
      refreshKeyboard();
      renderBoard();
      answerBox.innerHTML = "";
      targetInfo.textContent = "Target length: " + target.phonemes.length + " phoneme slots. Maximum attempts: " + DATA.maxAttempts + ".";
      statusBox.textContent = "Choose phonemes to make your first guess.";

      if (DATA.hintsEnabled && target.hint) {
        hintBox.hidden = false;
        hintBox.textContent = "Word hint: " + target.hint;
      } else {
        hintBox.hidden = true;
        hintBox.textContent = "";
      }
      renderCurrent();
    }

    backspaceButton.addEventListener("click", function () {
      if (complete) return;
      guess.pop();
      renderCurrent();
    });
    clearButton.addEventListener("click", function () {
      if (complete) return;
      guess = [];
      renderCurrent();
    });
    submitButton.addEventListener("click", submitGuess);
    newWordButton.addEventListener("click", startRound);
    resultNewButton.addEventListener("click", startRound);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        submitGuess();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        if (!complete) { guess.pop(); renderCurrent(); }
      } else if (event.key === "Escape") {
        if (!complete) { guess = []; renderCurrent(); }
      }
    });

    startRound();
  </script>
</body>
</html>`;
}

function wordSearchHtml(activity: GenerationActivity): string {
  const words = wordsFor(activity);
  const data = {
    activityId: activity.id,
    title: activity.name,
    difficulty: activity.difficulty,
    hintsEnabled: activity.hintsEnabled,
    showEnglishAnswer: activity.showEnglishAnswer,
    gridSize: activity.gridSize ?? defaultGridSize(activity.difficulty),
    words,
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(activity.name)}</title>
  <style>
    ${sharedStyles()}
    main { width: min(100% - 24px, 1180px); }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(250px, 300px);
      gap: 20px;
      align-items: start;
    }
    .layout > * { min-width: 0; }
    .grid-shell {
      width: 100%;
      min-width: 0;
      overflow: hidden;
      padding: 6px;
      border: 1px solid #dce2ec;
      border-radius: 12px;
      background: #f8fafc;
    }
    #grid {
      display: grid;
      width: 100%;
      min-width: 0;
      gap: clamp(2px, 0.45vw, 5px);
      touch-action: none;
      user-select: none;
    }
    .cell {
      width: 100%;
      min-width: 0;
      min-height: 0;
      aspect-ratio: 1 / 1;
      padding: 0;
      overflow: hidden;
      border: 1px solid #aeb9c9;
      border-radius: clamp(4px, 0.7vw, 8px);
      background: white;
      font-weight: 800;
      font-size: clamp(0.64rem, 1.25vw, 1rem);
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cell.selected { outline: 3px solid #315fd5; outline-offset: -2px; background: #eaf1ff; }
    .cell.found { background: #d9f5df; border-color: #247c3b; }
    #targets { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    #targets li { padding: 10px 11px; border-radius: 8px; background: #f3f5f9; border: 1px solid #e0e5ee; }
    #targets li.found { background: #d9f5df; border-color: #86c996; }
    .target-phonemes { font-weight: 800; font-size: 1.05rem; }
    .target-hint, .target-english { margin-top: 4px; font-size: 0.88rem; color: #5d6676; }
    .target-english { color: #215d32; font-weight: 700; }
    .difficulty-note { padding: 9px 11px; border-radius: 8px; background: #f8fafc; margin: 10px 0 14px; }
    .selection-help { padding: 10px 12px; border-left: 4px solid #315fd5; background: #eef4ff; border-radius: 7px; margin: 12px 0; line-height: 1.45; }
    .progress { font-weight: 700; margin: 8px 0 12px; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .layout aside {
        width: 100%;
        order: -1;
      }
      .layout aside h2 {
        margin-top: 0;
      }
      h1 {
        padding-right: 64px;
      }
    }

    @media (max-width: 560px) {
      main {
        width: calc(100% - 8px);
        margin: 8px auto;
        padding: 18px 14px;
      }

      h1 {
        padding-right: 58px;
        font-size: clamp(1.65rem, 7vw, 2.1rem);
        line-height: 1.08;
      }

      .grid-shell {
        width: 100%;
        min-width: 0;
        overflow: hidden;
        padding: 3px;
      }

      #grid {
        width: 100%;
        min-width: 0;
        gap: 2px;
      }

      .cell {
        width: 100%;
        min-width: 0 !important;
        min-height: 0 !important;
        aspect-ratio: 1 / 1;
        padding: 0 !important;
        font-size: clamp(0.52rem, 2.35vw, 0.78rem);
        border-radius: 4px;
      }

      .target-item {
        padding: 9px 10px;
      }

      .layout aside {
        margin-bottom: 4px;
      }
    }

    @media (max-width: 380px) {
      .cell {
        font-size: clamp(0.48rem, 2.5vw, 0.68rem);
      }
    }
  </style>
</head>
<body>
  <main>
    <section class="card">
      <h1>${escapeHtml(activity.name)}</h1>
      <div class="meta">Phoneme Word Search · ${escapeHtml(activity.difficulty)}</div>
      <p class="instructions">Find each phoneme sequence in the grid. The grid uses phoneme symbols rather than normal spelling letters.</p>
      <div class="selection-help"><strong>How to select:</strong> drag from the first phoneme to the last, or click the first cell and then the last cell. Words run in a straight horizontal, vertical, or diagonal line. Hover over or focus a phoneme to see its English-letter equivalence and example.</div>
      <div id="difficulty-note" class="difficulty-note"></div>
      <div id="progress" class="progress"></div>
      <div id="status" class="status" role="status" aria-live="polite"></div>
      <p class="mobile-grid-hint">On a small screen, the word list appears above the board and the board automatically fits the available width.</p>
    <div class="layout">
        <div class="grid-shell"><div id="grid" aria-label="Phoneme word search grid"></div></div>
        <aside>
          <h2>Phoneme words to find</h2>
          <ul id="targets"></ul>
          <div class="actions">
            <button id="clear-selection" type="button">Clear selection</button>
            <button id="new-puzzle" type="button">New puzzle</button>
          </div>
        </aside>
      </div>

      <div id="game-result-mask" class="game-result-mask" hidden>
        <section
          id="game-result-dialog"
          class="game-result-dialog"
          data-result="win"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-result-title"
          aria-describedby="game-result-message"
        >
          <div id="game-result-icon" class="game-result-icon" aria-hidden="true">✓</div>
          <h2 id="game-result-title">Winner!</h2>
          <p id="game-result-message" class="game-result-message">You found every phoneme word in the puzzle.</p>
          <div id="game-result-answer" class="game-result-answer"></div>
          <div class="game-result-actions">
            <button id="game-result-new" class="game-result-new" type="button">Start new game</button>
          </div>
        </section>
      </div>

      <footer>Generated from saved activity data. Activity ID ${activity.id}.</footer>
    </section>
  </main>
  <script>
    const DATA = ${safeJson(data)};
    const gridElement = document.getElementById("grid");
    const targetsElement = document.getElementById("targets");
    const statusBox = document.getElementById("status");
    const difficultyNote = document.getElementById("difficulty-note");
    const progressElement = document.getElementById("progress");
    const newPuzzleButton = document.getElementById("new-puzzle");
    const clearSelectionButton = document.getElementById("clear-selection");
    const resultMask = document.getElementById("game-result-mask");
    const resultAnswer = document.getElementById("game-result-answer");
    const resultNewButton = document.getElementById("game-result-new");

    let puzzle = null;
    let selectedPath = [];
    let clickStart = null;
    let pointerStart = null;
    let dragging = false;
    let suppressNextClick = false;
    let found = new Set();
    let foundPaths = new Map();

    const phonemeMap = new Map();
    DATA.words.forEach(function (word) {
      word.phonemes.forEach(function (phoneme) {
        if (!phonemeMap.has(phoneme.symbol)) phonemeMap.set(phoneme.symbol, phoneme);
      });
    });

    function key(row, col) { return row + ":" + col; }

    function tooltip(phoneme) {
      return "/" + phoneme.symbol + "/ = " + phoneme.englishLabel + (phoneme.example ? " (as in " + phoneme.example + ")" : "");
    }

    function phonemeSequence(word) {
      return word.phonemes.map(function (p) { return "/" + p.symbol + "/"; }).join(" ");
    }

    function symbolsForWord(word) {
      return word.phonemes.map(function (phoneme) { return phoneme.symbol; });
    }

    function directionsForDifficulty() {
      if (DATA.difficulty === "EASY") return [[0,1],[1,0]];
      if (DATA.difficulty === "MEDIUM") return [[0,1],[1,0],[1,1],[1,-1]];
      return [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
    }

    function difficultyText() {
      if (DATA.difficulty === "EASY") return "Easy: words are placed horizontally or vertically.";
      if (DATA.difficulty === "MEDIUM") return "Medium: words may also be placed diagonally.";
      return "Hard: words may be placed in any direction, including backwards.";
    }

    function buildPuzzle() {
      const longest = Math.max.apply(null, DATA.words.map(function (word) { return word.phonemes.length; }));
      const total = DATA.words.reduce(function (sum, word) { return sum + word.phonemes.length; }, 0);
      const requested = Math.min(Math.max(DATA.gridSize, 6), 18);
      const base = Math.max(requested, longest + 1, Math.ceil(Math.sqrt(total * 1.7)), 6);
      const directions = directionsForDifficulty();
      const order = DATA.words.map(function (_, index) { return index; }).sort(function (a, b) {
        return DATA.words[b].phonemes.length - DATA.words[a].phonemes.length;
      });

      for (let size = base; size <= Math.min(base + 8, 22); size += 1) {
        const cells = Array.from({ length: size }, function () { return new Array(size).fill(null); });
        const placements = [];
        let failed = false;

        for (let orderIndex = 0; orderIndex < order.length; orderIndex += 1) {
          const wordIndex = order[orderIndex];
          const symbols = symbolsForWord(DATA.words[wordIndex]);
          let placed = false;

          for (let attempt = 0; attempt < 600 && !placed; attempt += 1) {
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const dr = direction[0];
            const dc = direction[1];
            const row = Math.floor(Math.random() * size);
            const col = Math.floor(Math.random() * size);
            const endRow = row + dr * (symbols.length - 1);
            const endCol = col + dc * (symbols.length - 1);
            if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;

            const coords = [];
            let valid = true;
            for (let i = 0; i < symbols.length; i += 1) {
              const r = row + dr * i;
              const c = col + dc * i;
              if (cells[r][c] !== null && cells[r][c] !== symbols[i]) {
                valid = false;
                break;
              }
              coords.push({ row: r, col: c });
            }
            if (!valid) continue;

            coords.forEach(function (coord, index) {
              cells[coord.row][coord.col] = symbols[index];
            });
            placements.push({ wordIndex: wordIndex, coords: coords });
            placed = true;
          }

          if (!placed) {
            failed = true;
            break;
          }
        }

        if (!failed) {
          const fillers = Array.from(phonemeMap.keys());
          for (let row = 0; row < size; row += 1) {
            for (let col = 0; col < size; col += 1) {
              if (cells[row][col] === null) {
                cells[row][col] = fillers[Math.floor(Math.random() * fillers.length)];
              }
            }
          }
          return { size: size, cells: cells, placements: placements };
        }
      }
      throw new Error("Unable to construct word search grid");
    }

    function pathBetween(a, b) {
      const rowDiff = b.row - a.row;
      const colDiff = b.col - a.col;
      const absRow = Math.abs(rowDiff);
      const absCol = Math.abs(colDiff);
      if (!(rowDiff === 0 || colDiff === 0 || absRow === absCol)) return [];
      const dr = Math.sign(rowDiff);
      const dc = Math.sign(colDiff);
      const length = Math.max(absRow, absCol) + 1;
      const result = [];
      for (let i = 0; i < length; i += 1) {
        result.push({ row: a.row + dr * i, col: a.col + dc * i });
      }
      return result;
    }

    function selectionDirectionAllowed(path) {
      if (path.length < 2) return false;
      const first = path[0];
      const second = path[1];
      const dr = Math.abs(second.row - first.row);
      const dc = Math.abs(second.col - first.col);
      if (DATA.difficulty === "EASY") return (dr === 0 && dc === 1) || (dr === 1 && dc === 0);
      return (dr === 0 && dc === 1) || (dr === 1 && dc === 0) || (dr === 1 && dc === 1);
    }

    function pathSymbols(path) {
      return path.map(function (coord) { return puzzle.cells[coord.row][coord.col]; });
    }

    function arraysEqual(a, b) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
      return true;
    }

    function matchingWordIndex(path) {
      const selectedSymbols = pathSymbols(path);
      const reversed = selectedSymbols.slice().reverse();
      let alreadyFoundMatch = false;

      for (let index = 0; index < DATA.words.length; index += 1) {
        const target = symbolsForWord(DATA.words[index]);
        if (arraysEqual(selectedSymbols, target) || arraysEqual(reversed, target)) {
          if (!found.has(index)) return index;
          alreadyFoundMatch = true;
        }
      }
      return alreadyFoundMatch ? -2 : -1;
    }

    function hideResultMask() {
      resultMask.hidden = true;
    }

    function showWinnerMask() {
      resultAnswer.innerHTML = "";
      DATA.words.forEach(function (word) {
        const row = document.createElement("div");
        row.textContent = phonemeSequence(word) + (DATA.showEnglishAnswer ? " — " + word.englishWord : "");
        resultAnswer.appendChild(row);
      });
      resultMask.hidden = false;
      window.setTimeout(function () { resultNewButton.focus(); }, 0);
    }

    function resetSelection(message) {
      selectedPath = [];
      clickStart = null;
      pointerStart = null;
      dragging = false;
      if (message) statusBox.textContent = message;
      renderGrid();
    }

    function finishSelection(path) {
      if (path.length < 2) {
        resetSelection("Choose a start cell and a different end cell.");
        return;
      }
      if (!selectionDirectionAllowed(path)) {
        resetSelection("That direction is not used at this difficulty level.");
        return;
      }

      const wordIndex = matchingWordIndex(path);
      if (wordIndex >= 0) {
        found.add(wordIndex);
        foundPaths.set(wordIndex, path.map(function (coord) { return { row: coord.row, col: coord.col }; }));
        const word = DATA.words[wordIndex];
        statusBox.textContent = "Found " + phonemeSequence(word) + (DATA.showEnglishAnswer ? " — " + word.englishWord : "") + ".";
        renderTargets();
        renderProgress();
        if (found.size === DATA.words.length) {
          statusBox.textContent = "All " + DATA.words.length + " phoneme words found. Well done.";
          showWinnerMask();
        }
      } else if (wordIndex === -2) {
        statusBox.textContent = "You already found that phoneme word.";
      } else {
        statusBox.textContent = "That phoneme sequence is not one of the target words.";
      }

      selectedPath = [];
      clickStart = null;
      pointerStart = null;
      renderGrid();
    }

    function handleClick(row, col) {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      if (clickStart === null) {
        clickStart = { row: row, col: col };
        selectedPath = [clickStart];
        statusBox.textContent = "Start selected. Now choose the last phoneme in the word.";
        renderGrid();
        return;
      }

      const path = pathBetween(clickStart, { row: row, col: col });
      if (path.length === 0) {
        resetSelection("Selection must be a straight horizontal, vertical, or diagonal line.");
        return;
      }
      selectedPath = path;
      finishSelection(path);
    }

    function handlePointerDown(event, row, col) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      pointerStart = { row: row, col: col };
      selectedPath = [pointerStart];
      suppressNextClick = false;
      if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId);
      renderGrid();
    }

    function handlePointerMove(event) {
      if (!dragging || pointerStart === null) return;
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const cell = element && element.closest ? element.closest(".cell[data-row][data-col]") : null;
      if (!cell) return;
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const path = pathBetween(pointerStart, { row: row, col: col });
      if (path.length > 0 && selectionDirectionAllowed(path)) {
        selectedPath = path;
        if (path.length > 1) suppressNextClick = true;
        renderGrid();
      }
    }

    function handlePointerUp() {
      if (!dragging) return;
      dragging = false;
      if (selectedPath.length > 1) {
        const completedPath = selectedPath.slice();
        finishSelection(completedPath);
      } else {
        selectedPath = [];
        pointerStart = null;
        renderGrid();
      }
    }

    function renderGrid() {
      gridElement.innerHTML = "";
      gridElement.style.gridTemplateColumns = "repeat(" + puzzle.size + ", minmax(0, 1fr))";
      const selected = new Set(selectedPath.map(function (coord) { return key(coord.row, coord.col); }));
      const foundCells = new Set();
      foundPaths.forEach(function (path) {
        path.forEach(function (coord) { foundCells.add(key(coord.row, coord.col)); });
      });

      for (let row = 0; row < puzzle.size; row += 1) {
        for (let col = 0; col < puzzle.size; col += 1) {
          const symbol = puzzle.cells[row][col];
          const phoneme = phonemeMap.get(symbol) || { symbol: symbol, englishLabel: symbol, example: null };
          const button = document.createElement("button");
          button.type = "button";
          button.className = "cell phoneme-tooltip";
          button.dataset.row = String(row);
          button.dataset.col = String(col);
          const cellKey = key(row, col);
          if (selected.has(cellKey)) button.classList.add("selected");
          if (foundCells.has(cellKey)) button.classList.add("found");
          button.textContent = symbol;
          button.setAttribute("data-tooltip", tooltip(phoneme));
          button.setAttribute("title", tooltip(phoneme));
          button.setAttribute("aria-label", "Row " + (row + 1) + ", column " + (col + 1) + ", phoneme " + symbol + ", " + phoneme.englishLabel + (phoneme.example ? ", as in " + phoneme.example : ""));
          button.addEventListener("click", function () { handleClick(row, col); });
          button.addEventListener("pointerdown", function (event) { handlePointerDown(event, row, col); });
          gridElement.appendChild(button);
        }
      }
    }

    function renderTargets() {
      targetsElement.innerHTML = "";
      DATA.words.forEach(function (word, index) {
        const item = document.createElement("li");
        if (found.has(index)) item.classList.add("found");

        const sequence = document.createElement("div");
        sequence.className = "target-phonemes";
        sequence.textContent = phonemeSequence(word);
        item.appendChild(sequence);

        if (DATA.hintsEnabled && word.hint) {
          const hint = document.createElement("div");
          hint.className = "target-hint";
          hint.textContent = "Hint: " + word.hint;
          item.appendChild(hint);
        }

        if (found.has(index) && DATA.showEnglishAnswer) {
          const english = document.createElement("div");
          english.className = "target-english";
          english.textContent = "English equivalence: " + word.englishWord;
          item.appendChild(english);
        }
        targetsElement.appendChild(item);
      });
    }

    function renderProgress() {
      progressElement.textContent = "Progress: " + found.size + " of " + DATA.words.length + " found";
    }

    function startPuzzle() {
      hideResultMask();
      found = new Set();
      foundPaths = new Map();
      selectedPath = [];
      clickStart = null;
      pointerStart = null;
      dragging = false;
      difficultyNote.textContent = difficultyText() + " Grid size: " + DATA.gridSize + " × " + DATA.gridSize + ".";
      try {
        puzzle = buildPuzzle();
        statusBox.textContent = "Find all " + DATA.words.length + " phoneme words.";
        renderTargets();
        renderProgress();
        renderGrid();
      } catch (error) {
        statusBox.textContent = "Could not build the puzzle.";
        console.error(error);
      }
    }

    gridElement.addEventListener("pointermove", handlePointerMove);
    gridElement.addEventListener("pointerup", handlePointerUp);
    gridElement.addEventListener("pointercancel", function () { resetSelection("Selection cancelled."); });
    clearSelectionButton.addEventListener("click", function () { resetSelection("Selection cleared."); });
    newPuzzleButton.addEventListener("click", startPuzzle);
    resultNewButton.addEventListener("click", startPuzzle);
    startPuzzle();
  </script>
</body>
</html>`;
}

export function buildActivityHtml(activity: GenerationActivity): string {
  if (activity.type === "WORDLE") return wordleHtml(activity);
  return wordSearchHtml(activity);
}
