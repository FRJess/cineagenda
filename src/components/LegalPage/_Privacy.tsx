import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { external, LegalPage, TEXT_TAGS } from "./_LegalPage";

/** Day the text last changed; the visible date is written out in the messages. */
const UPDATED = "2026-11-16";

const POLICIES = {
  vercel: "https://vercel.com/legal/privacy-policy",
  tmdbp: "https://www.themoviedb.org/privacy-policy",
  google: "https://policies.google.com/privacy",
} as const;

const TAGS = {
  ...TEXT_TAGS,
  code: (chunks: ReactNode) => <code>{chunks}</code>,
};

/**
 * Privacy page: who is responsible, what is processed on a visit, what is stored on the device,
 * the legal basis and the visitor's rights. The text states only what the code does.
 * @returns Main landmark.
 */
export function Privacy() {
  const t = useTranslations("Privacy");

  return (
    <LegalPage
      title={t("title")}
      updated={t.rich("updated", {
        time: (chunks: ReactNode) => <time dateTime={UPDATED}>{chunks}</time>,
      })}
      lead={t("lead")}
    >
      <section aria-labelledby="privacy-controller">
        <h2 id="privacy-controller">{t("controllerTitle")}</h2>
        <p>{t.rich("controller", TAGS)}</p>
      </section>
      <section aria-labelledby="privacy-visit">
        <h2 id="privacy-visit">{t("visitTitle")}</h2>
        <ul>
          <li>{t.rich("hosting", { ...TAGS, vercel: external(POLICIES.vercel) })}</li>
          <li>{t.rich("images", { ...TAGS, tmdbp: external(POLICIES.tmdbp) })}</li>
          <li>{t.rich("trailers", { ...TAGS, google: external(POLICIES.google) })}</li>
          <li>{t.rich("email", TAGS)}</li>
        </ul>
      </section>
      <section aria-labelledby="privacy-device">
        <h2 id="privacy-device">{t("deviceTitle")}</h2>
        <ul>
          <li>{t.rich("country", TAGS)}</li>
          <li>{t.rich("theme", TAGS)}</li>
        </ul>
        <p>{t("deviceNote")}</p>
      </section>
      <section aria-labelledby="privacy-basis">
        <h2 id="privacy-basis">{t("basisTitle")}</h2>
        <p>{t("basis")}</p>
      </section>
      <section aria-labelledby="privacy-rights">
        <h2 id="privacy-rights">{t("rightsTitle")}</h2>
        <p>{t("rights")}</p>
      </section>
    </LegalPage>
  );
}
