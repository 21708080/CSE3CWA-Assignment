"use client";

import { useEffect, useMemo, useState } from "react";
import { getStraightPath } from "@/lib/word-search/generatePuzzle";
import type {
  GridCoordinate,
  PhonemeWord,
  WordSearchPuzzle,
} from "@/types/wordSearch";
import { CelebrationConfetti } from "@/components/ui/CelebrationConfetti";
import { HowToPlayDialog } from "@/components/ui/HowToPlayDialog";

type Props = {
  puzzle: WordSearchPuzzle;
  words: PhonemeWord[];
  showHints: boolean;
  onRegenerate: () => void;
};

const keyFor = ({ row, col }: GridCoordinate) => `${row}:${col}`;

export function WordSearchPreview({
  puzzle,
  words,
  showHints,
  onRegenerate,
}: Props) {
  const [start, setStart] = useState<GridCoordinate | null>(null);
  const [end, setEnd] = useState<GridCoordinate | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [foundIds, setFoundIds] = useState<Set<string>>(() => new Set());
  const [showAnswers, setShowAnswers] = useState(false);

  const activePath = useMemo(() => {
    if (!start || !end) return [];
    return getStraightPath(start, end) ?? [];
  }, [start, end]);

  const activeKeys = useMemo(
    () => new Set(activePath.map(keyFor)),
    [activePath],
  );

  const foundKeys = useMemo(() => {
    const keys = new Set<string>();
    puzzle.placements.forEach((placement) => {
      if (foundIds.has(placement.wordId)) {
        placement.coordinates.forEach((coordinate) => keys.add(keyFor(coordinate)));
      }
    });
    return keys;
  }, [foundIds, puzzle.placements]);

  const answerKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!showAnswers) return keys;
    puzzle.placements.forEach((placement) =>
      placement.coordinates.forEach((coordinate) => keys.add(keyFor(coordinate))),
    );
    return keys;
  }, [puzzle.placements, showAnswers]);

  function coordinateFromPoint(clientX: number, clientY: number) {
    const target = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const cell = target?.closest<HTMLElement>("[data-wordsearch-cell='true']");
    if (!cell) return null;

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) return null;

    return { row, col };
  }

  function beginSelection(coordinate: GridCoordinate) {
    setSelecting(true);
    setStart(coordinate);
    setEnd(coordinate);
  }

  function moveSelection(coordinate: GridCoordinate) {
    if (!selecting) return;
    setEnd(coordinate);
  }

  function finishSelection() {
    if (!selecting) return;

    if (start && end) {
      const path = getStraightPath(start, end);

      if (path) {
        const selectedKeys = path.map(keyFor);
        const reversedKeys = [...selectedKeys].reverse();

        const matchedPlacement = puzzle.placements.find((placement) => {
          if (foundIds.has(placement.wordId)) return false;
          const placementKeys = placement.coordinates.map(keyFor);
          if (placementKeys.length !== selectedKeys.length) return false;

          const forwardMatch = placementKeys.every(
            (key, index) => key === selectedKeys[index],
          );
          const reverseMatch = placementKeys.every(
            (key, index) => key === reversedKeys[index],
          );
          return forwardMatch || reverseMatch;
        });

        if (matchedPlacement) {
          setFoundIds(
            (current) => new Set([...current, matchedPlacement.wordId]),
          );
        }
      }
    }

    setSelecting(false);
    setStart(null);
    setEnd(null);
  }

  useEffect(() => {
    if (!selecting) return;

    const handlePointerMove = (event: PointerEvent) => {
      const coordinate = coordinateFromPoint(event.clientX, event.clientY);
      if (coordinate) setEnd(coordinate);
    };

    const handlePointerUp = () => finishSelection();

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
    // These values define the active selection snapshot.
  }, [selecting, start, end, puzzle.placements, foundIds]);

  function resetPuzzle() {
    setFoundIds(new Set());
    setShowAnswers(false);
    setSelecting(false);
    setStart(null);
    setEnd(null);
    onRegenerate();
  }

  return (
    <div className="paper-preview">
      <div className="paper-title">
        <small>WORDLESTYLE</small>
        <h3>Word Search</h3>
        <p>Press and drag across each phoneme sequence to find it.</p>
      </div>

      <div className="puzzle-toolbar">
        <button type="button" className="mini-button" onClick={resetPuzzle}>
          New puzzle
        </button>
        <button
          type="button"
          className="mini-button"
          onClick={() => setShowAnswers((current) => !current)}
        >
          {showAnswers ? "Hide answers" : "Show answers"}
        </button>
        <HowToPlayDialog title="How to play Phoneme Word Search">
          <ol>
            <li>Find each phoneme sequence shown below the grid.</li>
            <li>Press or click the first phoneme, then drag in a straight line across the complete word.</li>
            <li>Words may run horizontally, vertically or diagonally, forwards or backwards.</li>
            <li>A correctly selected word stays highlighted and is crossed off the word list.</li>
            <li>Find every word to complete the puzzle. Use <strong>Show answers</strong> only when you need help.</li>
          </ol>
        </HowToPlayDialog>
        <span className="found-counter" aria-live="polite">
          {foundIds.size} / {words.length} found
        </span>
      </div>

      <div
        className="play-grid"
        style={{ gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))` }}
        role="grid"
        aria-label="Playable phoneme word search"
      >
        {puzzle.grid.map((row, rowIndex) =>
          row.map((phoneme, colIndex) => {
            const coordinate = { row: rowIndex, col: colIndex };
            const key = keyFor(coordinate);
            const classes = [
              "play-cell",
              activeKeys.has(key) ? "is-active" : "",
              foundKeys.has(key) ? "is-found" : "",
              answerKeys.has(key) && !foundKeys.has(key) ? "is-answer" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                type="button"
                role="gridcell"
                className={classes}
                key={key}
                onPointerDown={(event) => {
                  event.preventDefault();
                  beginSelection(coordinate);
                }}
                onPointerEnter={() => moveSelection(coordinate)}
                data-wordsearch-cell="true"
                data-row={rowIndex}
                data-col={colIndex}
                aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}: ${phoneme}`}
                title={`/${phoneme}/`}
              >
                {phoneme}
              </button>
            );
          }),
        )}
      </div>

      <div className="preview-words" aria-label="Words to find">
        {words.map((word) => (
          <span className={foundIds.has(word.id) ? "is-found-word" : ""} key={word.id}>
            /{word.phonemes.join(" ")}/
            {showHints && <small>{word.english}</small>}
          </span>
        ))}
      </div>

      {foundIds.size === words.length && words.length > 0 && <>
        <CelebrationConfetti />
        <div className="game-result game-result-win" role="status" aria-live="assertive">
          <div className="game-result-icon" aria-hidden="true">★</div>
          <div>
            <span className="game-result-eyebrow">Outstanding!</span>
            <h4>You found every phoneme word.</h4>
            <p>All {words.length} words are complete.</p>
          </div>
        </div>
      </>}
    </div>
  );
}
