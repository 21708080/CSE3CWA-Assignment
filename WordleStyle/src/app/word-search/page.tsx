import type { Metadata } from "next";
import { WordSearchBuilder } from "@/components/word-search/WordSearchBuilder";
export const metadata: Metadata = { title: "Word Search" };
export default function Page(){return <div className="page-width page-stack"><header className="page-intro"><span className="eyebrow"><i/> Builder</span><h1>Phoneme Word Search</h1><p>Configure phoneme words, preview the activity and export it as a standalone HTML game file.</p></header><WordSearchBuilder/></div>}
