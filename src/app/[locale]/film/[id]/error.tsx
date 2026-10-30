"use client";

import { useTranslations } from "next-intl";

/**
 * Error boundary for the film page, e.g. TMDB unreachable.
 * @param props Next error props; `retry` re-fetches and re-renders.
 * @returns Error state with a retry button.
 */
export default function FilmError({ retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("Error");

  return (
    <main>
      <h1>{t("title")}</h1>
      <button type="button" onClick={retry}>
        {t("retry")}
      </button>
    </main>
  );
}
