"use client";

import { DayPicker, type DateRange } from "@daypicker/react";
import { enGB, fr, it } from "@daypicker/react/locale";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { DAY_MONTH_SHORT_YEAR, isoDateToUtc } from "@/lib/releases/iso-date";
import { clampWeeks, extendWeeks, type WeekRange } from "@/lib/releases/week-range";
import { MAX_WEEKS, MIN_DATE, todayInRome, weeksBetween } from "@/lib/releases/window";

const LOCALES = { it, en: enGB, fr } as const;

const subscribeNever = () => () => undefined;
const isClient = () => true;
const isServer = () => false;

type Props = {
  readonly from: string; // YYYY-MM-DD, normalized range from the URL (Monday to Sunday)
  readonly to: string;
  readonly releaseDay: number; // usual release weekday of the country, 0 = Sunday
  readonly children?: ReactNode; // shortcut links, rendered between the calendar and the footer
};

/**
 * Week picker: the only date control of the GET form. Every calendar row is a week; a click
 * selects or extends whole weeks. The calendar renders after hydration; the hidden from/to
 * inputs and the footer submit work without JS.
 * @param props The URL range, the country's release weekday and the shortcut list.
 * @returns Hidden inputs, calendar, shortcuts and footer.
 */
export function WeekPicker({ from, to, releaseDay, children }: Props) {
  const locale = useLocale() as keyof typeof LOCALES;
  const t = useTranslations("Nav");
  const format = useFormatter();
  const hydrated = useSyncExternalStore(subscribeNever, isClient, isServer);
  const [range, setRange] = useState<WeekRange>({ from, to });
  // Bumped on every opening, to remount DayPicker on the month of the URL range.
  const [openings, setOpenings] = useState(0);
  const fromInput = useRef<HTMLInputElement>(null);

  // A chip to the range already in the URL does not navigate, so the key in WeekRangeForm does
  // not change: reset on every opening instead, dropping any selection that was not sent.
  useEffect(() => {
    const details = fromInput.current?.closest("details");
    const onToggle = () => {
      if (details?.open) {
        setRange({ from, to });
        setOpenings((count) => count + 1);
      }
    };

    details?.addEventListener("toggle", onToggle);

    return () => details?.removeEventListener("toggle", onToggle);
  }, [from, to]);

  const handleDayClick = (day: Date) => {
    const iso = todayInRome(day);

    setRange(clampWeeks(extendWeeks(range, iso), MAX_WEEKS, iso));
  };

  const weeks = weeksBetween(range).length;
  const atMax = weeks >= MAX_WEEKS;
  const selected: DateRange = { from: isoDateToUtc(range.from), to: isoDateToUtc(range.to) };

  return (
    <>
      <input ref={fromInput} type="hidden" name="from" value={range.from} />
      <input type="hidden" name="to" value={range.to} />
      {hydrated && (
        <DayPicker
          key={openings}
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
          numberOfMonths={2}
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
            {format.dateTimeRange(
              isoDateToUtc(range.from),
              isoDateToUtc(range.to),
              DAY_MONTH_SHORT_YEAR,
            )}
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
