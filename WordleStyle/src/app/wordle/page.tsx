import type { Metadata } from "next";
import { WordleBuilder } from "@/components/wordle/WordleBuilder";
export const metadata: Metadata = { title: "Wordle" };
export default function WordlePage(){return <div className="page-width page-stack"><header className="page-intro"><span className="eyebrow"><i/> Builder</span><h1>Phoneme Wordle</h1><p>Create a playable Wordle-style classroom activity using phoneme symbols, accessible hints and a standalone HTML export.</p></header><WordleBuilder/></div>}
