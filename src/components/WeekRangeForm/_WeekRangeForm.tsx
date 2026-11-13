import { useFormatter, useTranslations } from "next-intl";
import { type Country, countryQuery, releaseWeekday } from "@/lib/country";
import { quickRanges, type CalendarMonth, type QuickRange } from "@/lib/releases/shortcuts";
import type { ReleaseWindow } from "@/lib/releases/window";
import { WeekPicker } from "./_WeekPicker";
import "./_WeekRangeForm.css";

/**
 * Date-range popover body: a GET form so the URL carries the range and works without JS.
 * The week picker holds the calendar, the shortcut pills and the footer that submits the form.
 * @param props Current normalized range, today's ISO date in Europe/Rome and the country, which
 * the form keeps.
 * @returns Form with the picker, shortcuts and footer.
 */
export function WeekRangeForm({
  range,
  today,
  country,
}: {
  readonly range: ReleaseWindow;
  readonly today: string;
  readonly country: Country;
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

  return (
    <form method="get" data-part="week-range" data-release-day={releaseWeekday(country)}>
      <input type="hidden" name="country" value={countryQuery(country).country} />
      {/* Keyed by the range: after a submit the picker must restart from the new URL range. */}
      <WeekPicker
        key={`${range.from}_${range.to}`}
        from={range.from}
        to={range.to}
        releaseDay={releaseWeekday(country)}
        today={today}
        shortcuts={quickRanges(today).map((shortcut) => ({
          label: label(shortcut),
          range: shortcut.range,
        }))}
      />
    </form>
  );
}
