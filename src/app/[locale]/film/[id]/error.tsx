"use client";

import { useTranslations } from "next-intl";
import { ServicePage } from "@/components/ServicePage";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";

/**
 * Error boundary for the film page, e.g. TMDB unreachable.
 * @param props Next error props; `retry` re-fetches and re-renders.
 * @returns Service page with a retry button and a link to the release list.
 */
export default function FilmError({ retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("Error");
  const tNotFound = useTranslations("NotFound");

  return (
    <>
      <SiteHeader />
      <ServicePage
        code="!"
        eyebrow={t("eyebrow")}
        title={t("filmTitle")}
        text={t("text")}
        primary={
          <button type="button" onClick={retry}>
            {t("retry")}
          </button>
        }
        secondary={<Link href="/">{tNotFound("home")}</Link>}
      />
    </>
  );
}
