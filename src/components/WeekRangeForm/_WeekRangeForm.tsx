import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { quickRanges, type CalendarMonth, type QuickRange } from "@/lib/releases/shortcuts";
import type { ReleaseWindow } from "@/lib/releases/window";
import { RangeFields } from "./_RangeFields";
import "./_WeekRangeForm.css";

/**
 * Date-range popover body: a GET form so the URL carries the range and works without JS.
 * Shortcut links (this week, next week, this month, the next two months) sit under the calendar.
 * @param props Current normalized range and today's ISO date in Europe/Rome.
 * @returns Form with from/to inputs, shortcuts and actions.
 */
export function WeekRangeForm({
  range,
  today,
}: {
  readonly range: ReleaseWindow;
  readonly today: string;
}) {
  const t = useTranslations("Nav");
  const format = useFormatter();
  const todayYear = Number(today.slice(0, 4));

  const monthName = ({ year, month }: CalendarMonth) => {
    const name = format.dateTime(new Date(Date.UTC(year, month - 1, 1)), {
      month: "long",
      timeZone: "UTC",
    });
    const capital = name.charAt(0).toUpperCase() + name.slice(1);

    return year === todayYear ? capital : `${capital} ${year}`;
  };

  const label = (shortcut: QuickRange): string =>
    shortcut.kind === "month" ? monthName(shortcut) : t(shortcut.kind);

  const isCurrent = (shortcut: QuickRange) =>
    shortcut.range.from === range.from && shortcut.range.to === range.to;

  return (
    <form method="get" data-part="week-range">
      <h2>{t("pickTitle")}</h2>
      <p data-part="help">{t("pickHelp")}</p>
      {/* Keyed by the range: a chip navigates on the client, and the calendar must restart from the new URL range. */}
      <RangeFields key={`${range.from}_${range.to}`} from={range.from} to={range.to} />
      <ul aria-label={t("shortcuts")} data-part="shortcuts">
        {quickRanges(today).map((shortcut, index) => (
          <li key={index}>
            <Link
              href={{ pathname: "/", query: { from: shortcut.range.from, to: shortcut.range.to } }}
              aria-current={isCurrent(shortcut) ? "true" : undefined}
            >
              {label(shortcut)}
            </Link>
          </li>
        ))}
      </ul>
      <div data-part="date-actions">
        <button type="submit">{t("show")}</button>
      </div>
    </form>
  );
}
