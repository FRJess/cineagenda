import { type Country, titleLanguage } from "@/lib/country";
import type { TmdbMovieDetails } from "./types";

/**
 * Poster to show for a country: the best-voted one made for that country, else the best-voted
 * one in the film's original language, else TMDB's default. A poster in the country's language
 * made for another country does not count: Quebec posters carry other titles than French ones.
 */
export function localPoster(details: TmdbMovieDetails, country: Country): string | null {
  const posters = details.images?.posters ?? [];
  const language = titleLanguage(country);
  const poster =
    posters.find((p) => p.iso_639_1 === language && p.iso_3166_1 === country) ??
    posters.find((p) => p.iso_639_1 === details.original_language);

  return poster?.file_path ?? details.poster_path;
}
