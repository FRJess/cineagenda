import { defineRouting } from "next-intl/routing";

/** Locales and URL scheme: `/it/...` (default) and `/en/...`; `/` always goes to `/it`. */
export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
  localeDetection: false,
});
