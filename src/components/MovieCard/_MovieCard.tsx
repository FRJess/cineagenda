import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import type { Movie } from "@/lib/releases/movie";
import { DAY_MONTH, isoDateToUtc } from "@/lib/releases/iso-date";
import "./_MovieCard.css";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

/**
 * One release: poster, title, Italian date, genres, plot on demand.
 * @param props Movie to show.
 * @returns Article.
 */
export function MovieCard({ movie }: { readonly movie: Movie }) {
  const t = useTranslations("Releases");
  const format = useFormatter();

  return (
    <article data-part="movie-card">
      {movie.posterPath ? (
        <Image src={POSTER_BASE + movie.posterPath} alt="" width={342} height={513} />
      ) : (
        <figure data-part="poster-placeholder">
          <figcaption>{t("noPoster")}</figcaption>
        </figure>
      )}
      <div data-part="movie-body">
        <h3>{movie.title}</h3>
        <p>
          {t.rich("releaseDate", {
            date: format.dateTime(isoDateToUtc(movie.releaseDateIt), DAY_MONTH),
            time: (chunks) => <time dateTime={movie.releaseDateIt}>{chunks}</time>,
          })}
        </p>
        {movie.genres.length > 0 && (
          <ul aria-label={t("genres")}>
            {movie.genres.map((genre) => (
              <li key={genre}>{genre}</li>
            ))}
          </ul>
        )}
        <details>
          <summary>{t("overview")}</summary>
          <p>{movie.overview || t("noOverview")}</p>
        </details>
      </div>
    </article>
  );
}
