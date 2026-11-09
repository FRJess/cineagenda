import { useFormatter, useTranslations } from "next-intl";
import { FeaturedCard } from "@/components/FeaturedCard";
import { MovieCard } from "@/components/MovieCard";
import { pickFeatured } from "@/lib/releases/featured";
import type { WeekGroup } from "@/lib/releases/group-by-week";
import { DAY_MONTH, isoDateToUtc } from "@/lib/releases/iso-date";
import { addDays } from "@/lib/releases/window";
import "./_WeekSection.css";

// On wide screens the featured card spans 3 of 5 columns, so 2 posters share the first row.
const EAGER_POSTERS = 2;

/**
 * One release week: labeled heading with the date range ("Nessuna uscita" beside it when the
 * week is empty), then a grid that opens with the week's featured film and holds the others.
 * @param props Week group, the Monday of the current week, and `eager` for the week shown
 * above the fold.
 * @returns Section labeled by its heading.
 */
export function WeekSection({
  group,
  todayMonday,
  eager = false,
}: {
  readonly group: WeekGroup;
  readonly todayMonday: string;
  readonly eager?: boolean;
}) {
  const t = useTranslations("Releases");
  const format = useFormatter();
  const headingId = `week-${group.weekStart}`;
  const range = format.dateTimeRange(
    isoDateToUtc(group.weekStart),
    isoDateToUtc(group.weekEnd),
    DAY_MONTH,
  );
  const isCurrent = group.weekStart === todayMonday;
  const isNext = group.weekStart === addDays(todayMonday, 7);
  const label = isCurrent ? t("thisWeek") : isNext ? t("nextWeek") : t("week");
  const featured = pickFeatured(group.movies);
  const others = featured ? group.movies.filter((movie) => movie.id !== featured.id) : group.movies;

  return (
    <section
      aria-labelledby={headingId}
      data-part="week-section"
      data-today={isCurrent ? "" : undefined}
    >
      <header>
        <h2 id={headingId}>
          <small>{label}</small> {range}
        </h2>
        {group.movies.length === 0 && <p>{t("noReleases")}</p>}
      </header>
      {group.movies.length > 0 && (
        <ol>
          {featured && (
            <li key={featured.id} data-featured="">
              <FeaturedCard movie={featured} />
            </li>
          )}
          {others.map((movie, index) => (
            <li key={movie.id}>
              <MovieCard movie={movie} eager={eager && index < EAGER_POSTERS} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
