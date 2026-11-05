import { useFormatter, useTranslations } from "next-intl";
import { WeekRangeForm } from "@/components/WeekRangeForm";
import { Link } from "@/i18n/navigation";
import { DAY_MONTH_SHORT, isoDateToUtc } from "@/lib/releases/iso-date";
import { addDays, pageRange, tabWeeks, type ReleaseWindow } from "@/lib/releases/window";
import "./_WeekTabs.css";

/**
 * Sticky week tabs: five Mondays around the range, each linking to its two-week page, and a
 * disclosure with the date form. The week the range starts on carries aria-current.
 * @param props Current normalized range and the Monday of the current week.
 * @returns Navigation landmark.
 */
export function WeekTabs({
  range,
  todayMonday,
}: {
  readonly range: ReleaseWindow;
  readonly todayMonday: string;
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
              href={{ pathname: "/", query: pageRange(monday) }}
              aria-current={monday === range.from ? "page" : undefined}
            >
              <b>{short(monday)}</b>
              <small>
                {monday === todayMonday ? t("thisWeekShort") : short(addDays(monday, 6))}
              </small>
            </Link>
          </li>
        ))}
        <li>
          <details>
            <summary>{t("pickDates")}</summary>
            <WeekRangeForm range={range} />
          </details>
        </li>
      </ul>
    </nav>
  );
}
