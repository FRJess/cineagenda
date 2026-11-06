import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { quickRanges, type CalendarMonth, type QuickRange } from "@/lib/releases/shortcuts";
import { MIN_DATE, type ReleaseWindow } from "@/lib/releases/window";
import "./_WeekRangeForm.css";

const WEEKS_LABEL = { 2: "weeks2", 4: "month1", 13: "months3" } as const;

/**
 * Date-range popover body: a GET form so the URL carries the range and works without JS.
 * Shortcut links and the way back to today sit under the inputs.
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
    shortcut.kind === "weeks" ? t(WEEKS_LABEL[shortcut.weeks]) : monthName(shortcut);

  const isCurrent = (shortcut: QuickRange) =>
    shortcut.range.from === range.from && shortcut.range.to === range.to;

  return (
    <form method="get" data-part="week-range">
      <h2>{t("pickTitle")}</h2>
      <p data-part="help">{t("pickHelp")}</p>
      <div data-part="date-fields">
        <p>
          <label htmlFor="range-from">{t("from")}</label>
          <input
            id="range-from"
            type="date"
            name="from"
            min={MIN_DATE}
            defaultValue={range.from}
            required
          />
        </p>
        <p>
          <label htmlFor="range-to">{t("to")}</label>
          <input id="range-to" type="date" name="to" min={MIN_DATE} defaultValue={range.to} />
        </p>
      </div>
      <ul aria-label={t("shortcuts")} data-part="shortcuts">
        {quickRanges(range, today).map((shortcut, index) => (
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
        <Link href="/">{t("today")}</Link>
      </div>
    </form>
  );
}
