import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatCardDate } from "@/lib/releases/card-date";
import type { Movie } from "@/lib/releases/movie";
import "./_MovieCard.css";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

/**
 * One release in the poster grid: the whole poster, then a band painted with a blurred copy
 * of it that carries the title and the date. Nothing covers the poster.
 * @param props Movie to show; `eager` loads the poster at once when it sits above the fold.
 * @returns Article with one link.
 */
export function MovieCard({
  movie,
  eager = false,
}: {
  readonly movie: Movie;
  readonly eager?: boolean;
}) {
  const t = useTranslations("Releases");
  const format = useFormatter();
  const poster = movie.posterPath ? POSTER_BASE + movie.posterPath : null;

  return (
    <article data-part="movie-card">
      <Link href={`/film/${movie.id}`}>
        {poster ? (
          <Image
            src={poster}
            alt=""
            width={342}
            height={513}
            loading={eager ? "eager" : "lazy"}
          />
        ) : (
          <figure data-part="poster-placeholder">
            <figcaption>{t("noPoster")}</figcaption>
          </figure>
        )}
        <div data-part="card-text">
          {poster && (
            <Image
              src={poster}
              alt=""
              aria-hidden="true"
              width={342}
              height={513}
              data-part="card-blur"
            />
          )}
          <h3>{movie.title}</h3>
          <p>
            <time dateTime={movie.releaseDateIt}>
              {formatCardDate(format, movie.releaseDateIt)}
            </time>
            {movie.releaseType === "limited" && (
              <span data-release="limited">{t("limitedShort")}</span>
            )}
          </p>
        </div>
      </Link>
    </article>
  );
}
