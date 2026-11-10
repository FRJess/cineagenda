import { useTranslations } from "next-intl";
import { ServicePage } from "@/components/ServicePage";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";

/**
 * Shown for unknown ids and films without an Italian cinema release.
 * @returns Service page with a link to the release list and a TMDB search.
 */
export default function FilmNotFound() {
  const t = useTranslations("NotFound");

  return (
    <>
      <SiteHeader />
      <ServicePage
        code="404"
        eyebrow={t("filmEyebrow")}
        title={t("filmTitle")}
        text={t("filmText")}
        primary={<Link href="/">{t("home")}</Link>}
        secondary={
          <a href="https://www.themoviedb.org/search" target="_blank" rel="noopener noreferrer">
            {t("searchTmdb")}
          </a>
        }
      />
    </>
  );
}
