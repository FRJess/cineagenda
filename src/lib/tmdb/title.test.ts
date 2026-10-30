import { describe, expect, it } from "vitest";
import { details, tr } from "./fixtures";
import { buildDisplayTitle } from "./title";

describe("buildDisplayTitle", () => {
  it("uses the original title for Italian films", () => {
    const film = details({
      original_title: "La Gradiva",
      original_language: "it",
      translations: { translations: [tr("en", "US", { title: "Gradiva" })] },
    });

    expect(buildDisplayTitle(film)).toBe("La Gradiva");
  });

  it("shows the Italian title with the original in parentheses", () => {
    const film = details({
      original_title: "2001: A Space Odyssey",
      translations: { translations: [tr("it", "IT", { title: "2001: Odissea nello spazio" })] },
    });

    expect(buildDisplayTitle(film)).toBe("2001: Odissea nello spazio (2001: A Space Odyssey)");
  });

  it("omits the parentheses when the Italian title equals the original", () => {
    const film = details({
      original_title: "shrek",
      translations: { translations: [tr("it", "IT", { title: "Shrek " })] },
    });

    expect(buildDisplayTitle(film)).toBe("Shrek");
  });

  it("shows the original with the English title when there is no Italian translation", () => {
    const film = details({
      original_title: "زمزمه‌ها",
      original_language: "fa",
      translations: { translations: [tr("en", "US", { title: "The Whispers" })] },
    });

    expect(buildDisplayTitle(film)).toBe("زمزمه‌ها (The Whispers)");
  });

  it("shows the original alone when the English title equals it", () => {
    const film = details({
      original_title: "Avengers: Doomsday",
      translations: { translations: [tr("en", "US", { title: "Avengers: Doomsday" })] },
    });

    expect(buildDisplayTitle(film)).toBe("Avengers: Doomsday");
  });

  it("treats an empty Italian title as missing", () => {
    const film = details({
      original_title: "Fjord",
      original_language: "ro",
      translations: {
        translations: [tr("it", "IT", { title: "" }), tr("en", "US", { title: "Fjord" })],
      },
    });

    expect(buildDisplayTitle(film)).toBe("Fjord");
  });

  it("prefers the US English title over other English ones", () => {
    const film = details({
      original_title: "Original",
      original_language: "ja",
      translations: {
        translations: [tr("en", "GB", { title: "British" }), tr("en", "US", { title: "American" })],
      },
    });

    expect(buildDisplayTitle(film)).toBe("Original (American)");
  });

  it("falls back to the first English title without a US one", () => {
    const film = details({
      original_title: "Original",
      original_language: "ja",
      translations: { translations: [tr("en", "GB", { title: "British" })] },
    });

    expect(buildDisplayTitle(film)).toBe("Original (British)");
  });
});
