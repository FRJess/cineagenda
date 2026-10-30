import { useFormatter, useTranslations } from "next-intl";
import { MovieCard } from "@/components/MovieCard";
import type { WeekGroup } from "@/lib/releases/group-by-week";
import { DAY_MONTH, isoDateToUtc } from "@/lib/releases/iso-date";
import "./_WeekSection.css";

/**
 * One release week: heading with the date range, then its films.
 * @param props Week group.
 * @returns Section labeled by its heading.
 */
export function WeekSection({ group }: { readonly group: WeekGroup }) {
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
      <h2 id={headingId}>{t("week", { range })}</h2>
      <ol>
        {group.movies.map((movie) => (
          <li key={movie.id}>
            <MovieCard movie={movie} />
          </li>
        ))}
      </ol>
    </section>
  );
}
