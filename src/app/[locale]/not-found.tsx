import { useTranslations } from "next-intl";
import { ServicePage } from "@/components/ServicePage";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <>
      <SiteHeader />
      <ServicePage
        code="404"
        eyebrow={t("eyebrow")}
        title={t("title")}
        text={t("text")}
        primary={<Link href="/">{t("home")}</Link>}
      />
    </>
  );
}
