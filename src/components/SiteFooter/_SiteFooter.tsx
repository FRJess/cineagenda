import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer data-part="site-footer">
      <nav aria-label={t("links")} data-part="footer-links">
        <ul>
          <li>
            <Link href="/about">{t("about")}</Link>
          </li>
          <li>
            <Link href="/privacy">{t("privacy")}</Link>
          </li>
        </ul>
      </nav>
      <div data-part="footer-controls">
        <LocaleSwitch />
        <ThemeToggle />
      </div>
      <p data-part="footer-small">
        {t.rich("small", {
          tmdb: (chunks: ReactNode) => (
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
              {chunks}
            </a>
          ),
        })}
      </p>
    </footer>
  );
}
