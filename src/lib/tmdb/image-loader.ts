import type { ImageLoaderProps } from "next/image";

const TMDB_IMAGE = /^(https:\/\/image\.tmdb\.org\/t\/p\/)w(\d+)(\/.+)$/;
// Widths TMDB serves for both posters and backdrops; next.config.ts lists the same ones.
const WIDTHS = [185, 300, 342, 500, 780, 1280] as const;

/**
 * Loader of every `next/image`: a TMDB image is asked from TMDB in the width the browser needs,
 * rounded up to a size TMDB serves, so nothing goes through the Vercel optimizer. The size in
 * the address is the ceiling: a 3x phone would otherwise fetch a poster twice as heavy as the
 * design needs.
 */
export default function imageLoader({ src, width }: Pick<ImageLoaderProps, "src" | "width">) {
  const match = TMDB_IMAGE.exec(src);

  if (!match) {
    return src;
  }

  const largest = Number(match[2]);
  const size = Math.min(WIDTHS.find((candidate) => candidate >= width) ?? largest, largest);

  return `${match[1]}w${size}${match[3]}`;
}
