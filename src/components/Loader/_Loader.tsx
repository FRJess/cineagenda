import { useTranslations } from "next-intl";
import "./_Loader.css";

/**
 * Loading state shared by every page: three film perforations, like those of the logo mark,
 * centered in the space the page leaves. They pulse in turn, and stay still under
 * `prefers-reduced-motion`. The text is for screen readers only.
 * @returns Status region.
 */
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
