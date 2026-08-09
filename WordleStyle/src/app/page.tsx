import Link from "next/link";
import { ActivityCard } from "@/components/ui/ActivityCard";

const phonemes = ["p","b","t","d","k","g","θ","ð","ʃ","tʃ","ɪ","æ"];

export default function HomePage() {
  return <>
    <section className="hero page-width">
      <div className="hero-copy">
        <span className="eyebrow"><i/> Classroom activity builder</span>
        <h1>Make phonemes feel <em>playable.</em></h1>
        <p>Create focused Wordle and Word Search activities for speech-pathology learning, preview them instantly, then export one browser-ready HTML file.</p>
        <div className="hero-actions"><Link className="primary-button link-button" href="/word-search">Build a Word Search</Link><Link className="ghost-button" href="/wordle">Explore Wordle</Link></div>
        <div className="hero-stats"><div><strong>2</strong><span>activity formats</span></div><div><strong>Live</strong><span>preview workflow</span></div><div><strong>1 file</strong><span>standalone export</span></div></div>
      </div>
      <div className="hero-stage" aria-label="Example phoneme activity preview">
        <div className="orbit orbit-a"/><div className="orbit orbit-b"/>
        <div className="preview-card">
          <div className="preview-header"><div><small>LIVE PREVIEW</small><strong>Phoneme Wordle</strong></div></div>
          <div className="mini-board">{Array.from({length:12}).map((_,i)=><span key={i}>{i<3?["tʃ","ɪ","n"][i]:""}</span>)}</div>
          <div className="phoneme-keys">{phonemes.map(p=><kbd key={p}>{p}</kbd>)}</div>
          <div className="preview-meta"><div><small>Target</small><strong>/tʃ ɪ n/</strong></div><div><small>Difficulty</small><strong>Medium</strong></div></div>
        </div>
      </div>
    </section>
    <section className="activities page-width">
      <div className="section-heading"><span>Choose a format</span><h2>Two focused tools. One simple workflow.</h2></div>
      <div className="activity-grid"><ActivityCard title="Phoneme Wordle" description="Create a compact guessing activity using phoneme symbols, hints and configurable difficulty." href="/wordle" symbol="W" tone="ink"/><ActivityCard title="Phoneme Word Search" description="Build a configurable phoneme search with a live preview and standalone HTML export." href="/word-search" symbol="⌗" tone="blue"/></div>
    </section>
  </>;
}
