import { useFormatter, useLocale, useTranslations } from "next-intl";
import { DatePicker } from "@/components/DatePicker";
import { WeekRangeForm } from "@/components/WeekRangeForm";
import { Link } from "@/i18n/navigation";
import { type Country, countryQuery } from "@/lib/country";
import { formatDateRange } from "@/lib/releases/date-range";
import { DAY_MONTH_SHORT, isoDateToUtc } from "@/lib/releases/iso-date";
import { periodHref } from "@/lib/releases/period";
import {
  addDays,
  maxDate,
  MIN_DATE,
  mondayOf,
  pageRange,
  shiftRange,
  tabWeeks,
  weeksBetween,
  type ReleaseWindow,
} from "@/lib/releases/window";
import "./_WeekTabs.css";

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
  const locale = useLocale();
  const short = (isoDate: string) => format.dateTime(isoDateToUtc(isoDate), DAY_MONTH_SHORT);
  const href = (window: ReleaseWindow) => {
    const { pathname, query } = periodHref(window);

    return { pathname, query: { ...countryQuery(country), ...query } };
  };
  const weeks = weeksBetween(range).length;
  // The phone bar never shows the year: the week titles below do.
  const period = formatDateRange(locale, range.from, range.to, {
    month: "short",
    year: "never",
    currentYear: today.slice(0, 4),
  });
  const caption =
    range.from !== todayMonday
      ? t("weeksCount", { count: weeks })
      : weeks === 1
        ? t("periodThisWeek")
        : t("periodFromThisWeek");
  const hasPrevious = range.from > mondayOf(MIN_DATE);
  const lastDay = maxDate(today);
  const next = shiftRange(range, 1);

  return (
    <nav aria-label={t("weekTabs")} data-part="week-tabs">
      {hasPrevious && (
        <Link
          href={href(shiftRange(range, -1))}
          aria-label={t("previousPeriod")}
          data-part="step-previous"
        />
      )}
      <ul>
        {tabWeeks(range)
          .filter((monday) => monday <= lastDay)
          .map((monday) => (
            <li key={monday}>
              <Link
                href={href(pageRange(monday))}
                // Every week of the range is current; "true", since a set can have several.
                aria-current={monday >= range.from && monday <= range.to ? "true" : undefined}
              >
                <b>{short(monday)}</b>
                <small>
                  {monday === todayMonday ? t("thisWeekShort") : short(addDays(monday, 6))}
                </small>
              </Link>
            </li>
          ))}
      </ul>
      {next.to <= lastDay && (
        <Link href={href(next)} aria-label={t("nextPeriod")} data-part="step-next" />
      )}
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
