import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Shown for unknown ids and films without an Italian cinema release.
 * @returns Not-found state with a link back to the list.
 */
export default function FilmNotFound() {
  const t = useTranslations("Film");

  return (
    <main>
      <h1>{t("notFound")}</h1>
      <Link href="/">{t("back")}</Link>
    </main>
  );
}
