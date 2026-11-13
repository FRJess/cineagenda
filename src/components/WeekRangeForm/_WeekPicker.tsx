"use client";

import { DayPicker, type DateRange } from "@daypicker/react";
import { enGB, fr, it } from "@daypicker/react/locale";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { formatDateRange } from "@/lib/releases/date-range";
import { isoDateToUtc } from "@/lib/releases/iso-date";
import { reachOf, selectWeeks, type WeekRange } from "@/lib/releases/week-range";
import {
  addDays,
  MAX_WEEKS,
  maxDate,
  MIN_DATE,
  todayInRome,
  weeksBetween,
} from "@/lib/releases/window";

const LOCALES = { it, en: enGB, fr } as const;

const subscribeNever = () => () => undefined;
const isClient = () => true;
const isServer = () => false;

const WIDE = "(min-width: 48rem)";
const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia?.(WIDE);
  query?.addEventListener("change", onChange);

  return () => query?.removeEventListener("change", onChange);
};
// jsdom and the server have no matchMedia: they get the phone layout.
const isWideScreen = () => window.matchMedia?.(WIDE).matches ?? false;

/** A shortcut pill: its label in the UI language and the weeks it selects. */
export type Shortcut = { readonly label: string; readonly range: WeekRange };

type Props = {
  readonly from: string; // YYYY-MM-DD, normalized range from the URL (Monday to Sunday)
  readonly to: string;
  readonly releaseDay: number; // usual release weekday of the country, 0 = Sunday
  readonly today: string; // ISO date in Europe/Rome, for the year rule of the footer range
  readonly shortcuts: readonly Shortcut[]; // pills between the calendar and the footer
};

/**
 * Week picker: the only date control of the GET form. Every calendar row is a week; a click
 * selects or extends whole weeks, up to {@link MAX_WEEKS}: the days still in reach are tinted,
 * and a click beyond them starts again from that week. A shortcut pill selects its weeks in the
 * calendar; only the footer submit changes the list. The calendar renders after hydration.
 * @param props The URL range, the country's release weekday, today's date and the shortcuts.
 * @returns Hidden inputs, calendar, shortcuts and footer.
 */
export function WeekPicker({ from, to, releaseDay, today, shortcuts }: Props) {
  const locale = useLocale() as keyof typeof LOCALES;
  const t = useTranslations("Nav");
  const hydrated = useSyncExternalStore(subscribeNever, isClient, isServer);
  // Two months side by side from 48rem; one full-width month on phones, so both arrows show.
  const wide = useSyncExternalStore(subscribeWide, isWideScreen, isServer);
  // DatePicker mounts the form on every opening, so an unsent selection is dropped there.
  const [range, setRange] = useState<WeekRange>({ from, to });

  const [month, setMonth] = useState(() => isoDateToUtc(from));

  const handleDayClick = (day: Date) => {
    setRange(selectWeeks(range, todayInRome(day), MAX_WEEKS));
  };

  const handleShortcut = (shortcut: Shortcut) => {
    setRange(shortcut.range);
    // The Sunday of the first week: a month shortcut starts on the last Monday of the month before.
    setMonth(isoDateToUtc(addDays(shortcut.range.from, 6)));
  };

  const weeks = weeksBetween(range).length;
  const lastDay = isoDateToUtc(maxDate(today));
  const reach = reachOf(range, MAX_WEEKS).map((span) => ({
    from: isoDateToUtc(span.from),
    to: isoDateToUtc(span.to),
  }));
  const selected: DateRange = { from: isoDateToUtc(range.from), to: isoDateToUtc(range.to) };

  return (
    <>
      <input type="hidden" name="from" value={range.from} />
      <input type="hidden" name="to" value={range.to} />
      {hydrated && (
        <DayPicker
          mode="range"
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          // onSelect, not onDayClick: without it DayPicker treats `selected` as initial only and draws its own day range.
          onSelect={(_, day) => handleDayClick(day)}
          locale={LOCALES[locale]}
          timeZone="Europe/Rome"
          weekStartsOn={1}
          startMonth={isoDateToUtc(MIN_DATE)}
          endMonth={lastDay}
          disabled={[{ before: isoDateToUtc(MIN_DATE) }, { after: lastDay }]}
          numberOfMonths={wide ? 2 : 1}
          // With one month, a week across two months is still drawn complete.
          showOutsideDays={!wide}
          captionLayout="label"
          navLayout="around"
          formatters={{
            formatWeekdayName: (weekday, _options, dateLib) =>
              dateLib ? dateLib.format(weekday, "EEE") : "",
          }}
          modifiers={{ release: { dayOfWeek: [releaseDay] }, reach }}
          modifiersClassNames={{ release: "rdp-day_release", reach: "rdp-day_reach" }}
          aria-label={t("calendar")}
        />
      )}
      <ul aria-label={t("shortcuts")} data-part="shortcuts">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.label}>
            <button
              type="button"
              aria-pressed={shortcut.range.from === range.from && shortcut.range.to === range.to}
              onClick={() => handleShortcut(shortcut)}
            >
              {shortcut.label}
            </button>
          </li>
        ))}
      </ul>
      <footer data-part="picker-footer">
        <output aria-live="polite">
          <b>
            {formatDateRange(locale, range.from, range.to, {
              month: "short",
              year: "auto",
              currentYear: today.slice(0, 4),
            })}
          </b>
          <small>{t("weeksCount", { count: weeks })}</small>
        </output>
        <button type="submit">{t("showWeeks", { count: weeks })}</button>
      </footer>
    </>
  );
}
