/**
 * Netlify Edge Function: passes the visitor's country to the app as a request header. Netlify
 * gives the location only to edge functions (`context.geo`), not to the Next.js server, and the
 * English pages need it to pick their default country (`visitorCountry` in `src/lib/country.ts`).
 */

/** The part of Netlify's edge `Context` used here, so the repo needs no Netlify types. */
type Context = {
  readonly geo?: { readonly country?: { readonly code?: string } };
  readonly next: (request?: Request) => Promise<Response>;
};

const HEADER = "x-cineagenda-country";

export default async function geoCountry(request: Request, context: Context): Promise<Response> {
  const headers = new Headers(request.headers);
  const code = context.geo?.country?.code;

  // Always replaced, so a visitor cannot pick the value by sending the header.
  headers.delete(HEADER);

  if (code) {
    headers.set(HEADER, code);
  }

  return context.next(new Request(request, { headers }));
}

export const config = { path: "/*", excludedPath: ["/_next/*"] };
