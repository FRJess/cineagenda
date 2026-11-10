/**
 * Picks one playful spoiler line from the list.
 * @param lines Non-empty list of lines from the messages.
 * @param random Value in [0, 1), e.g. `Math.random()`; passed in so the pick is testable.
 * @returns The line at `random` of the way through the list.
 */
export function pickSpoilerLine(lines: readonly string[], random: number): string {
  return lines[Math.floor(random * lines.length)] ?? "";
}

/**
 * Picks a playful line at random for this request, so the hint changes on every visit.
 * @param lines Non-empty list of lines from the messages.
 * @returns One of the lines.
 */
export function randomSpoilerLine(lines: readonly string[]): string {
  return pickSpoilerLine(lines, Math.random());
}
