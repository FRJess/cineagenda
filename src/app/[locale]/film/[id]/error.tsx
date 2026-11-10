"use client";

import { useTranslations } from "next-intl";
import { FilmState } from "@/components/FilmDetail";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * Error boundary for the film page, e.g. TMDB unreachable.
 * @param props Next error props; `retry` re-fetches and re-renders.
 * @returns Error state in the film page shell, with a retry button.
 */
export default function FilmError({ retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("Error");

  return (
    <>
      <SiteHeader />
      <FilmState title={t("title")}>
        <button type="button" onClick={retry}>
          {t("retry")}
        </button>
      </FilmState>
    </>
  );
}
