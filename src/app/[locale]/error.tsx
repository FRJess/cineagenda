"use client";

import { useTranslations } from "next-intl";
import { ServicePage } from "@/components/ServicePage";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";

export default function ReleasesError({ retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("Error");
  const tNotFound = useTranslations("NotFound");

  return (
    <>
      <SiteHeader />
      <ServicePage
        code="!"
        eyebrow={t("eyebrow")}
        title={t("title")}
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
