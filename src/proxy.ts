import { type NextRequest, NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { COUNTRY_COOKIE, resolveCountryRequest } from "./lib/country";
import { isRangeAllowed, todayInRome } from "./lib/releases/window";

const intl = createMiddleware(routing);
const ONE_YEAR_S = 60 * 60 * 24 * 365;

/**
 * Locale detection and `/` to `/it` redirect, plus the country memory: a URL without a country
 * goes to the one chosen last, and a chosen country is stored for the next visit. Dates the UI
 * cannot produce answer 404 here: the pages stream, so they cannot set the status themselves.
 * @param request Incoming request.
 * @returns Redirect, the 404 page or the next-intl response.
 */
export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (!isRangeAllowed(searchParams.get("from"), searchParams.get("to"), todayInRome(new Date()))) {
    const segment = pathname.split("/")[1];
    const locale = hasLocale(routing.locales, segment) ? segment : routing.defaultLocale;
    const url = request.nextUrl.clone();

    // No such page: the catch-all route under the locale renders the localized 404.
    url.pathname = `/${locale}/404`;
    url.search = "";

    return NextResponse.rewrite(url);
  }

  const { redirect, remember } = resolveCountryRequest(
    request.nextUrl.searchParams.get("country"),
    request.cookies.get(COUNTRY_COOKIE)?.value,
  );

  if (redirect) {
    const url = request.nextUrl.clone();
    url.searchParams.set("country", redirect.toLowerCase());

    return NextResponse.redirect(url);
  }

  const response = intl(request);

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

/** Skip API routes, Next internals and files with an extension. */
export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
