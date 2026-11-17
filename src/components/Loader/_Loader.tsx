import { useTranslations } from "next-intl";
import "./_Loader.css";

export function Loader() {
  const t = useTranslations("Loader");

  return (
    <div role="status" data-part="loader">
      <span data-part="loader-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span data-part="sr-only">{t("label")}</span>
    </div>
  );
}
