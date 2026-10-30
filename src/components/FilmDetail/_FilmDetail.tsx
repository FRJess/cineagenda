import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DAY_MONTH_YEAR, isoDateToUtc } from "@/lib/releases/iso-date";
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

/**
 * Film page body: backdrop hero, poster, facts, plot, cast and trailer.
 * @param props Film details.
 * @returns Main landmark.
 */
export function FilmDetail({ film }: { readonly film: MovieDetails }) {
  const t = useTranslations("Film");
  const tReleases = useTranslations("Releases");
  const format = useFormatter();

  return (
    <main data-part="film" data-backdrop={film.backdropPath ? "" : undefined}>
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
      </header>
      <section data-part="film-summary" aria-labelledby="film-title">
        {film.posterPath && (
          <Image src={`${IMAGE_BASE}/w500${film.posterPath}`} alt="" width={500} height={750} />
        )}
        <div data-part="film-summary-text">
          <h1 id="film-title">{film.title}</h1>
          <p>
            {t.rich("releaseDate", {
              date: format.dateTime(isoDateToUtc(film.releaseDateIt), DAY_MONTH_YEAR),
              time: (chunks) => <time dateTime={film.releaseDateIt}>{chunks}</time>,
            })}
          </p>
          {film.releaseType === "limited" && (
            <p data-release="limited">
              {tReleases("limited")} {film.releaseNote && <span>{film.releaseNote}</span>}
            </p>
          )}
          <dl>
            {film.directors.length > 0 && (
              <div>
                <dt>{t("director")}</dt>
                <dd>{film.directors.join(", ")}</dd>
              </div>
            )}
            {film.genres.length > 0 && (
              <div>
                <dt>{t("genres")}</dt>
                <dd>{film.genres.join(", ")}</dd>
              </div>
            )}
            {film.runtime ? (
              <div>
                <dt>{t("runtimeLabel")}</dt>
                <dd>{t("runtime", { minutes: film.runtime })}</dd>
              </div>
            ) : null}
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
          </dl>
        </div>
      </section>
      <section aria-labelledby="film-plot" data-part="film-plot">
        <h2 id="film-plot">{t("overview")}</h2>
        <p>{film.overview || t("noOverview")}</p>
      </section>
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
      {film.trailerKey && (
        <section aria-labelledby="film-trailer" data-part="film-trailer">
          <h2 id="film-trailer">{t("trailer")}</h2>
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
        </section>
      )}
    </main>
  );
}
