import { type Country, countryQuery } from "@/lib/country";

/**
 * Link from a card to the film page. It carries the country, for the dates and titles.
 * @param id TMDB movie id.
 * @param country Country of the list.
 * @returns Path with query, e.g. `/film/62?country=fr`.
 */
export function filmHref(id: number, country: Country): string {
  return `/film/${id}?${new URLSearchParams(countryQuery(country))}`;
}
