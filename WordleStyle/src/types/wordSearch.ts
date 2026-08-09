export type Difficulty = "easy" | "medium" | "hard";

export type PhonemeWord = {
  id: string;
  english: string;
  phonemes: string[];
  hint: string;
};

export type GridCoordinate = {
  row: number;
  col: number;
};

export type WordPlacement = {
  wordId: string;
  coordinates: GridCoordinate[];
};

export type WordSearchPuzzle = {
  rows: number;
  cols: number;
  grid: string[][];
  placements: WordPlacement[];
};

export type WordSearchSettings = {
  words: PhonemeWord[];
  difficulty: Difficulty;
  showHints: boolean;
};
