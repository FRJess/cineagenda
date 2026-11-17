export function pickSpoilerLine(lines: readonly string[], random: number): string {
  return lines[Math.floor(random * lines.length)] ?? "";
}

export function randomSpoilerLine(lines: readonly string[]): string {
  return pickSpoilerLine(lines, Math.random());
}
