import { defineRouting } from "next-intl/routing";

// The root follows the browser language; any language without a UI version gets English.
// No locale cookie: the language lives in the URL, and the privacy page lists every cookie.
export const routing = defineRouting({
  locales: ["it", "en", "fr"],
  defaultLocale: "en",
  localeDetection: true,
  localeCookie: false,
});
