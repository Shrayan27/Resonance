import type { LyricLine } from "./types";

/**
 * Parses LRC (Lyric format) text into an array of LyricLine objects with timestamp in seconds.
 * Supports lines with timestamps like:
 * [00:12.34] Hello world
 * [01:05.80] Another line
 */
export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return [];

  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    timeRegex.lastIndex = 0;
    const matches = Array.from(line.matchAll(timeRegex));
    if (matches.length === 0) continue;

    const text = line.replace(timeRegex, "").trim();

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fracStr = match[3] ?? "0";
      const frac = parseFloat(`0.${fracStr}`);
      const timeInSeconds = minutes * 60 + seconds + frac;

      result.push({
        time: timeInSeconds,
        text,
      });
    }
  }

  // Sort chronologically
  result.sort((a, b) => a.time - b.time);
  return result;
}

/**
 * Cleans track titles by stripping common suffixes like:
 * "(feat. Artist)", "[Official Audio]", "(Radio Edit)", etc.
 * to maximize lyric lookup success rates.
 */
export function cleanTrackTitle(title: string): string {
  if (!title) return "";

  return title
    .replace(/\s*[([{\-]\s*(feat\.?|ft\.?|featuring).*?[)\]}]/gi, "")
    .replace(/\s*[([{\-]\s*(official\s*(music\s*)?(video|audio|visualizer)?).*?[)\]}]/gi, "")
    .replace(/\s*[([{\-]\s*(lyrics?(\s*video)?).*?[)\]}]/gi, "")
    .replace(/\s*[([{\-]\s*(radio\s*edit|remaster(ed)?|original\s*mix|extended\s*mix).*?[)\]}]/gi, "")
    .replace(/^\d+[\s.\-_]+/, "") // leading track numbers "01 - "
    .trim();
}
