import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { FilmDetail, FilmSkeleton } from "@/components/FilmDetail";
import { SiteHeader } from "@/components/SiteHeader";
import { routing } from "@/i18n/routing";
import { DEFAULT_COUNTRY, parseCountry } from "@/lib/country";
import { parseRange, todayInRome } from "@/lib/releases/window";
import { getMovieDetails } from "@/lib/tmdb/cached";
import type { MovieDetails } from "@/lib/tmdb/movie-details";
import type { UiLocale } from "@/lib/tmdb/to-movie";

/**
 * Film pages block on their id: the title (metadata) and the 404 status both need the film,
 * so there is no useful static shell. Data is still cached per id by `getMovieDetails`.
 */
export const instant = false;

type Params = PageProps<"/[locale]/film/[id]">["params"];
type SearchParams = PageProps<"/[locale]/film/[id]">["searchParams"];

const parseId = (value: string): number | null => (/^\d{1,9}$/.test(value) ? Number(value) : null);

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

async function loadFilm(params: Params, searchParams: SearchParams) {
  const { locale, id } = await params;
  const country = parseCountry(first((await searchParams).country)) ?? DEFAULT_COUNTRY;
  const movieId = parseId(id);

  if (!hasLocale(routing.locales, locale) || movieId === null) {
    return null;
  }

  return { locale, country, film: await getMovieDetails(movieId, locale, country) };
}

/**
 * Film title as the document title, or the not-found title.
 * @param props Route props.
 * @returns Metadata.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const loaded = await loadFilm(params, searchParams);

  if (loaded?.film) {
    return { title: `${loaded.film.title} | Cineagenda` };
  }

  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "NotFound",
  });

  return { title: t("filmDocumentTitle") };
}

// Request-time part: the list range and today's date. The film itself is loaded by the page.
async function Film({
  film,
  searchParams,
}: {
  readonly film: MovieDetails;
  readonly searchParams: SearchParams;
}) {
  const query = await searchParams;
  // The clock is request data: without this Next flags `new Date()` as unstable at prerender.
  await connection();
  const today = todayInRome(new Date());
  // The card passes the list range; without it the back link goes to the default list.
  const from = first(query.from);
  const range = from ? parseRange(from, first(query.to), today) : undefined;

  return <FilmDetail film={film} today={today} range={range} />;
}

/**
 * Film detail page. The film is loaded before any Suspense boundary: once streaming starts the
 * status is committed to 200, so `notFound()` must run first to answer a real 404.
 * @param props Route props.
 * @returns Film details, or the not-found page.
 */
export default async function FilmPage({ params, searchParams }: PageProps<"/[locale]/film/[id]">) {
  const loaded = await loadFilm(params, searchParams);

  if (!loaded?.film) {
    notFound();
  }

  setRequestLocale(loaded.locale as UiLocale);

  return (
    <>
      <SiteHeader />
      <Suspense fallback={<FilmSkeleton />}>
        <Film film={loaded.film} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
