import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { COUNTRY_COOKIE, resolveCountryRequest } from "./lib/country";

const intl = createMiddleware(routing);
const ONE_YEAR_S = 60 * 60 * 24 * 365;

/**
 * Locale detection and `/` to `/it` redirect, plus the country memory: a URL without a country
 * goes to the one chosen last, and a chosen country is stored for the next visit.
 * @param request Incoming request.
 * @returns Redirect or the next-intl response.
 */
export default function proxy(request: NextRequest) {
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
      maxAge: ONE_YEAR_S,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

/** Skip API routes, Next internals and files with an extension. */
export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
