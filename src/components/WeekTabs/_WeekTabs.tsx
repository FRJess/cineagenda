import { useFormatter, useTranslations } from "next-intl";
import { DatePicker } from "@/components/DatePicker";
import { WeekRangeForm } from "@/components/WeekRangeForm";
import { Link } from "@/i18n/navigation";
import { type Country, countryQuery } from "@/lib/country";
import { DAY_MONTH_SHORT, isoDateToUtc } from "@/lib/releases/iso-date";
import { addDays, pageRange, tabWeeks, type ReleaseWindow } from "@/lib/releases/window";
import "./_WeekTabs.css";

/**
 * Week tabs for the navbar: five Mondays around the range, each linking to its one-week page in
 * the same country, and a disclosure beside the list that holds the date form. The week the
 * range starts on carries aria-current.
 * @param props Current normalized range, the Monday of the current week, today's ISO date and
 * the country of the list.
 * @returns Navigation landmark.
 */
export function WeekTabs({
  range,
  todayMonday,
  today,
  country,
}: {
  readonly range: ReleaseWindow;
  readonly todayMonday: string;
  readonly today: string;
  readonly country: Country;
}) {
  const t = useTranslations("Nav");
  const format = useFormatter();
  const short = (isoDate: string) => format.dateTime(isoDateToUtc(isoDate), DAY_MONTH_SHORT);

  return (
    <nav aria-label={t("weekTabs")} data-part="week-tabs">
      <ul>
        {tabWeeks(range).map((monday) => (
          <li key={monday}>
            <Link
              href={{ pathname: "/", query: { ...countryQuery(country), ...pageRange(monday) } }}
              aria-current={monday === range.from ? "page" : undefined}
            >
              <b>{short(monday)}</b>
              <small>
                {monday === todayMonday ? t("thisWeekShort") : short(addDays(monday, 6))}
              </small>
            </Link>
          </li>
        ))}
      </ul>
      <DatePicker
        summary={
          <>
            <b>{t("pickDates")}</b>
            <small>{t("pickHint")}</small>
          </>
        }
      >
        <WeekRangeForm range={range} today={today} country={country} />
      </DatePicker>
    </nav>
  );
}
