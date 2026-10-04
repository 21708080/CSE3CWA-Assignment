export type PhonemeInput = {
  symbol: string;
  englishLabel: string;
  example: string | null;
};

export function normalisePhonemes(value: unknown): PhonemeInput[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const result: PhonemeInput[] = [];

  for (const item of value) {
    if (typeof item === "string") {
      const symbol = item.trim();
      if (!symbol) return null;
      result.push({ symbol, englishLabel: symbol, example: null });
      continue;
    }

    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }

    const object = item as Record<string, unknown>;
    const symbol = typeof object.symbol === "string" ? object.symbol.trim() : "";
    if (!symbol) return null;

    const englishLabel =
      typeof object.englishLabel === "string" && object.englishLabel.trim()
        ? object.englishLabel.trim()
        : symbol;

    const example =
      typeof object.example === "string" && object.example.trim()
        ? object.example.trim()
        : null;

    result.push({ symbol, englishLabel, example });
  }

  return result;
}
