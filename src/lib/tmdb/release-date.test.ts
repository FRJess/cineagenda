import { describe, expect, it } from "vitest";
import { details, rd } from "@/test/tmdb-fixtures";
import { pickRelease } from "./release-date";

const window = { from: "2026-10-26", to: "2027-01-28" };

describe("pickRelease", () => {
  it("picks the in-window entry over older theatrical ones", () => {
    const film = details({}, [
      rd(1, "1968-07-10"),
      rd(2, "2026-11-16", "Re-release"),
      rd(3, "1974-03-05", "Re-release"),
      rd(3, "1968-12-12"),
    ]);

    expect(pickRelease(film, window)).toEqual({
      date: "2026-11-16",
      type: "limited",
      note: "Re-release",
    });
  });

  it("prefers theatrical over limited in the window", () => {
    const film = details({}, [rd(2, "2027-01-06", "Anteprima"), rd(3, "2027-01-13")]);

    expect(pickRelease(film, window)).toEqual({
      date: "2027-01-13",
      type: "theatrical",
      note: "",
    });
  });

  it("reads the release of the chosen country", () => {
    const film = details({
      release_dates: {
        results: [
          { iso_3166_1: "IT", release_dates: [rd(3, "2026-11-12")] },
          { iso_3166_1: "FR", release_dates: [rd(3, "2026-11-11")] },
        ],
      },
    });

    expect(pickRelease(film, window, "FR")).toEqual({
      date: "2026-11-11",
      type: "theatrical",
      note: "",
    });
  });

  it("ignores other countries", () => {
    const film = details({
      release_dates: { results: [{ iso_3166_1: "US", release_dates: [rd(3, "2026-11-05")] }] },
    });

    expect(pickRelease(film, window)).toBeNull();
  });

  it.each([
    [1, "premiere"],
    [4, "digital"],
    [5, "physical"],
    [6, "TV"],
  ])("never shows type %i (%s): cinema only", (type) => {
    expect(pickRelease(details({}, [rd(type, "2026-11-05")]), window)).toBeNull();
  });

  it("drops a limited entry released the same week as a festival premiere", () => {
    // TMDB id 1462778: premiere at a Rome festival plus a bare limited entry five days earlier.
    const film = details({}, [
      rd(1, "2026-10-31", "EU Balkan Film Festival, Rome"),
      rd(2, "2026-10-26"),
    ]);

    expect(pickRelease(film, window)).toBeNull();
  });

  it("keeps a bare limited entry when the premiere is far away", () => {
    const film = details({}, [rd(1, "2026-08-30", "Venice"), rd(2, "2026-11-05")]);

    expect(pickRelease(film, window)?.date).toBe("2026-11-05");
  });

  it.each(["CineUnderground Film Festival", "Anteprima", "Anteprima IMAX ed EPIC", "Premiere"])(
    "drops a limited entry noted %j (festival or premiere)",
    (note) => {
      expect(pickRelease(details({}, [rd(2, "2026-11-26", note)]), window)).toBeNull();
    },
  );

  it.each(["Re-release", "40th Anniversary", "4K Restoration", "IMAX", "Evento speciale", ""])(
    "keeps a limited entry noted %j (re-release, IMAX run, event release or plain limited run)",
    (note) => {
      expect(pickRelease(details({}, [rd(2, "2026-11-26", note)]), window)).toEqual({
        date: "2026-11-26",
        type: "limited",
        note,
      });
    },
  );

  it("still prefers a theatrical entry even when a limited one is a festival screening", () => {
    const film = details({}, [rd(2, "2026-11-05", "Festival"), rd(3, "2026-11-12")]);

    expect(pickRelease(film, window)?.date).toBe("2026-11-12");
  });

  it("drops a limited entry that previews a theatrical release a few weeks later", () => {
    // TMDB lists "Vous pouvez tout voir" in France as limited on Dec 1 and theatrical on Dec 30.
    const film = details({}, [rd(2, "2026-12-01"), rd(3, "2026-12-30")]);

    expect(pickRelease(film, { from: "2026-11-30", to: "2026-12-06" })).toBeNull();
    expect(pickRelease(film, window)).toEqual({ date: "2026-12-30", type: "theatrical", note: "" });
  });

  it("keeps a limited entry when the theatrical release is months later", () => {
    const film = details({}, [rd(2, "2026-11-05"), rd(3, "2027-03-10")]);

    expect(pickRelease(film, window)?.date).toBe("2026-11-05");
  });

  it("includes the first day of the window", () => {
    expect(pickRelease(details({}, [rd(3, "2026-10-26")]), window)?.date).toBe("2026-10-26");
  });

  it("includes the last day of the window", () => {
    expect(pickRelease(details({}, [rd(3, "2027-01-28")]), window)?.date).toBe("2027-01-28");
  });

  it("trims the note", () => {
    expect(pickRelease(details({}, [rd(3, "2026-12-03", "25th Anniversary ")]), window)?.note).toBe(
      "25th Anniversary",
    );
  });
});
