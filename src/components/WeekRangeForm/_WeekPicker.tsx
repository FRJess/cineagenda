"use client";

import { DayPicker, type DateRange } from "@daypicker/react";
import { enGB, fr, it } from "@daypicker/react/locale";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { formatDateRange } from "@/lib/releases/date-range";
import { isoDateToUtc } from "@/lib/releases/iso-date";
import { clampWeeks, extendWeeks, type WeekRange } from "@/lib/releases/week-range";
import { MAX_WEEKS, MIN_DATE, todayInRome, weeksBetween } from "@/lib/releases/window";

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

type Props = {
  readonly from: string; // YYYY-MM-DD, normalized range from the URL (Monday to Sunday)
  readonly to: string;
  readonly releaseDay: number; // usual release weekday of the country, 0 = Sunday
  readonly today: string; // ISO date in Europe/Rome, for the year rule of the footer range
  readonly children?: ReactNode; // shortcut links, rendered between the calendar and the footer
};

/**
 * Week picker: the only date control of the GET form. Every calendar row is a week; a click
 * selects or extends whole weeks. The calendar renders after hydration; the hidden from/to
 * inputs and the footer submit work without JS.
 * @param props The URL range, the country's release weekday, today's date and the shortcut list.
 * @returns Hidden inputs, calendar, shortcuts and footer.
 */
export function WeekPicker({ from, to, releaseDay, today, children }: Props) {
  const locale = useLocale() as keyof typeof LOCALES;
  const t = useTranslations("Nav");
  const hydrated = useSyncExternalStore(subscribeNever, isClient, isServer);
  // Two months side by side from 48rem; one full-width month on phones, so both arrows show.
  const wide = useSyncExternalStore(subscribeWide, isWideScreen, isServer);
  // DatePicker mounts the form on every opening, so an unsent selection is dropped there.
  const [range, setRange] = useState<WeekRange>({ from, to });

  const handleDayClick = (day: Date) => {
    const iso = todayInRome(day);

    setRange(clampWeeks(extendWeeks(range, iso), MAX_WEEKS, iso));
  };

  const weeks = weeksBetween(range).length;
  const atMax = weeks >= MAX_WEEKS;
  const selected: DateRange = { from: isoDateToUtc(range.from), to: isoDateToUtc(range.to) };

  return (
    <>
      <input type="hidden" name="from" value={range.from} />
      <input type="hidden" name="to" value={range.to} />
      {hydrated && (
        <DayPicker
          mode="range"
          selected={selected}
          defaultMonth={isoDateToUtc(range.from)}
          // onSelect, not onDayClick: without it DayPicker treats `selected` as initial only and draws its own day range.
          onSelect={(_, day) => handleDayClick(day)}
          locale={LOCALES[locale]}
          timeZone="Europe/Rome"
          weekStartsOn={1}
          startMonth={isoDateToUtc(MIN_DATE)}
          disabled={{ before: isoDateToUtc(MIN_DATE) }}
          numberOfMonths={wide ? 2 : 1}
          // With one month, a week across two months is still drawn complete.
          showOutsideDays={!wide}
          captionLayout="label"
          navLayout="around"
          formatters={{
            formatWeekdayName: (weekday, _options, dateLib) =>
              dateLib ? dateLib.format(weekday, "EEE") : "",
          }}
          modifiers={{ release: { dayOfWeek: [releaseDay] } }}
          modifiersClassNames={{ release: "rdp-day_release" }}
          aria-label={t("calendar")}
        />
      )}
      {children}
      <footer data-part="picker-footer">
        <output aria-live="polite" data-max={atMax ? "" : undefined}>
          <b>
            {formatDateRange(locale, range.from, range.to, {
              month: "short",
              year: "auto",
              currentYear: today.slice(0, 4),
            })}
          </b>
          <small>
            {t("weeksCount", { count: weeks })} ·{" "}
            {atMax ? t("maxReached") : t("maxWeeks", { max: MAX_WEEKS })}
          </small>
        </output>
        <button type="submit">{t("showWeeks", { count: weeks })}</button>
      </footer>
    </>
  );
}
