import type {
  Difficulty,
  GridCoordinate,
  PhonemeWord,
  WordPlacement,
  WordSearchPuzzle,
} from "@/types/wordSearch";

const ALL_DIRECTIONS = [
  { row: 0, col: 1 },
  { row: 0, col: -1 },
  { row: 1, col: 0 },
  { row: -1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
  { row: -1, col: 1 },
  { row: -1, col: -1 },
];

function configForDifficulty(difficulty: Difficulty, wordCount: number) {
  const extraWords = Math.max(0, wordCount - 5);

  const growth = Math.ceil(extraWords / 2);

  if (difficulty === "easy") {
    const size = Math.min(14, 8 + growth);
    return { rows: size, cols: size, directions: ALL_DIRECTIONS.slice(0, 4) };
  }
  if (difficulty === "hard") {
    const size = Math.min(18, 12 + growth);
    return { rows: size, cols: size, directions: ALL_DIRECTIONS };
  }
  const size = Math.min(16, 10 + growth);
  return { rows: size, cols: size, directions: ALL_DIRECTIONS };
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function createWordSearchPuzzle(
  words: PhonemeWord[],
  difficulty: Difficulty,
): WordSearchPuzzle {
  const usableWords = words.filter((word) => word.phonemes.length > 0);
  const { rows, cols, directions } = configForDifficulty(
    difficulty,
    usableWords.length,
  );
  const pool = Array.from(
    new Set(usableWords.flatMap((word) => word.phonemes).filter(Boolean)),
  );
  const filler = pool.length ? pool : ["p", "b", "t", "d", "k", "g", "æ", "ɪ", "ŋ"];


  for (let boardAttempt = 0; boardAttempt < 80; boardAttempt += 1) {
    const grid: (string | null)[][] = Array.from({ length: rows }, () =>
      Array<string | null>(cols).fill(null),
    );
    const placements: WordPlacement[] = [];
    let failed = false;


    const sortedWords = [...usableWords].sort(
      (a, b) => b.phonemes.length - a.phonemes.length,
    );

    for (const word of sortedWords) {
      let placed = false;

      for (let attempt = 0; attempt < 500 && !placed; attempt += 1) {
        const direction = randomItem(directions);
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        const endRow = row + direction.row * (word.phonemes.length - 1);
        const endCol = col + direction.col * (word.phonemes.length - 1);

        if (endRow < 0 || endRow >= rows || endCol < 0 || endCol >= cols) {
          continue;
        }

        const coordinates: GridCoordinate[] = [];
        let valid = true;

        for (let i = 0; i < word.phonemes.length; i += 1) {
          const currentRow = row + direction.row * i;
          const currentCol = col + direction.col * i;
          const existing = grid[currentRow][currentCol];

          if (existing && existing !== word.phonemes[i]) {
            valid = false;
            break;
          }

          coordinates.push({ row: currentRow, col: currentCol });
        }

        if (!valid) continue;

        coordinates.forEach(({ row: r, col: c }, index) => {
          grid[r][c] = word.phonemes[index];
        });
        placements.push({ wordId: word.id, coordinates });
        placed = true;
      }

      if (!placed) {
        failed = true;
        break;
      }
    }

    if (failed) continue;

    const completedGrid = grid.map((row) =>
      row.map((cell) => cell ?? randomItem(filler)),
    );

    return { rows, cols, grid: completedGrid, placements };
  }

  throw new Error("Could not place every word. Try shorter words or another difficulty.");
}

export function getStraightPath(
  start: GridCoordinate,
  end: GridCoordinate,
): GridCoordinate[] | null {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;

  if (
    rowDelta !== 0 &&
    colDelta !== 0 &&
    Math.abs(rowDelta) !== Math.abs(colDelta)
  ) {
    return null;
  }

  const steps = Math.max(Math.abs(rowDelta), Math.abs(colDelta));
  if (steps === 0) return [start];

  const rowStep = rowDelta === 0 ? 0 : rowDelta / steps;
  const colStep = colDelta === 0 ? 0 : colDelta / steps;

  const path: GridCoordinate[] = [];
  for (let index = 0; index <= steps; index += 1) {
    path.push({
      row: start.row + rowStep * index,
      col: start.col + colStep * index,
    });
  }
  return path;
}
