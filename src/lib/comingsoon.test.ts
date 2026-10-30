import { describe, expect, it } from "vitest";
import { comingSoonUrl } from "./comingsoon";

describe("comingSoonUrl", () => {
  it("points at next week with r=7", () => {
    expect(comingSoonUrl("2026-11-02", "2026-10-26")).toBe(
      "https://www.comingsoon.it/cinema/calendariouscite/?r=7",
    );
  });

  it("points at a past week with a negative offset", () => {
    expect(comingSoonUrl("2026-01-05", "2026-10-26")).toMatch(/\?r=-294$/);
  });

  it("points at the current week with r=0", () => {
    expect(comingSoonUrl("2026-10-26", "2026-10-26")).toMatch(/\?r=0$/);
  });
});
