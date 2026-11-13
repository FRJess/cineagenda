import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Country } from "@/lib/country";
import { formatCardDate } from "@/lib/releases/card-date";
import { filmHref } from "@/lib/releases/film-href";
import type { Movie } from "@/lib/releases/movie";
import "./_FeaturedCard.css";

const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
const MAX_GENRES = 2;

/**
 * The featured film of the current week, first item of its grid: the backdrop under two veils,
 * with eyebrow, title and a date line (date, then up to two genres) at the bottom left.
 * @param props Movie to show, the backdrop omitted when TMDB has none.
 * @returns Article with one link.
 */
export function FeaturedCard({
  movie,
  country,
}: {
  readonly movie: Movie;
  readonly country: Country;
}) {
  const t = useTranslations("Releases");
  const format = useFormatter();
  const genres = movie.genres.slice(0, MAX_GENRES).join(", ");

  return (
    <article data-part="featured-card">
      <Link href={filmHref(movie.id, country)}>
        {movie.backdropPath && (
          <Image
            src={BACKDROP_BASE + movie.backdropPath}
            alt=""
            width={1280}
            height={720}
            sizes="(min-width: 72rem) 36rem, (min-width: 48rem) 60vw, 100vw"
            priority
          />
        )}
        <div data-part="card-text">
          <p data-part="card-eyebrow">{t("featured")}</p>
          <h3>{movie.title}</h3>
          <p data-part="card-meta">
            <time dateTime={movie.releaseDate}>{formatCardDate(format, movie.releaseDate)}</time>
            {genres && ` · ${genres}`}
          </p>
        </div>
      </Link>
    </article>
  );
}
