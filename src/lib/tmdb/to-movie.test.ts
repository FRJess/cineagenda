import { describe, expect, it } from "vitest";
import { details, rd, tr } from "./fixtures";
import { toMovie } from "./to-movie";

const window = { from: "2026-10-26", to: "2027-01-28" };
const genreNames = { 18: "Dramma", 35: "Commedia" };

describe("toMovie", () => {
  it("returns null without an Italian date in the window", () => {
    expect(toMovie(details({}, [rd(3, "1999-01-01")]), window, "it", genreNames)).toBeNull();
  });

  it("maps a film with its Italian date and display title", () => {
    const film = details(
      {
        id: 62,
        original_title: "2001: A Space Odyssey",
        translations: { translations: [tr("it", "IT", { title: "2001: Odissea nello spazio" })] },
      },
      [rd(2, "2026-11-16")],
    );

    expect(toMovie(film, window, "it", genreNames)).toMatchObject({
      id: 62,
      title: "2001: Odissea nello spazio (2001: A Space Odyssey)",
      originalTitle: "2001: A Space Odyssey",
      releaseDateIt: "2026-11-16",
      posterPath: "/poster.jpg",
    });
  });

  it("maps genres in API order and skips unknown ids", () => {
    const film = details({ genres: [{ id: 35 }, { id: 999 }, { id: 18 }] }, [rd(3, "2026-11-05")]);

    expect(toMovie(film, window, "it", genreNames)?.genres).toEqual(["Commedia", "Dramma"]);
  });

  it("uses the overview of the UI locale", () => {
    const film = details(
      {
        translations: {
          translations: [
            tr("it", "IT", { overview: "Trama" }),
            tr("en", "US", { overview: "Plot" }),
          ],
        },
      },
      [rd(3, "2026-11-05")],
    );

    expect(toMovie(film, window, "en", genreNames)?.overview).toBe("Plot");
    expect(toMovie(film, window, "it", genreNames)?.overview).toBe("Trama");
  });

  it("falls back to the other locale's overview", () => {
    const film = details(
      { translations: { translations: [tr("en", "US", { overview: "Plot" })] } },
      [rd(3, "2026-11-05")],
    );

    expect(toMovie(film, window, "it", genreNames)?.overview).toBe("Plot");
  });

  it("returns an empty overview when none exists", () => {
    expect(toMovie(details({}, [rd(3, "2026-11-05")]), window, "it", genreNames)?.overview).toBe(
      "",
    );
  });

  it("marks a theatrical release", () => {
    const film = details({}, [rd(3, "2026-11-05")]);

    expect(toMovie(film, window, "it", genreNames)).toMatchObject({
      releaseType: "theatrical",
      releaseNote: "",
    });
  });

  it("marks a limited release and keeps its note", () => {
    const film = details({}, [rd(2, "2026-11-26", "IMAX")]);

    expect(toMovie(film, window, "it", genreNames)).toMatchObject({
      releaseType: "limited",
      releaseNote: "IMAX",
    });
  });

  it("keeps a missing poster as null", () => {
    const film = details({ poster_path: null }, [rd(3, "2026-11-05")]);

    expect(toMovie(film, window, "it", genreNames)?.posterPath).toBeNull();
  });
});
