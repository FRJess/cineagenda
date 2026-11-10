import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { daysFromToday } from "@/lib/releases/days-from-today";
import { isoDateToUtc, WEEKDAY_DAY_MONTH } from "@/lib/releases/iso-date";
import type { ReleaseWindow } from "@/lib/releases/window";
import type { CastMember, MovieDetails } from "@/lib/tmdb/movie-details";
import { FilmTrailer } from "./_FilmTrailer";
import "./_FilmDetail.css";

const IMAGE_BASE = "https://image.tmdb.org/t/p";
const RELATIVE_MAX_DAYS = 14;

function initials(name: string): string {
  const parts = name.split(/\s+/).slice(0, 2);

  return parts
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

/** Capitalized name in the UI locale; empty for codes it cannot name, like TMDB's "xx". */
function displayName(code: string, type: "language" | "region", locale: string): string {
  const name = code ? new Intl.DisplayNames([locale], { type, fallback: "none" }).of(code) : "";

  return name ? name.charAt(0).toLocaleUpperCase(locale) + name.slice(1) : "";
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
 * Film page body: backdrop hero with date, title and byline, then a single-column sheet with the
 * limited release note, genres, plot, facts, cast, trailer and the TMDB attribution; from 48rem
 * the poster sits beside the sheet.
 * @param props Film details, today's ISO date in Europe/Rome, and the list range the film was
 * opened from, kept on the back link.
 * @returns Main landmark.
 */
export function FilmDetail({
  film,
  today,
  range,
}: {
  readonly film: MovieDetails;
  readonly today: string;
  readonly range?: ReleaseWindow;
}) {
  const t = useTranslations("Film");
  const tReleases = useTranslations("Releases");
  const format = useFormatter();
  const locale = useLocale();
  const days = daysFromToday(film.releaseDateIt, today);
  const relative =
    days === 0
      ? t("fromToday")
      : days === -1
        ? t("fromYesterday")
        : Math.abs(days) <= RELATIVE_MAX_DAYS
          ? format.relativeTime(isoDateToUtc(film.releaseDateIt), {
              now: isoDateToUtc(today),
              unit: "day",
            })
          : null;
  const byline = [film.directors.join(", "), film.year === null ? "" : String(film.year)]
    .filter(Boolean)
    .join(" · ");
  const countries = film.countries
    .map((code) => displayName(code, "region", locale))
    .filter(Boolean)
    .join(", ");
  const facts = [
    [t("screenplay"), film.writers.join(", ")],
    [t("country", { count: film.countries.length }), countries],
    [t("originalLanguage"), displayName(film.originalLanguage, "language", locale)],
    [t("production"), film.companies.join(", ")],
    [t("runtimeLabel"), film.runtime ? t("runtime", { minutes: film.runtime }) : ""],
  ].filter(([, value]) => value);
  const backHref = range ? { pathname: "/", query: { from: range.from, to: range.to } } : "/";

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
          <Link href={backHref}>{t("back")}</Link>
        </nav>
        <div data-part="film-hero-text">
          <p data-part="film-date">
            {t.rich("releaseDate", {
              date: format.dateTime(isoDateToUtc(film.releaseDateIt), WEEKDAY_DAY_MONTH),
              time: (chunks) => <time dateTime={film.releaseDateIt}>{chunks}</time>,
            })}
            {relative && <span> · {relative}</span>}
          </p>
          <h1 id="film-title">{film.title}</h1>
          {film.subtitle && <p data-part="film-subtitle">{film.subtitle}</p>}
          {byline && <p data-part="film-byline">{byline}</p>}
        </div>
      </header>
      <div data-part="film-columns">
        {film.posterPath && (
          <Image
            data-part="film-poster"
            src={`${IMAGE_BASE}/w500${film.posterPath}`}
            alt=""
            width={500}
            height={750}
          />
        )}
        <div data-part="film-body">
          {film.releaseType === "limited" && (
            <p data-part="limited-note">
              <span data-release="limited">{tReleases("limited")}</span>
              {film.releaseNote && <span>{film.releaseNote}</span>}
            </p>
          )}
          {film.genres.length > 0 && (
            <ul aria-label={t("genres")} data-part="genres">
              {film.genres.map((genre) => (
                <li key={genre}>{genre}</li>
              ))}
            </ul>
          )}
          <section aria-labelledby="film-plot" data-part="film-plot">
            <h2 id="film-plot">{t("overview")}</h2>
            <p>{film.overview || t("noOverview")}</p>
          </section>
          {facts.length > 0 && (
            <dl data-part="facts">
              {facts.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
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
              <FilmTrailer trailerKey={film.trailerKey} />
            </section>
          )}
          <p data-part="film-source">
            {t("source")} ·{" "}
            <a
              href={`https://www.themoviedb.org/movie/${film.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("openTmdb")}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

/**
 * Page shell for the not-found and error states: an empty hero with the back link and a title,
 * and a sheet holding an optional action.
 * @param props Title of the state and an optional action, such as a retry button.
 * @returns Main landmark.
 */
export function FilmState({
  title,
  children,
}: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  const t = useTranslations("Film");

  return (
    <main data-part="film">
      <header data-part="film-hero">
        <nav aria-label={t("back")}>
          <Link href="/">{t("back")}</Link>
        </nav>
        <div data-part="film-hero-text">
          <h1>{title}</h1>
        </div>
      </header>
      {children && (
        <div data-part="film-columns">
          <div data-part="film-body">{children}</div>
        </div>
      )}
    </main>
  );
}

/**
 * Loading state of the film page: the hero without text and a sheet with three grey lines.
 * @returns Busy main landmark.
 */
export function FilmSkeleton() {
  return (
    <main data-part="film" aria-busy="true">
      <header data-part="film-hero" />
      <div data-part="film-columns">
        <div data-part="film-body">
          <span data-part="skeleton-line" />
          <span data-part="skeleton-line" />
          <span data-part="skeleton-line" />
        </div>
      </div>
    </main>
  );
}
