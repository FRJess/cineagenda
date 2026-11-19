import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CountryPicker } from "@/components/CountryPicker";
import { FilmDetail } from "@/components/FilmDetail";
import { Loader } from "@/components/Loader";
import { SiteHeader } from "@/components/SiteHeader";
import { routing } from "@/i18n/routing";
import {
  type Country,
  countryQuery,
  defaultCountry,
  parseCountry,
  visitorCountry,
} from "@/lib/country";
import { todayInRome } from "@/lib/releases/window";
import { pageMetadata } from "@/lib/seo";
import { getMovieDetails } from "@/lib/tmdb/cached";
import type { MovieDetails } from "@/lib/tmdb/movie-details";
import type { UiLocale } from "@/lib/tmdb/to-movie";

/**
 * Film pages block on their id: the title (metadata) and the 404 status both need the film,
 * so there is no useful static shell. Data is still cached per id by `getMovieDetails`.
 */
export const instant = false;

const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

type Params = PageProps<"/[locale]/film/[id]">["params"];
type SearchParams = PageProps<"/[locale]/film/[id]">["searchParams"];

const parseId = (value: string): number | null => (/^\d{1,9}$/.test(value) ? Number(value) : null);

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

async function loadFilm(params: Params, searchParams: SearchParams) {
  const { locale, id } = await params;
  const movieId = parseId(id);

  if (!hasLocale(routing.locales, locale) || movieId === null) {
    return null;
  }

  const country =
    parseCountry(first((await searchParams).country)) ??
    defaultCountry(locale, visitorCountry(await headers()));

  return { locale, country, film: await getMovieDetails(movieId, locale, country) };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const loaded = await loadFilm(params, searchParams);

  const uiLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  if (loaded?.film) {
    const { film, country } = loaded;
    const site = await getTranslations({ locale: uiLocale, namespace: "Metadata" });

    return pageMetadata({
      locale: loaded.locale,
      path: `/film/${film.id}`,
      query: countryQuery(country),
      title: `${film.title} | Cineagenda`,
      description: film.overview || site("description"),
      image: film.backdropPath
        ? { url: `${BACKDROP_BASE}${film.backdropPath}`, width: 1280, height: 720 }
        : undefined,
      index: false,
    });
  }

  const t = await getTranslations({ locale: uiLocale, namespace: "NotFound" });

  return { title: t("filmDocumentTitle") };
}

async function Film({ film, country }: { readonly film: MovieDetails; readonly country: Country }) {
  // The clock is request data: without this Next flags `new Date()` as unstable at prerender.
  await connection();

  return <FilmDetail film={film} today={todayInRome(new Date())} country={country} />;
}

/**
 * Film detail page. The film is loaded before any Suspense boundary: once streaming starts the
 * status is committed to 200, so `notFound()` must run first to answer a real 404.
 */
export default async function FilmPage({ params, searchParams }: PageProps<"/[locale]/film/[id]">) {
  const loaded = await loadFilm(params, searchParams);

  if (!loaded?.film) {
    notFound();
  }

  setRequestLocale(loaded.locale as UiLocale);

  return (
    <>
      <SiteHeader
        country={
          // The film may not be out in the other country, so switching goes to that country's list.
          <CountryPicker country={loaded.country} pathname="/" />
        }
      />
      <Suspense
        fallback={
          <main aria-busy="true">
            <Loader />
          </main>
        }
      >
        <Film film={loaded.film} country={loaded.country} />
      </Suspense>
    </>
  );
}
