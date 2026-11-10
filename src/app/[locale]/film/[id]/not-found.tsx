import { useTranslations } from "next-intl";
import { FilmState } from "@/components/FilmDetail";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * Shown for unknown ids and films without an Italian cinema release.
 * @returns Not-found state in the film page shell, with a link back to the list.
 */
export default function FilmNotFound() {
  const t = useTranslations("Film");

  return (
    <>
      <SiteHeader />
      <FilmState title={t("notFound")} />
    </>
  );
}
