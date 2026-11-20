import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDev = process.env.NODE_ENV !== "production";

// Static policy: a nonce would force every page to render dynamically and lose the cached shell.
// Next and the theme boot script are inline, hence 'unsafe-inline'; React needs eval in dev only.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://image.tmdb.org",
  "font-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Bots that get metadata in the <head> of the first HTML instead of streamed into the body.
// Next's default list, plus Google: a canonical in the body is ignored, so Search Console saw
// no user-declared canonical. Visitors keep streamed metadata.
const HTML_LIMITED_BOTS =
  /Googlebot|Google-InspectionTool|Mediapartners-Google|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview/i;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  htmlLimitedBots: HTML_LIMITED_BOTS,
  headers: async () => [{ source: "/:path*", headers: SECURITY_HEADERS }],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" }],
    // TMDB resizes its own images: the loader swaps the size in the address, and these are
    // the widths TMDB serves, so every srcset entry is a file that exists.
    loader: "custom",
    loaderFile: "./src/lib/tmdb/image-loader.ts",
    deviceSizes: [342, 500, 780, 1280],
    imageSizes: [185, 300],
  },
};

export default createNextIntlPlugin()(nextConfig);
