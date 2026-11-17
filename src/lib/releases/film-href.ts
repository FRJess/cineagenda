import { type Country, countryQuery } from "@/lib/country";

export function filmHref(id: number, country: Country): string {
  return `/film/${id}?${new URLSearchParams(countryQuery(country))}`;
}
