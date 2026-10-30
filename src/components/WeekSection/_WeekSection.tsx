import { useFormatter, useTranslations } from "next-intl";
import { MovieCard } from "@/components/MovieCard";
import { comingSoonUrl } from "@/lib/comingsoon";
import type { WeekGroup } from "@/lib/releases/group-by-week";
import { DAY_MONTH, isoDateToUtc } from "@/lib/releases/iso-date";
import "./_WeekSection.css";

/**
 * One release week: heading with the date range, a ComingSoon cross-check link, then
 * its films as a poster grid.
 * @param props Week group and the Monday of the current week (for the ComingSoon offset).
 * @returns Section labeled by its heading.
 */
export function WeekSection({
  group,
  todayMonday,
}: {
  readonly group: WeekGroup;
  readonly todayMonday: string;
}) {
  const t = useTranslations("Releases");
  const format = useFormatter();
  const headingId = `week-${group.weekStart}`;
  const range = format.dateTimeRange(
    isoDateToUtc(group.weekStart),
    isoDateToUtc(group.weekEnd),
    DAY_MONTH,
  );

  return (
    <section aria-labelledby={headingId} data-part="week-section">
      <header>
        <h2 id={headingId}>{t("week", { range })}</h2>
        <a
          href={comingSoonUrl(group.weekStart, todayMonday)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("verify")}
        </a>
      </header>
      {group.movies.length === 0 ? (
        <p>{t("emptyWeek")}</p>
      ) : (
        <ol>
          {group.movies.map((movie) => (
            <li key={movie.id}>
              <MovieCard movie={movie} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
