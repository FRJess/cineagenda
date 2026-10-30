const CALENDAR_URL = "https://www.comingsoon.it/cinema/calendariouscite/";
const DAY_MS = 86_400_000;

/**
 * ComingSoon release calendar for a week; their page takes a day offset from today
 * (`?r=-7` is last week). Used as a manual cross-check link, never fetched.
 * @param weekStart Monday of the week to show.
 * @param todayMonday Monday of the current week.
 * @returns Absolute URL.
 */
export function comingSoonUrl(weekStart: string, todayMonday: string): string {
  const offset = Math.round(
    (new Date(`${weekStart}T00:00:00Z`).getTime() -
      new Date(`${todayMonday}T00:00:00Z`).getTime()) /
      DAY_MS,
  );

  return `${CALENDAR_URL}?r=${offset}`;
}
