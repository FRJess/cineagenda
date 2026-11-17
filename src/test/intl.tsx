import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import it from "../../messages/it.json";

const MESSAGES = { it, en, fr } as const;

export function renderWithIntl(ui: ReactElement, locale: "it" | "en" | "fr" = "it") {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Europe/Rome">
      {ui}
    </NextIntlClientProvider>,
  );
}
