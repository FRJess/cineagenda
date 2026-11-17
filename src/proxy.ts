import { type NextRequest, NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { COUNTRY_COOKIE, resolveCountryRequest } from "./lib/country";
import { parsePeriod, periodHref, type PeriodHref } from "./lib/releases/period";
import {
  isRangeAllowed,
  parseRange,
  todayInRome,
  weeksBetween,
  type ReleaseWindow,
} from "./lib/releases/window";

const intl = createMiddleware(routing);
const ONE_YEAR_S = 60 * 60 * 24 * 365;

/**
 * Locale detection and `/` to `/it` redirect, the country memory and the period addresses.
 * Country: a URL without one goes to the country chosen last, and a chosen country is stored.
 * Period: `/it/2026-11-09` and `/it/2026-12` are served by the release list, which reads the
 * week from the query; the date form (`from`, `to`) and any other spelling of a period redirect
 * to that one address. Dates out of reach answer 404 here: the list streams, so it cannot set
 * the status itself.
 */
export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const [locale, segment, ...deeper] = pathname.split("/").slice(1);
  const list = hasLocale(routing.locales, locale) && deeper.length === 0;
  const period = list ? readPeriod(segment, searchParams) : undefined;

  if (period === null) {
    const url = request.nextUrl.clone();

    // No such page: the catch-all route under the locale renders the localized 404.
    url.pathname = `/${locale}/404`;
    url.search = "";

    return rewrite(request, url, locale);
  }

  const href = period && periodHref(period.range);

  if (href && !(period.fromPath && isSameAddress(href, segment, searchParams))) {
    const url = request.nextUrl.clone();
    const country = searchParams.get("country");

    url.pathname = `/${locale}${href.pathname}`;
    url.search = "";

    if (country !== null) {
      url.searchParams.set("country", country);
    }

    if (href.query.weeks) {
      url.searchParams.set("weeks", href.query.weeks);
    }

    return NextResponse.redirect(url);
  }

  const { redirect, remember } = resolveCountryRequest(
    searchParams.get("country"),
    request.cookies.get(COUNTRY_COOKIE)?.value,
  );

  if (redirect) {
    const url = request.nextUrl.clone();
    url.searchParams.set("country", redirect.toLowerCase());

    return NextResponse.redirect(url);
  }

  const response = period
    ? rewrite(request, listUrl(request, locale, period.range), locale)
    : intl(request);

  if (remember) {
    response.cookies.set(COUNTRY_COOKIE, remember, {
      httpOnly: true,
      maxAge: ONE_YEAR_S,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

// The release list is one page, `/[locale]`: it reads the period from `week` and `weeks`.
function listUrl(request: NextRequest, locale: string, range: ReleaseWindow) {
  const url = request.nextUrl.clone();

  url.pathname = `/${locale}`;
  url.searchParams.set("week", range.from);
  url.searchParams.set("weeks", String(weeksBetween(range).length));

  return url;
}

// A rewrite skips the next-intl middleware, so it must hand the locale to the server itself:
// next-intl reads it from this header wherever a component asks for translations.
function rewrite(request: NextRequest, url: URL, locale: string) {
  const headers = new Headers(request.headers);

  headers.set("X-NEXT-INTL-LOCALE", locale);

  return NextResponse.rewrite(url, { request: { headers } });
}

type Period = { readonly range: ReleaseWindow; readonly fromPath: boolean };

// Undefined: the URL names no period. Null: it names one the calendar cannot reach.
// The date form wins over the path, since the form is submitted to the address it sits on.
function readPeriod(
  segment: string | undefined,
  params: URLSearchParams,
): Period | null | undefined {
  const today = todayInRome(new Date());
  const from = params.get("from");
  const to = params.get("to");
  const week = params.get("week");

  if (from !== null || to !== null) {
    return from !== null && isRangeAllowed(from, to, today)
      ? { range: parseRange(from, to ?? undefined, today), fromPath: false }
      : null;
  }

  if (week !== null) {
    const range = parsePeriod(week, params.get("weeks"), today);

    return range && { range, fromPath: false };
  }

  if (segment === undefined) {
    return undefined;
  }

  const range = parsePeriod(segment, params.get("weeks"), today);

  return range ? { range, fromPath: true } : undefined;
}

function isSameAddress(href: PeriodHref, segment: string | undefined, params: URLSearchParams) {
  return href.pathname === `/${segment}` && (href.query.weeks ?? null) === params.get("weeks");
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
