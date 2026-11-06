"use client";

import { DayPicker, type Matcher } from "@daypicker/react";
import { enGB, it } from "@daypicker/react/locale";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { isoDateToUtc } from "@/lib/releases/iso-date";
import { addDays, MAX_RANGE_DAYS, MIN_DATE, todayInRome } from "@/lib/releases/window";

type Field = "from" | "to";

const FIELDS = ["from", "to"] as const satisfies readonly Field[];
const NUMERIC_DATE = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
} as const;
const WIDE = "(min-width: 48rem)";

const subscribeNever = () => () => undefined;
const isClient = () => true;
const isServer = () => false;

const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
};
const isWide = () => window.matchMedia(WIDE).matches;

/**
 * Dal / Al fields and the range calendar of the date form. Before hydration (and without JS)
 * the fields are native date inputs. After it a day click moves the nearer end: before the
 * start it moves the start, after the end the end, inside the range whichever end is closer
 * (the start on a tie). A click on Dal forces the next click to set the start and the one
 * after it the end; a click on Al forces the end. The calendar shows two months from 48rem,
 * one below. Hidden inputs carry the values, so the form stays a plain GET form; an empty end is
 * not submitted, which lets `parseRange` default to two weeks.
 * @param props The normalized range from the URL, as ISO dates.
 * @returns The date fields and the calendar.
 */
export function RangeFields({ from, to }: { readonly from: string; readonly to: string }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const format = useFormatter();
  const hydrated = useSyncExternalStore(subscribeNever, isClient, isServer);
  const wide = useSyncExternalStore(subscribeWide, isWide, isServer);
  const [range, setRange] = useState<Record<Field, string>>({ from, to });
  // null: the click picks the nearer end; a field forces it.
  const [active, setActive] = useState<Field | null>(null);

  if (!hydrated) {
    return (
      <div data-part="date-fields">
        {FIELDS.map((field) => (
          <p key={field}>
            <label htmlFor={`range-${field}`}>{t(field)}</label>
            <input
              id={`range-${field}`}
              type="date"
              name={field}
              min={MIN_DATE}
              defaultValue={range[field]}
              required={field === "from"}
            />
          </p>
        ))}
      </div>
    );
  }

  const nearerEnd = (iso: string): Field => {
    if (!range.to) {
      return "to";
    }

    if (iso < range.from || iso > range.to) {
      return iso < range.from ? "from" : "to";
    }

    const fromStart = isoDateToUtc(iso).getTime() - isoDateToUtc(range.from).getTime();
    const toEnd = isoDateToUtc(range.to).getTime() - isoDateToUtc(iso).getTime();

    return fromStart <= toEnd ? "from" : "to";
  };

  // DayPicker returns midnight in Rome; toISOString() would give the day before.
  const pick = (day: Date) => {
    const iso = todayInRome(day);

    if ((active ?? nearerEnd(iso)) === "from") {
      setRange(({ to: end }) => ({ from: iso, to: end && iso > end ? "" : end }));
      setActive(active === "from" ? "to" : null);
    } else {
      setRange(({ from: start }) =>
        iso < start ? { from: iso, to: start } : { from: start, to: iso },
      );
      setActive(null);
    }
  };

  const disabled: Matcher[] = [{ before: isoDateToUtc(MIN_DATE) }];

  if (active === "to") {
    disabled.push({ after: isoDateToUtc(addDays(range.from, MAX_RANGE_DAYS - 1)) });
  }

  return (
    <>
      <div data-part="date-fields">
        {FIELDS.map((field) => (
          <p key={field}>
            <span id={`range-${field}-label`}>{t(field)}</span>
            <button
              id={`range-${field}`}
              type="button"
              aria-labelledby={`range-${field}-label range-${field}`}
              aria-pressed={active === field}
              onClick={() => setActive((current) => (current === field ? null : field))}
            >
              {range[field] ? format.dateTime(isoDateToUtc(range[field]), NUMERIC_DATE) : "—"}
            </button>
            <input type="hidden" name={field} value={range[field]} disabled={!range[field]} />
          </p>
        ))}
      </div>
      <div data-part="calendar">
        <DayPicker
          mode="range"
          selected={{
            from: isoDateToUtc(range.from),
            to: range.to ? isoDateToUtc(range.to) : undefined,
          }}
          onSelect={(_, day) => pick(day)}
          locale={locale === "en" ? enGB : it}
          timeZone="Europe/Rome"
          weekStartsOn={1}
          defaultMonth={isoDateToUtc(range.from)}
          startMonth={isoDateToUtc(MIN_DATE)}
          disabled={disabled}
          numberOfMonths={wide ? 2 : 1}
          captionLayout="label"
          navLayout="around"
          formatters={{
            formatWeekdayName: (weekday, _options, dateLib) =>
              dateLib ? dateLib.format(weekday, "ccccc") : "",
          }}
          modifiers={{ thursday: { dayOfWeek: [4] } }}
          modifiersClassNames={{ thursday: "rdp-day_thursday" }}
          aria-label={t("calendar")}
        />
      </div>
    </>
  );
}
