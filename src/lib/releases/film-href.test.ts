import { describe, expect, it } from "vitest";
import { filmHref } from "./film-href";

describe("filmHref", () => {
  it("links to the film page with the country and the list range", () => {
    expect(filmHref(62, "FR", { from: "2026-11-09", to: "2026-11-15" })).toBe(
      "/film/62?country=fr&from=2026-11-09&to=2026-11-15",
    );
  });

  it("keeps the country when there is no range", () => {
    expect(filmHref(62, "IT")).toBe("/film/62?country=it");
  });
});
