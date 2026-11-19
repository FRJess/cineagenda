import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/seo";
import sitemap from "./sitemap";

const url = (path: string): string => new URL(path, SITE_URL).href;

describe("sitemap", () => {
  it("lists only the home page, in every locale", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual(["/it", "/en", "/fr"].map(url));
  });

  it("names the home in the other languages, English as x-default", () => {
    const languagesOf = (path: string) =>
      sitemap().find((entry) => entry.url === url(path))?.alternates?.languages;

    expect(languagesOf("/fr")).toEqual({
      it: url("/it"),
      en: url("/en"),
      fr: url("/fr"),
      "x-default": url("/en"),
    });
  });
});
