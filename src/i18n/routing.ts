import { defineRouting } from "next-intl/routing";

/** Locales and URL scheme: `/it/...` (default), `/en/...` and `/fr/...`; `/` always goes to `/it`. */
export const routing = defineRouting({
  locales: ["it", "en", "fr"],
  defaultLocale: "it",
  localeDetection: false,
});
