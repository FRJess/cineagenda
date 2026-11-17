import { monthRange } from "./shortcuts";
import {
  addDays,
  isValidIsoDate,
  MAX_RANGE_DAYS,
  maxDate,
  MIN_DATE,
  mondayOf,
  weeksBetween,
  type ReleaseWindow,
} from "./window";

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
const WEEKS = /^[1-9]$/;

export type PeriodHref = {
  readonly pathname: string;
  readonly query: { readonly weeks?: string };
};

/**
 * URL of a range of whole weeks: `/2026-11-09` for one week, `/2026-11-09` with `weeks=3` for
 * several, `/2026-12` when the weeks are exactly those of a calendar month.
 */
export function periodHref(range: ReleaseWindow): PeriodHref {
  // The first Sunday is always inside the month a month range stands for.
  const month = addDays(range.from, 6).slice(0, 7);
  const whole = monthRange(Number(month.slice(0, 4)), Number(month.slice(5, 7)));

  if (whole.from === range.from && whole.to === range.to) {
    return { pathname: `/${month}`, query: {} };
  }

  const weeks = weeksBetween(range).length;

  return { pathname: `/${range.from}`, query: weeks > 1 ? { weeks: String(weeks) } : {} };
}

export function parsePeriod(
  period: string,
  weeks: string | null,
  today: string,
): ReleaseWindow | null {
  const min = mondayOf(MIN_DATE);
  const max = maxDate(today);
  const month = MONTH.exec(period);

  if (month) {
    const range = monthRange(Number(month[1]), Number(month[2]));

    return range.from >= min && range.to <= max ? range : null;
  }

  const count = weeks === null ? 1 : WEEKS.test(weeks) ? Number(weeks) : 0;

  if (!isValidIsoDate(period) || period < min || period > max) {
    return null;
  }

  if (count === 0 || count * 7 > MAX_RANGE_DAYS) {
    return null;
  }

  const from = mondayOf(period);
  const to = addDays(from, count * 7 - 1);

  return { from, to: to > max ? max : to };
}
