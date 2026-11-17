import type { ImageLoaderProps } from "next/image";

const TMDB_IMAGE = /^(https:\/\/image\.tmdb\.org\/t\/p\/)[^/]+(\/.+)$/;
// Widths TMDB serves for both posters and backdrops; next.config.ts lists the same ones.
const WIDTHS = [185, 300, 342, 500, 780, 1280] as const;
const MAX_WIDTH = 1280;

/**
 * Loader of every `next/image`: a TMDB image is asked from TMDB in the width the browser needs,
 * rounded up to a size TMDB serves, so nothing goes through the Vercel optimizer.
 * @param props Address of the image and the width asked for.
 * @returns TMDB address in that width; any other address unchanged.
 */
export default function imageLoader({ src, width }: Pick<ImageLoaderProps, "src" | "width">) {
  const match = TMDB_IMAGE.exec(src);

  if (!match) {
    return src;
  }

  const size = WIDTHS.find((candidate) => candidate >= width) ?? MAX_WIDTH;

  return `${match[1]}w${size}${match[2]}`;
}
