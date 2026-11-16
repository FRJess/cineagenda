import { describe, expect, it } from "vitest";
import { pageMetadata } from "./seo";

describe("pageMetadata", () => {
  it("sets the canonical and the Open Graph address under the locale", () => {
    const metadata = pageMetadata({
      locale: "it",
      path: "",
      query: { country: "it" },
      title: "Cineagenda",
      description: "Film in uscita.",
    });

    expect(metadata.alternates).toEqual({ canonical: "/it?country=it" });
    expect(metadata.openGraph).toMatchObject({ url: "/it?country=it" });
  });

  it("keeps the period and the query in the address", () => {
    const metadata = pageMetadata({
      locale: "fr",
      path: "/2026-11-09",
      query: { country: "fr", weeks: "2" },
      title: "Cineagenda",
      description: "Films.",
    });

    expect(metadata.alternates).toEqual({ canonical: "/fr/2026-11-09?country=fr&weeks=2" });
  });

  it("writes no question mark without a query", () => {
    const metadata = pageMetadata({
      locale: "en",
      path: "/privacy",
      title: "Privacy",
      description: "Privacy.",
    });

    expect(metadata.alternates).toEqual({ canonical: "/en/privacy" });
  });

  it("repeats title and description for social previews, with the site name and the locale", () => {
    const metadata = pageMetadata({
      locale: "en",
      path: "",
      title: "Cinema releases",
      description: "Week by week.",
    });

    expect(metadata.title).toBe("Cinema releases");
    expect(metadata.description).toBe("Week by week.");
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "Cineagenda",
      locale: "en_GB",
      title: "Cinema releases",
      description: "Week by week.",
    });
  });

  it("adds the preview image only when the page has one", () => {
    const base = { locale: "it", path: "/film/62", title: "Film", description: "Trama." } as const;
    const image = { url: "https://image.tmdb.org/t/p/w1280/b.jpg", width: 1280, height: 720 };

    expect(pageMetadata({ ...base, image }).openGraph).toMatchObject({ images: [image] });
    expect(pageMetadata(base).openGraph).not.toHaveProperty("images");
  });
});
