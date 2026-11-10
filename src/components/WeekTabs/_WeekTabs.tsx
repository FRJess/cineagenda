import { useFormatter, useTranslations } from "next-intl";
import { DatePicker } from "@/components/DatePicker";
import { WeekRangeForm } from "@/components/WeekRangeForm";
import { Link } from "@/i18n/navigation";
import { type Country, countryQuery } from "@/lib/country";
import { DAY_MONTH_SHORT, DAY_MONTH_SHORT_YEAR, isoDateToUtc } from "@/lib/releases/iso-date";
import {
  addDays,
  MIN_DATE,
  mondayOf,
  pageRange,
  shiftRange,
  tabWeeks,
  weeksBetween,
  type ReleaseWindow,
} from "@/lib/releases/window";
import "./_WeekTabs.css";

/** Calendar icon of the phone period button; decorative. */
function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <rect x="2" y="3.5" width="14" height="12.5" rx="2" />
      <path d="M2 7.5h14M6 1.5v4M12 1.5v4" />
    </svg>
  );
}

/**
 * Week navigation of the navbar. From 48rem: five Mondays around the range, each linking to its
 * one-week page, and the "Date" disclosure beside the list. Below 48rem the stylesheet swaps them
 * for the period bar: arrows that move the period by its own length around the same disclosure,
 * whose summary then shows the period. Every link keeps the country.
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
  const query = (window: ReleaseWindow) => ({ ...countryQuery(country), ...window });
  const weeks = weeksBetween(range).length;
  const thisYear = today.slice(0, 4);
  const showYear = range.from.slice(0, 4) !== thisYear || range.to.slice(0, 4) !== thisYear;
  const period = format.dateTimeRange(
    isoDateToUtc(range.from),
    isoDateToUtc(range.to),
    showYear ? DAY_MONTH_SHORT_YEAR : DAY_MONTH_SHORT,
  );
  const caption =
    range.from !== todayMonday
      ? t("weeksCount", { count: weeks })
      : weeks === 1
        ? t("periodThisWeek")
        : t("periodFromThisWeek");
  const hasPrevious = range.from > mondayOf(MIN_DATE);

  return (
    <nav aria-label={t("weekTabs")} data-part="week-tabs">
      {hasPrevious && (
        <Link
          href={{ pathname: "/", query: query(shiftRange(range, -1)) }}
          aria-label={t("previousPeriod")}
          data-part="step-previous"
        />
      )}
      <ul>
        {tabWeeks(range).map((monday) => (
          <li key={monday}>
            <Link
              href={{ pathname: "/", query: query(pageRange(monday)) }}
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
      <Link
        href={{ pathname: "/", query: query(shiftRange(range, 1)) }}
        aria-label={t("nextPeriod")}
        data-part="step-next"
      />
      <DatePicker
        summary={
          <>
            <span data-part="date-label">
              <b>{t("pickDates")}</b>
              <small>{t("pickHint")}</small>
            </span>
            <span data-part="period">
              <CalendarIcon />
              <span>
                <b>{period}</b>
                <small>{caption}</small>
              </span>
            </span>
          </>
        }
      >
        <WeekRangeForm range={range} today={today} country={country} />
      </DatePicker>
    </nav>
  );
}
