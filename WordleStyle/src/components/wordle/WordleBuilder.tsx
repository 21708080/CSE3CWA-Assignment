"use client";

import { useEffect, useMemo, useState } from "react";
import { downloadHtml } from "@/lib/downloadHtml";
import { generateWordleHtml } from "@/lib/generators/generateWordleHtml";
import type { LetterState, WordleRow } from "@/types/wordle";
import { GAME_THEME_EVENT, readGameThemePreference } from "@/lib/gameThemePreference";
import { CelebrationConfetti } from "@/components/ui/CelebrationConfetti";
import { HowToPlayDialog } from "@/components/ui/HowToPlayDialog";

const KEYBOARD = ["p","b","t","d","k","g","m","n","ŋ","f","v","θ","ð","s","z","ʃ","ʒ","h","tʃ","dʒ","ɹ","l","w","j","ɪ","iː","e","æ","ɐ","ə","ɜː","ʊ","ʉː","ɔ","oː","ɑː"];
const LABELS: Record<string,string> = { "θ":"TH as in thin", "ð":"TH as in this", "ʃ":"SH as in shoe", "tʃ":"CH as in chin", "dʒ":"J as in jam", "ŋ":"NG as in sing", "ɹ":"R as in red" };

function scoreGuess(guess: string[], target: string[]): LetterState[] {
  const states: LetterState[] = Array(target.length).fill("absent");
  const remaining = new Map<string, number>();
  target.forEach((phoneme, i) => {
    if (guess[i] === phoneme) states[i] = "correct";
    else remaining.set(phoneme, (remaining.get(phoneme) ?? 0) + 1);
  });
  guess.forEach((phoneme, i) => {
    if (states[i] === "correct") return;
    const count = remaining.get(phoneme) ?? 0;
    if (count > 0) { states[i] = "present"; remaining.set(phoneme, count - 1); }
  });
  return states;
}

export function WordleBuilder() {
  const [targetInput, setTargetInput] = useState("tʃ ɪ n");
  const [english, setEnglish] = useState("chin");
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [showHints, setShowHints] = useState(true);
  const [rows, setRows] = useState<WordleRow[]>([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [message, setMessage] = useState("Build your guess with the phoneme keyboard.");
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
  const target = useMemo(() => targetInput.trim().split(/\s+/).filter(Boolean), [targetInput]);
  const won = rows.some((row) => row.states?.every((state) => state === "correct"));
  const finished = won || rows.length >= maxGuesses;

  function reset() { setRows([]); setCurrent([]); setMessage("New game ready."); }
  function addKey(key: string) { if (!finished && current.length < target.length) setCurrent((value) => [...value, key]); }
  function removeKey() { if (!finished) setCurrent((value) => value.slice(0, -1)); }
  function submit() {
    if (finished) return;
    if (current.length !== target.length) { setMessage(`Enter ${target.length} phonemes before submitting.`); return; }
    const states = scoreGuess(current, target);
    const next = [...rows, { phonemes: current, states }];
    setRows(next); setCurrent([]);
    if (states.every((state) => state === "correct")) setMessage(`Correct — ${english || target.join(" ")}!`);
    else if (next.length >= maxGuesses) setMessage(`Answer: /${target.join(" ")}/ ${english ? `— ${english}` : ""}`);
    else setMessage(`${maxGuesses - next.length} guesses remaining.`);
  }
  function exportGame() {
    downloadHtml(generateWordleHtml({ target, english, maxGuesses, showHints }, customCss), "phoneme-wordle.html");
  }

  return (
    <div className="builder-layout">
      <section className="builder-panel">
        <div className="section-kicker">Step 1</div><h2>Activity settings</h2>
        <p className="muted">Configure one target word. Separating each phoneme with a space.</p>
        <div className="wordle-form">
          <label><span>Target phonemes</span><input value={targetInput} onChange={(e)=>{setTargetInput(e.target.value); reset();}} placeholder="tʃ ɪ n" /></label>
          <label><span>English equivalent</span><input value={english} onChange={(e)=>setEnglish(e.target.value)} placeholder="chin" /></label>
          <label><span>Maximum guesses</span><select value={maxGuesses} onChange={(e)=>{setMaxGuesses(Number(e.target.value)); reset();}}>{[4,5,6,7,8].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
          <label className="toggle-line"><span><strong>Phoneme hints</strong><small>Show English sound labels on hover.</small></span><input type="checkbox" checked={showHints} onChange={(e)=>setShowHints(e.target.checked)} /></label>
        </div>
        <button className="primary-button" onClick={exportGame} disabled={target.length === 0}>Generate playable HTML ↗</button>
      </section>

      <section className="preview-shell">
        <div className="preview-top"><div><div className="section-kicker">Step 2</div><h2>Live playable preview</h2></div></div>
        <div className="paper-preview wordle-paper">
          <div className="paper-title"><small>PHONEME WORDLE</small><h3>Guess the phoneme word</h3><p>{showHints ? "Hover over phonemes for sound hints." : "Use the phoneme keyboard below."}</p></div>
          <div className="wordle-board" style={{gridTemplateColumns:`repeat(${Math.max(target.length,1)}, 1fr)`}}>
            {Array.from({length:maxGuesses}).flatMap((_,r)=> Array.from({length:Math.max(target.length,1)}).map((__,c)=>{
              const row = rows[r]; const value = row?.phonemes[c] ?? (r===rows.length ? current[c] : ""); const state = row?.states?.[c];
              return <div key={`${r}-${c}`} className={`wordle-tile ${state ? `is-${state}`:""}`}>{value}</div>;
            }))}
          </div>
          <p className="wordle-message" aria-live="polite">{message}</p>
          <div className="wordle-keyboard" aria-label="Phoneme keyboard">{KEYBOARD.map(key=><button type="button" key={key} onClick={()=>addKey(key)} disabled={finished || current.length>=target.length} title={showHints ? (LABELS[key] ?? `Phoneme /${key}/`) : undefined}>{key}</button>)}</div>
          <div className="wordle-actions"><button className="mini-button" onClick={removeKey} disabled={finished || current.length===0}>⌫ Delete</button><button className="mini-button submit-guess" onClick={submit} disabled={finished}>Submit guess</button><button className="mini-button" onClick={reset}>New game</button><HowToPlayDialog title="How to play Phoneme Wordle"><ol><li>Build a guess by selecting phoneme symbols from the keyboard.</li><li>Choose <strong>Submit guess</strong> when the row is complete.</li><li><strong>Green</strong> means the phoneme is correct and in the correct position.</li><li><strong>Gold</strong> means the phoneme is in the word but in a different position.</li><li><strong>Grey</strong> means the phoneme is not in the target word.</li><li>Find the target before you use all available guesses.</li></ol></HowToPlayDialog></div>
          {won && <>
            <CelebrationConfetti />
            <div className="game-result game-result-win" role="status" aria-live="assertive">
              <div className="game-result-icon" aria-hidden="true">★</div>
              <div>
                <span className="game-result-eyebrow">Brilliant!</span>
                <h4>You cracked the phoneme word.</h4>
                <p><strong>/{target.join(" ")}/</strong>{english ? <> = <strong>{english}</strong></> : null}</p>
              </div>
            </div>
          </>}
          {!won && finished && (
            <div className="game-result game-result-lose" role="status" aria-live="assertive">
              <div className="game-result-icon" aria-hidden="true">!</div>
              <div>
                <span className="game-result-eyebrow">So close!</span>
                <h4>The word was /{target.join(" ")}/.</h4>
                {english && <p>English equivalent: <strong>{english}</strong></p>}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
