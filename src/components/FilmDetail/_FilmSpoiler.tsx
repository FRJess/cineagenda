"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

/** Eye icon for the reveal pill; decorative, the label carries the meaning. */
function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

/** Crossed-eye icon for the hide control; decorative. */
function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M6.6 3.2A6.9 6.9 0 0 1 8 3c4.5 0 7 5 7 5a12 12 0 0 1-1.7 2.3M4.2 4.4A12 12 0 0 0 1 8s2.5 5 7 5a6.8 6.8 0 0 0 3.4-.9" />
      <path d="M2 2l12 12" />
    </svg>
  );
}

/**
 * Plot behind a spoiler veil: a blurred copy with "Mostra la trama" until clicked, then the real
 * text with a "Nascondi" control that veils it again. Every visit starts veiled.
 * @param props Plot text and the playful hint line picked on the server.
 * @returns Details element.
 */
export function FilmSpoiler({
  overview,
  hint,
}: {
  readonly overview: string;
  readonly hint: string;
}) {
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
          <b>
            <EyeIcon />
            {t("showPlot")}
          </b>
          <small>{hint}</small>
        </span>
        <span data-part="spoiler-hide">
          <EyeOffIcon />
          {t("hidePlot")}
        </span>
      </summary>
      <p>{overview}</p>
    </details>
  );
}
