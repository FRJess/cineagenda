import { describe, expect, it } from "vitest";
import { details, tr } from "@/test/tmdb-fixtures";
import { buildDisplayTitles } from "./title";

describe("buildDisplayTitles for another country", () => {
  it("shows that country's title with the original as subtitle", () => {
    const film = details({
      original_title: "2001: A Space Odyssey",
      translations: {
        translations: [
          tr("it", "IT", { title: "2001: Odissea nello spazio" }),
          tr("fr", "FR", { title: "2001, l'Odyssée de l'espace" }),
        ],
      },
    });

    expect(buildDisplayTitles(film, "FR")).toEqual({
      title: "2001, l'Odyssée de l'espace",
      subtitle: "2001: A Space Odyssey",
    });
  });

  it("uses the original title alone for a film in that country's language", () => {
    const film = details({
      original_title: "La Haine",
      original_language: "fr",
      translations: { translations: [tr("it", "IT", { title: "L'odio" })] },
    });

    expect(buildDisplayTitles(film, "FR")).toEqual({ title: "La Haine", subtitle: "" });
  });

  it("prefers the British English title in the UK", () => {
    const film = details({
      original_title: "Ratatouille",
      original_language: "fr",
      translations: {
        translations: [
          tr("en", "US", { title: "Ratatouille US" }),
          tr("en", "GB", { title: "Ratatouille UK" }),
        ],
      },
    });

    expect(buildDisplayTitles(film, "GB").title).toBe("Ratatouille UK");
  });

  it("shows the original alone in an English-speaking country without an English title", () => {
    const film = details({ original_title: "Parasite", original_language: "ko" });

    expect(buildDisplayTitles(film, "US")).toEqual({ title: "Parasite", subtitle: "" });
  });
});

describe("buildDisplayTitles", () => {
  it("uses the original title alone for Italian films", () => {
    const film = details({
      original_title: "La Gradiva",
      original_language: "it",
      translations: { translations: [tr("en", "US", { title: "Gradiva" })] },
    });

    expect(buildDisplayTitles(film)).toEqual({ title: "La Gradiva", subtitle: "" });
  });

  it("shows the Italian title with the original as subtitle", () => {
    const film = details({
      original_title: "2001: A Space Odyssey",
      translations: { translations: [tr("it", "IT", { title: "2001: Odissea nello spazio" })] },
    });

    expect(buildDisplayTitles(film)).toEqual({
      title: "2001: Odissea nello spazio",
      subtitle: "2001: A Space Odyssey",
    });
  });

  it("leaves the subtitle empty when the Italian title equals the original", () => {
    const film = details({
      original_title: "shrek",
      translations: { translations: [tr("it", "IT", { title: "Shrek " })] },
    });

    expect(buildDisplayTitles(film)).toEqual({ title: "Shrek", subtitle: "" });
  });

  it("uses the original as title and the English title as subtitle without an Italian one", () => {
    const film = details({
      original_title: "زمزمه‌ها",
      original_language: "fa",
      translations: { translations: [tr("en", "US", { title: "The Whispers" })] },
    });

    expect(buildDisplayTitles(film)).toEqual({ title: "زمزمه‌ها", subtitle: "The Whispers" });
  });

  it("leaves the subtitle empty when the English title equals the original", () => {
    const film = details({
      original_title: "Avengers: Doomsday",
      translations: { translations: [tr("en", "US", { title: "Avengers: Doomsday" })] },
    });

    expect(buildDisplayTitles(film)).toEqual({ title: "Avengers: Doomsday", subtitle: "" });
  });

  it("treats an empty Italian title as missing", () => {
    const film = details({
      original_title: "Fjord",
      original_language: "ro",
      translations: {
        translations: [tr("it", "IT", { title: "" }), tr("en", "US", { title: "Fjord" })],
      },
    });

    expect(buildDisplayTitles(film)).toEqual({ title: "Fjord", subtitle: "" });
  });

  it("prefers the US English title over other English ones", () => {
    const film = details({
      original_title: "Original",
      original_language: "ja",
      translations: {
        translations: [tr("en", "GB", { title: "British" }), tr("en", "US", { title: "American" })],
      },
    });

    expect(buildDisplayTitles(film)).toEqual({ title: "Original", subtitle: "American" });
  });

  it("falls back to the first English title without a US one", () => {
    const film = details({
      original_title: "Original",
      original_language: "ja",
      translations: { translations: [tr("en", "GB", { title: "British" })] },
    });

    expect(buildDisplayTitles(film)).toEqual({ title: "Original", subtitle: "British" });
  });
});
