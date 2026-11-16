import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DatePicker } from "@/components/DatePicker";
import { Link } from "@/i18n/navigation";
import { COUNTRIES, type Country, countryQuery } from "@/lib/country";
import "./_CountryPicker.css";

/** Decorative flag next to the country name; the name always carries the meaning. */
function Flag({ country }: { readonly country: Country }) {
  // SVGs need no resizing, so the optimizer is skipped.
  return (
    <Image src={`/flags/${country.toLowerCase()}.svg`} alt="" width={20} height={14} unoptimized />
  );
}

/**
 * Country of the releases, top right of the navbar: a filled button with flag and name that opens
 * a menu with one plain link per country, sorted by name in the page language. The links keep
 * the page and its period.
 * @param props Chosen country, the path the links point to, and the query they keep with it.
 * @returns Disclosure button and, while open, the menu.
 */
export function CountryPicker({
  country,
  pathname,
  query,
}: {
  readonly country: Country;
  readonly pathname: string;
  readonly query?: Readonly<Record<string, string>>;
}) {
  const t = useTranslations("Country");
  const locale = useLocale();
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const name = (code: Country) => names.of(code) ?? code;
  const byName = [...COUNTRIES].sort((a, b) => name(a).localeCompare(name(b), locale));

  return (
    <DatePicker
      key={country}
      part="country-picker"
      summaryLabel={t("label", { country: name(country) })}
      summary={
        <>
          <Flag country={country} />
          <span data-part="country-name">{name(country)}</span>
        </>
      }
    >
      <div data-part="country-menu">
        <p id="country-menu-title">{t("menuTitle")}</p>
        <ul aria-labelledby="country-menu-title">
          {byName.map((code) => (
            <li key={code}>
              <Link
                href={{ pathname, query: { ...countryQuery(code), ...query } }}
                aria-current={code === country ? "true" : undefined}
              >
                <Flag country={code} />
                {name(code)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </DatePicker>
  );
}
