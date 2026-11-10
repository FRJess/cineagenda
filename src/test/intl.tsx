import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import it from "../../messages/it.json";

const MESSAGES = { it, en, fr } as const;

/**
 * Test-only render inside next-intl with real messages and the Rome time zone.
 * @param ui Element to render.
 * @param locale UI locale.
 * @returns Testing Library render result.
 */
export function renderWithIntl(ui: ReactElement, locale: "it" | "en" | "fr" = "it") {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Europe/Rome">
      {ui}
    </NextIntlClientProvider>,
  );
}
