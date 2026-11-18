import { describe, expect, it } from "vitest";
import { details } from "@/test/tmdb-fixtures";
import { localPoster } from "./poster";

const poster = (file_path: string, iso_639_1: string | null, iso_3166_1: string | null) => ({
  file_path,
  iso_639_1,
  iso_3166_1,
});

describe("localPoster", () => {
  it("takes the first poster of the chosen country", () => {
    const film = details({
      images: {
        posters: [
          poster("/us.jpg", "en", "US"),
          poster("/it-best.jpg", "it", "IT"),
          poster("/it-second.jpg", "it", "IT"),
        ],
      },
    });

    expect(localPoster(film, "IT")).toBe("/it-best.jpg");
    expect(localPoster(film, "US")).toBe("/us.jpg");
  });

  it("does not take a poster in the country's language made for another country", () => {
    const film = details({
      original_language: "en",
      images: { posters: [poster("/quebec.jpg", "fr", "CA"), poster("/en.jpg", "en", "US")] },
    });

    expect(localPoster(film, "FR")).toBe("/en.jpg");
  });

  it("falls back to the first poster in the original language", () => {
    const film = details({
      original_language: "ro",
      images: {
        posters: [
          poster("/us.jpg", "en", "US"),
          poster("/ro.jpg", "ro", "RO"),
          poster("/ro-second.jpg", "ro", null),
        ],
      },
    });

    expect(localPoster(film, "IT")).toBe("/ro.jpg");
  });

  it("keeps the default poster when neither exists", () => {
    const film = details({
      original_language: "ro",
      images: { posters: [poster("/us.jpg", "en", "US"), poster("/plain.jpg", null, null)] },
    });

    expect(localPoster(film, "IT")).toBe("/poster.jpg");
  });

  it("keeps the default poster when TMDB sent no image list", () => {
    expect(localPoster(details(), "IT")).toBe("/poster.jpg");
    expect(localPoster(details({ poster_path: null }), "IT")).toBeNull();
  });
});
