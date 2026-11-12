import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DatePicker } from "@/components/DatePicker";
import { Link } from "@/i18n/navigation";
import { COUNTRIES, type Country, countryQuery } from "@/lib/country";
import "./_CountryPicker.css";

/** Raw list range carried by the country links, so switching keeps the weeks on screen. */
type RangeQuery = { readonly from: string; readonly to: string };

/** Decorative flag next to the country name; the name always carries the meaning. */
function Flag({ country }: { readonly country: Country }) {
  // SVGs need no resizing, so the optimizer is skipped.
  return (
    <Image src={`/flags/${country.toLowerCase()}.svg`} alt="" width={20} height={14} unoptimized />
  );
}

/**
 * Country of the releases, top right of the navbar: a filled button with flag and name that opens
 * a menu with one plain link per country. The links keep the page and the list range.
 * @param props Chosen country, the path the links point to, and the list range to keep.
 * @returns Disclosure button and, while open, the menu.
 */
export function CountryPicker({
  country,
  pathname,
  range,
}: {
  readonly country: Country;
  readonly pathname: string;
  readonly range?: RangeQuery;
}) {
  const t = useTranslations("Country");
  const locale = useLocale();
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const name = (code: Country) => names.of(code) ?? code;

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
          {COUNTRIES.map((code) => (
            <li key={code}>
              <Link
                href={{ pathname, query: { ...countryQuery(code), ...range } }}
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
