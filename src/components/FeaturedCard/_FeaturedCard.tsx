import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isoDateToUtc, WEEKDAY_DAY_MONTH } from "@/lib/releases/iso-date";
import type { Movie } from "@/lib/releases/movie";
import "./_FeaturedCard.css";

const BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";

/**
 * The featured film of the current week: a wide backdrop with label, date and title printed
 * over its bottom edge, linking to the film page.
 * @param props Movie to show; the backdrop is omitted when TMDB has none.
 * @returns Article with one link.
 */
export function FeaturedCard({ movie }: { readonly movie: Movie }) {
  const t = useTranslations("Releases");
  const format = useFormatter();

  return (
    <article data-part="featured-card">
      <Link href={`/film/${movie.id}`}>
        <div data-part="backdrop">
          {movie.backdropPath && (
            <Image
              src={BACKDROP_BASE + movie.backdropPath}
              alt=""
              width={780}
              height={439}
              sizes="(min-width: 72rem) 72rem, 100vw"
              priority
            />
          )}
          <div data-part="card-text">
            <p data-part="card-eyebrow">{t("featured")}</p>
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
