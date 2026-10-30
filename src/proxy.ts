import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/** Locale detection and `/` to `/it` redirect. */
export default createMiddleware(routing);

/** Skip API routes, Next internals and files with an extension. */
export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
