"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import "./_LocaleSwitch.css";

type Query = Readonly<Record<string, string>>;

/** The only params a locale link carries; anything else in the URL is dropped. */
const KEPT_PARAMS = ["country", "weeks"] as const;

const CODE_KEY = { it: "itCode", en: "enCode", fr: "frCode" } as const;

function Links({ query }: { readonly query: Query }) {
  const t = useTranslations("Header");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("language")} data-part="locale-switch">
      <ul>
        {routing.locales.map((locale) => (
          <li key={locale}>
            <Link
              href={{ pathname, query }}
              locale={locale}
              lang={locale}
              aria-current={locale === current ? "page" : undefined}
            >
              {/* The visible code stays in the name (WCAG 2.5.3); the full name follows it. */}
              {t(CODE_KEY[locale])}
              <span data-part="sr-only"> {t(locale)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Reads the query so changing language keeps the country and the weeks; the path holds the date.
function LinksWithQuery() {
  const params = useSearchParams();
  const query = Object.fromEntries(
    KEPT_PARAMS.flatMap((key) => {
      const value = params.get(key);

      return value === null ? [] : [[key, value]];
    }),
  );

  return <Links query={query} />;
}

/**
 * Links to the current page in every locale: the two-letter code, then the language's own name
 * for screen readers;
 * the active one carries aria-current. The links keep the query, so the country and the dates
 * stay; until the query is read they point to the bare page.
 * @returns Navigation landmark.
 */
export function LocaleSwitch() {
  return (
    <Suspense fallback={<Links query={{}} />}>
      <LinksWithQuery />
    </Suspense>
  );
}
