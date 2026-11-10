import { type Country, countryQuery } from "@/lib/country";
import type { ReleaseWindow } from "./window";

/**
 * Link from a card to the film page. It carries the country, for the dates and titles, and the
 * list range, so the back link returns to the same weeks.
 * @param id TMDB movie id.
 * @param country Country of the list.
 * @param range List range, when the card sits in one.
 * @returns Path with query, e.g. `/film/62?country=fr&from=2026-11-09&to=2026-11-15`.
 */
export function filmHref(id: number, country: Country, range?: ReleaseWindow): string {
  const query = new URLSearchParams({ ...countryQuery(country), ...range });

  return `/film/${id}?${query}`;
}
