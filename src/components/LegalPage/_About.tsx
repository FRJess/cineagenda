import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { external, LegalPage, TEXT_TAGS } from "./_LegalPage";

const TMDB_URL = "https://www.themoviedb.org";
const GITHUB_URL = "https://github.com/FRJess/cineagenda";

/**
 * About page: the credits, opened by the TMDB logo and notice that TMDB asks for, and the legal
 * notice.
 */
export function About() {
  const t = useTranslations("About");
  const locale = useLocale();

  return (
    <LegalPage title={t("title")} lead={t("lead")}>
      <section aria-labelledby="about-credits">
        <h2 id="about-credits">{t("credits")}</h2>
        <p data-part="legal-tmdb">
          <Image src="/tmdb-logo.svg" alt="TMDB" width={273} height={36} />
          {/* TMDB's notice stays in English in every locale. */}
          <span lang={locale === "en" ? undefined : "en"}>{t("notice")}</span>
        </p>
        <p>{t.rich("data", { tmdb: external(TMDB_URL) })}</p>
        <ul>
          <li>{t.rich("trailers", TEXT_TAGS)}</li>
          <li>{t.rich("typefaces", TEXT_TAGS)}</li>
          <li>{t.rich("code", { ...TEXT_TAGS, github: external(GITHUB_URL) })}</li>
        </ul>
      </section>
      <section aria-labelledby="about-legal">
        <h2 id="about-legal">{t("legal")}</h2>
        <h3>{t("whoTitle")}</h3>
        <p>{t.rich("who", TEXT_TAGS)}</p>
        <h3>{t("rightsTitle")}</h3>
        <p>{t("rights")}</p>
        <h3>{t("warrantyTitle")}</h3>
        <p>{t("warranty")}</p>
        <p>
          {t.rich("privacy", {
            privacy: (chunks: ReactNode) => <Link href="/privacy">{chunks}</Link>,
          })}
        </p>
      </section>
    </LegalPage>
  );
}
