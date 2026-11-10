"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

/**
 * Plot behind a spoiler veil: a blurred copy with "Mostra la trama" until clicked, then the real
 * text with a "Nascondi la trama" pill that veils it again. Every visit starts veiled.
 * @param props Plot text.
 * @returns Details element.
 */
export function FilmSpoiler({ overview }: { readonly overview: string }) {
  const t = useTranslations("Film");
  const ref = useRef<HTMLDetailsElement>(null);

  // With cacheComponents Next keeps a visited page mounted but hidden (React Activity), so an
  // opened plot would still be open on return. Hiding runs this cleanup.
  useEffect(() => {
    const details = ref.current;

    return () => {
      if (details) {
        details.open = false;
      }
    };
  }, []);

  return (
    <details ref={ref} data-part="spoiler">
      <summary>
        <span data-part="spoiler-copy" aria-hidden="true">
          {overview}
        </span>
        <span data-part="spoiler-cta">
          <b>{t("showPlot")}</b>
          <small>{t("spoilerHint")}</small>
        </span>
        <span data-part="spoiler-hide">{t("hidePlot")}</span>
      </summary>
      <p>{overview}</p>
    </details>
  );
}
