import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { FilmDetail } from "@/components/FilmDetail";
import { SiteHeader } from "@/components/SiteHeader";
import { routing } from "@/i18n/routing";
import { getMovieDetails } from "@/lib/tmdb/cached";
import type { UiLocale } from "@/lib/tmdb/to-movie";

/**
 * Film pages block on their id: the title (metadata) and the 404 status both need the film,
 * so there is no useful static shell. Data is still cached per id by `getMovieDetails`.
 */
export const instant = false;

type Params = PageProps<"/[locale]/film/[id]">["params"];

const parseId = (value: string): number | null => (/^\d{1,9}$/.test(value) ? Number(value) : null);

async function loadFilm(params: Params) {
  const { locale, id } = await params;
  const movieId = parseId(id);

  if (!hasLocale(routing.locales, locale) || movieId === null) {
    return null;
  }

  return { locale, film: await getMovieDetails(movieId, locale) };
}

/**
 * Film title as the document title.
 * @param props Route props.
 * @returns Metadata.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const loaded = await loadFilm(params);

  return loaded?.film ? { title: `${loaded.film.title} | Cineagenda` } : {};
}

// Request-time: awaits params inside <Suspense> so the shell stays static.
async function Film({ params }: { readonly params: Params }) {
  const loaded = await loadFilm(params);

  if (!loaded?.film) {
    notFound();
  }

  setRequestLocale(loaded.locale as UiLocale);

  return <FilmDetail film={loaded.film} />;
}

/**
 * Film detail page.
 * @param props Route props.
 * @returns Film details, or the not-found page.
 */
export default function FilmPage({ params }: PageProps<"/[locale]/film/[id]">) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<main aria-busy="true" />}>
        <Film params={params} />
      </Suspense>
    </>
  );
}
