"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import "./_LocaleSwitch.css";

/** Links to the current page in every locale; the active one carries aria-current. */
export function LocaleSwitch() {
  const t = useTranslations("Header");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("language")} data-part="locale-switch">
      <ul>
        {routing.locales.map((locale) => (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              lang={locale}
              aria-current={locale === current ? "page" : undefined}
            >
              {t(locale)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
