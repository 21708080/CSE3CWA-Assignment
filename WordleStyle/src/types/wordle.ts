export type LetterState = "correct" | "present" | "absent";
export type WordleRow = { phonemes: string[]; states?: LetterState[] };
