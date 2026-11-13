import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Fragment } from "react";
import { Link } from "@/i18n/navigation";
import { type Country, countryQuery } from "@/lib/country";
import { daysFromToday } from "@/lib/releases/days-from-today";
import { parseReleaseNote } from "@/lib/releases/release-note";
import { isoDateToUtc, WEEKDAY_DAY_MONTH } from "@/lib/releases/iso-date";
import { periodHref } from "@/lib/releases/period";
import { weekOf } from "@/lib/releases/week-range";
import { maxDate } from "@/lib/releases/window";
import type { CastMember, MovieDetails } from "@/lib/tmdb/movie-details";
import { FilmSpoiler } from "./_FilmSpoiler";
import { randomSpoilerLine } from "./spoiler-line";
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

// TMDB writes role annotations in English; the voice one is said in the UI language.
const VOICE_ROLE = /\s*\(voice\)\s*$/i;

function CastItem({ member }: { readonly member: CastMember }) {
  const t = useTranslations("Film");
  const character = VOICE_ROLE.test(member.character)
    ? t("voiceRole", { character: member.character.replace(VOICE_ROLE, "") })
    : member.character;

  return (
    <li>
      {member.profilePath ? (
        <Image src={`${IMAGE_BASE}/w185${member.profilePath}`} alt="" width={185} height={278} />
      ) : (
        <span aria-hidden="true">{initials(member.name)}</span>
      )}
      <strong>{member.name}</strong>
      {character && <small>{character}</small>}
    </li>
  );
}

/**
 * Film page body: backdrop hero with date, title and byline, then a single-column sheet with the
 * limited release note, genres, plot behind a spoiler, details, cast and trailer; from 48rem the
 * poster sits beside the sheet. The TMDB attribution is in the site footer.
 * @param props Film details, today's ISO date in Europe/Rome and the country of the list; the
 * back link goes to the week the film comes out in.
 * @returns Main landmark.
 */
export function FilmDetail({
  film,
  today,
  country,
}: {
  readonly film: MovieDetails;
  readonly today: string;
  readonly country: Country;
}) {
  const t = useTranslations("Film");
  const tReleases = useTranslations("Releases");
  const format = useFormatter();
  const locale = useLocale();
  const days = daysFromToday(film.releaseDate, today);
  const relative =
    days === 0
      ? t("fromToday")
      : days === -1
        ? t("fromYesterday")
        : Math.abs(days) <= RELATIVE_MAX_DAYS
          ? format.relativeTime(isoDateToUtc(film.releaseDate), {
              now: isoDateToUtc(today),
              unit: "day",
            })
          : null;
  // The year only tells something for a re-release: a new film's year is the release year.
  const showYear = film.year !== null && String(film.year) !== film.releaseDate.slice(0, 4);
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
  const parsed = parseReleaseNote(film.releaseNote);
  const note = !parsed
    ? ""
    : parsed.kind === "anniversary"
      ? t("noteAnniversary", { years: parsed.years })
      : parsed.kind === "rerelease"
        ? t("noteRerelease", { format: parsed.format ?? "none" })
        : parsed.kind === "restoration"
          ? t("noteRestoration")
          : t("noteImax");
  // A release beyond the calendar has no week page to go back to.
  const back =
    film.releaseDate <= maxDate(today)
      ? periodHref(weekOf(film.releaseDate))
      : { pathname: "/", query: {} };
  const backHref = { pathname: back.pathname, query: { ...countryQuery(country), ...back.query } };

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
        <nav aria-label={t("backLabel")}>
          <Link href={backHref}>
            <span data-part="back-icon" aria-hidden="true" />
            {t("back")}
          </Link>
        </nav>
        <div data-part="film-hero-text">
          <p data-part="film-date">
            {t.rich("releaseDate", {
              date: format.dateTime(isoDateToUtc(film.releaseDate), WEEKDAY_DAY_MONTH),
              time: (chunks) => <time dateTime={film.releaseDate}>{chunks}</time>,
            })}
            {relative && <span> · {relative}</span>}
          </p>
          <h1 id="film-title">{film.title}</h1>
          {film.subtitle && <p data-part="film-subtitle">{film.subtitle}</p>}
          {film.directors.length > 0 && (
            <p data-part="film-director">
              <span>{t("directedBy")}</span>{" "}
              {film.directors.map((director, index) => (
                <Fragment key={director}>
                  {/* The separator stays with the name before it, so it never opens a line. */}
                  <span data-part="director">
                    <b>{director}</b>
                    {index < film.directors.length - 1 && <span data-part="director-sep"> /</span>}
                  </span>{" "}
                </Fragment>
              ))}
              {showYear && (
                <>
                  {" "}
                  <span data-part="film-year">· {film.year}</span>
                </>
              )}
            </p>
          )}
        </div>
      </header>
      <div data-part="film-columns">
        {film.posterPath && (
          <Image
            data-part="film-poster"
            src={`${IMAGE_BASE}/w780${film.posterPath}`}
            alt=""
            width={780}
            height={1170}
            sizes="18rem"
          />
        )}
        <div data-part="film-body">
          {film.releaseType === "limited" && (
            <p data-part="limited-note">
              <span data-release="limited">{tReleases("limited")}</span>
              {note && <span>{note}</span>}
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
            {film.overview ? (
              <FilmSpoiler
                overview={film.overview}
                hint={randomSpoilerLine(t.raw("spoilerLines"))}
              />
            ) : (
              <p data-empty="">{t("noOverview")}</p>
            )}
          </section>
          {facts.length > 0 && (
            <section aria-labelledby="film-facts" data-part="film-facts">
              <h2 id="film-facts">{t("details")}</h2>
              <dl data-part="facts">
                {facts.map(([term, value]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
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
        </div>
      </div>
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
