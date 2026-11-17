import { useLocale, useTranslations } from "next-intl";
import { FeaturedCard } from "@/components/FeaturedCard";
import { MovieCard } from "@/components/MovieCard";
import type { Country } from "@/lib/country";
import { pickFeatured } from "@/lib/releases/featured";
import type { WeekGroup } from "@/lib/releases/group-by-week";
import { formatDateRange } from "@/lib/releases/date-range";
import { addDays } from "@/lib/releases/window";
import "./_WeekSection.css";

// On wide screens the featured card spans 3 of 5 columns, so 2 posters share the first row.
const EAGER_POSTERS = 2;

export function WeekSection({
  group,
  todayMonday,
  today,
  eager = false,
  country,
}: {
  readonly group: WeekGroup;
  readonly todayMonday: string;
  readonly today: string;
  readonly eager?: boolean;
  readonly country: Country;
}) {
  const t = useTranslations("Releases");
  const locale = useLocale();
  const headingId = `week-${group.weekStart}`;
  const dates = formatDateRange(locale, group.weekStart, group.weekEnd, {
    month: "long",
    year: "auto",
    currentYear: today.slice(0, 4),
  });
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
          <small>{label}</small> {dates}
        </h2>
        {group.movies.length === 0 && <p>{t("noReleases")}</p>}
      </header>
      {group.movies.length > 0 && (
        <ol>
          {featured && (
            <li key={featured.id} data-featured="">
              <FeaturedCard movie={featured} country={country} />
            </li>
          )}
          {others.map((movie, index) => (
            <li key={movie.id}>
              <MovieCard movie={movie} eager={eager && index < EAGER_POSTERS} country={country} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
