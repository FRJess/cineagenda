import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isoDateToUtc, WEEKDAY_DAY_MONTH } from "@/lib/releases/iso-date";
import type { Movie } from "@/lib/releases/movie";
import "./_MovieCard.css";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

/**
 * One release in the poster grid: the poster with date and title printed over its bottom
 * edge, linking to the film page.
 * @param props Movie to show.
 * @returns Article with one link.
 */
export function MovieCard({ movie }: { readonly movie: Movie }) {
  const t = useTranslations("Releases");
  const format = useFormatter();

  return (
    <article data-part="movie-card">
      <Link href={`/film/${movie.id}`}>
        <div data-part="poster">
          {movie.posterPath ? (
            <Image src={POSTER_BASE + movie.posterPath} alt="" width={342} height={513} />
          ) : (
            <figure data-part="poster-placeholder">
              <figcaption>{t("noPoster")}</figcaption>
            </figure>
          )}
          {movie.releaseType === "limited" && <span data-release="limited">{t("limited")}</span>}
          <div data-part="card-text">
            <p data-part="card-meta">
              <time dateTime={movie.releaseDateIt}>
                {format.dateTime(isoDateToUtc(movie.releaseDateIt), WEEKDAY_DAY_MONTH)}
              </time>
            </p>
            <h3>{movie.title}</h3>
          </div>
        </div>
      </Link>
    </article>
  );
}
