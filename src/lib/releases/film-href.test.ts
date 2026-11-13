import { describe, expect, it } from "vitest";
import { filmHref } from "./film-href";

describe("filmHref", () => {
  it("links to the film page with the country and no dates", () => {
    expect(filmHref(62, "FR")).toBe("/film/62?country=fr");
    expect(filmHref(62, "IT")).toBe("/film/62?country=it");
  });
});
