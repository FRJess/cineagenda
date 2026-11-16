import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/seo";
import sitemap from "./sitemap";

const url = (path: string): string => new URL(path, SITE_URL).href;

describe("sitemap", () => {
  it("lists home, about and privacy in every locale", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual(
      ["/it", "/en", "/fr", "/it/about", "/en/about", "/fr/about"]
        .concat(["/it/privacy", "/en/privacy", "/fr/privacy"])
        .map(url),
    );
  });

  it("names the same page in the other languages, Italian as x-default", () => {
    const entries = sitemap();
    const languagesOf = (path: string) =>
      entries.find((entry) => entry.url === url(path))?.alternates?.languages;

    expect(languagesOf("/en")).toEqual({
      it: url("/it"),
      en: url("/en"),
      fr: url("/fr"),
      "x-default": url("/it"),
    });
    expect(languagesOf("/fr/about")).toEqual({
      it: url("/it/about"),
      en: url("/en/about"),
      fr: url("/fr/about"),
      "x-default": url("/it/about"),
    });
  });
});
