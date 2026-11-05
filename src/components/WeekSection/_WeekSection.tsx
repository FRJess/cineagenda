import { useFormatter, useTranslations } from "next-intl";
import { FeaturedCard } from "@/components/FeaturedCard";
import { MovieCard } from "@/components/MovieCard";
import { pickFeatured } from "@/lib/releases/featured";
import type { WeekGroup } from "@/lib/releases/group-by-week";
import { DAY_MONTH, isoDateToUtc } from "@/lib/releases/iso-date";
import { addDays } from "@/lib/releases/window";
import "./_WeekSection.css";

/**
 * One release week: labeled heading with the date range and the film count, the featured
 * film when this is the current week, then the other films as a poster grid.
 * @param props Week group and the Monday of the current week.
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
  const isCurrent = group.weekStart === todayMonday;
  const isNext = group.weekStart === addDays(todayMonday, 7);
  const label = isCurrent ? t("thisWeek") : isNext ? t("nextWeek") : t("week");
  const featured = isCurrent ? pickFeatured(group.movies) : null;
  const others = featured ? group.movies.filter((movie) => movie.id !== featured.id) : group.movies;

  return (
    <section
      aria-labelledby={headingId}
      data-part="week-section"
      data-current={isCurrent ? "" : undefined}
    >
      <header>
        <h2 id={headingId}>
          <small>{label}</small> {range}
        </h2>
        {group.movies.length > 0 && <p>{t("filmCount", { count: group.movies.length })}</p>}
      </header>
      {group.movies.length === 0 && <p>{t("emptyWeek")}</p>}
      {featured && <FeaturedCard movie={featured} />}
      {others.length > 0 && (
        <ol>
          {others.map((movie) => (
            <li key={movie.id}>
              <MovieCard movie={movie} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
