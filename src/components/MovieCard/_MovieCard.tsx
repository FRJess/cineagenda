import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Movie } from "@/lib/releases/movie";
import { DAY_MONTH, isoDateToUtc } from "@/lib/releases/iso-date";
import "./_MovieCard.css";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

/**
 * One release in the poster grid: poster, title and Italian date, linking to the film page.
 * Limited releases carry a visible badge with the TMDB note.
 * @param props Movie to show.
 * @returns Article.
 */
export function MovieCard({ movie }: { readonly movie: Movie }) {
  const t = useTranslations("Releases");
  const format = useFormatter();

  return (
    <article data-part="movie-card">
      <Link href={`/film/${movie.id}`}>
        {movie.posterPath ? (
          <Image src={POSTER_BASE + movie.posterPath} alt="" width={342} height={513} />
        ) : (
          <figure data-part="poster-placeholder">
            <figcaption>{t("noPoster")}</figcaption>
          </figure>
        )}
        <h3>{movie.title}</h3>
        <p>
          <time dateTime={movie.releaseDateIt}>
            {format.dateTime(isoDateToUtc(movie.releaseDateIt), DAY_MONTH)}
          </time>
        </p>
      </Link>
      {movie.releaseType === "limited" && (
        <p data-release="limited">
          {t("limited")} {movie.releaseNote && <span>{movie.releaseNote}</span>}
        </p>
      )}
    </article>
  );
}
