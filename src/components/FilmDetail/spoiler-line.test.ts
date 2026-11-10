import { describe, expect, it } from "vitest";
import { pickSpoilerLine } from "./spoiler-line";

const LINES = ["prima", "seconda", "terza"] as const;

describe("pickSpoilerLine", () => {
  it("returns the first line for a random value of zero", () => {
    expect(pickSpoilerLine(LINES, 0)).toBe("prima");
  });

  it("returns the last line for a random value just below one", () => {
    expect(pickSpoilerLine(LINES, 0.999)).toBe("terza");
  });

  it("picks each line for an equal share of the range", () => {
    expect(pickSpoilerLine(LINES, 0.4)).toBe("seconda");
  });
});
