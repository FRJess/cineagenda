import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isoDateToUtc, WEEKDAY_DAY_MONTH } from "@/lib/releases/iso-date";
import type { CastMember, MovieDetails } from "@/lib/tmdb/movie-details";
import "./_FilmDetail.css";

const IMAGE_BASE = "https://image.tmdb.org/t/p";

function initials(name: string): string {
  const parts = name.split(/\s+/).slice(0, 2);

  return parts
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function CastItem({ member }: { readonly member: CastMember }) {
  return (
    <li>
      {member.profilePath ? (
        <Image src={`${IMAGE_BASE}/w185${member.profilePath}`} alt="" width={185} height={278} />
      ) : (
        <span aria-hidden="true">{initials(member.name)}</span>
      )}
      <strong>{member.name}</strong>
      {member.character && <small>{member.character}</small>}
    </li>
  );
}

// Blurred behind the whole page: the backdrop, or the poster when TMDB has no backdrop.
function Ambient({ film }: { readonly film: MovieDetails }) {
  const src = film.backdropPath
    ? { path: `${IMAGE_BASE}/w780${film.backdropPath}`, width: 780, height: 439 }
    : film.posterPath
      ? { path: `${IMAGE_BASE}/w342${film.posterPath}`, width: 342, height: 513 }
      : null;

  if (!src) {
    return null;
  }

  return (
    <div data-part="film-ambient" aria-hidden="true">
      <Image src={src.path} alt="" width={src.width} height={src.height} />
    </div>
  );
}

/**
 * Film page body: backdrop hero with title and byline, then a sheet with genres, trailer,
 * plot, facts and cast over a blurred copy of the backdrop.
 * @param props Film details.
 * @returns Main landmark.
 */
export function FilmDetail({ film }: { readonly film: MovieDetails }) {
  const t = useTranslations("Film");
  const tReleases = useTranslations("Releases");
  const format = useFormatter();
  const hasByline = film.directors.length > 0 || film.year !== null || !!film.runtime;

  return (
    <main data-part="film" data-backdrop={film.backdropPath ? "" : undefined}>
      <Ambient film={film} />
      <header data-part="film-hero">
        {film.backdropPath && (
          <Image
            src={`${IMAGE_BASE}/w1280${film.backdropPath}`}
            alt=""
            width={1280}
            height={720}
            priority
          />
        )}
        <nav aria-label={t("back")}>
          <Link href="/">{t("back")}</Link>
        </nav>
        <div data-part="film-hero-text">
          <p data-part="film-date">
            {t.rich("releaseDate", {
              date: format.dateTime(isoDateToUtc(film.releaseDateIt), WEEKDAY_DAY_MONTH),
              time: (chunks) => <time dateTime={film.releaseDateIt}>{chunks}</time>,
            })}
          </p>
          <h1 id="film-title">{film.title}</h1>
          {film.subtitle && <p data-part="film-subtitle">{film.subtitle}</p>}
          {hasByline && (
            <p data-part="film-byline">
              {film.directors.length > 0 && <span>{film.directors.join(", ")}</span>}
              {film.year !== null && <span>{film.year}</span>}
              {film.runtime ? (
                <span>
                  {t("runtimeShort", {
                    hours: Math.floor(film.runtime / 60),
                    minutes: film.runtime % 60,
                  })}
                </span>
              ) : null}
            </p>
          )}
          {film.releaseType === "limited" && (
            <p data-release="limited">
              {tReleases("limited")} {film.releaseNote && <span>{film.releaseNote}</span>}
            </p>
          )}
        </div>
      </header>
      <div data-part="film-body">
        {film.posterPath && (
          <Image src={`${IMAGE_BASE}/w500${film.posterPath}`} alt="" width={500} height={750} />
        )}
        <div data-part="film-sheet">
          {film.genres.length > 0 && (
            <ul aria-label={t("genres")} data-part="film-genres">
              {film.genres.map((genre) => (
                <li key={genre}>{genre}</li>
              ))}
            </ul>
          )}
          {film.trailerKey && (
            <details data-part="film-trailer">
              <summary>{t("watchTrailer")}</summary>
              <figure>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${film.trailerKey}`}
                  title={t("trailer")}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </figure>
            </details>
          )}
          <section aria-labelledby="film-plot" data-part="film-plot">
            <h2 id="film-plot">{t("overview")}</h2>
            <p>{film.overview || t("noOverview")}</p>
          </section>
          <dl data-part="film-facts">
            {film.countries.length > 0 && (
              <div>
                <dt>{t("country")}</dt>
                <dd>{film.countries.join(", ")}</dd>
              </div>
            )}
            {film.companies.length > 0 && (
              <div>
                <dt>{t("production")}</dt>
                <dd>{film.companies.join(", ")}</dd>
              </div>
            )}
            <div>
              <dt>{t("originalTitle")}</dt>
              <dd>{film.originalTitle}</dd>
            </div>
            {film.runtime ? (
              <div>
                <dt>{t("runtimeLabel")}</dt>
                <dd>{t("runtime", { minutes: film.runtime })}</dd>
              </div>
            ) : null}
          </dl>
          {film.cast.length > 0 && (
            <section aria-labelledby="film-cast" data-part="film-cast">
              <h2 id="film-cast">{t("cast")}</h2>
              <ul aria-label={t("cast")}>
                {film.cast.map((member) => (
                  <CastItem key={member.name} member={member} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
