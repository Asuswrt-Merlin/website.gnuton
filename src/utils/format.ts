/** Compact number for stat tiles, e.g. 342107 -> "342k", 2409 -> "2.4k". */
export function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${round(value / 1_000_000)}M`;
  if (value >= 100_000) return `${Math.round(value / 1_000)}k`;
  if (value >= 1_000) return `${round(value / 1_000)}k`;
  return String(value);
}

/** Exact number with grouping, for titles and the source note. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en').format(value);
}

/** One decimal at most, without a trailing `.0`. */
function round(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}
