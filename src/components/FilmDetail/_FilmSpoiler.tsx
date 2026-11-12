"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

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
 * Plot behind a spoiler veil: a disclosure button showing a blurred copy with "Mostra la trama"
 * until clicked, then a "Nascondi la trama" control that veils the text again. Every visit
 * starts veiled.
 * @param props Plot text and the playful hint line picked on the server.
 * @returns Disclosure button and the plot it controls.
 */
export function FilmSpoiler({
  overview,
  hint,
}: {
  readonly overview: string;
  readonly hint: string;
}) {
  const t = useTranslations("Film");
  const plotId = useId();
  const [open, setOpen] = useState(false);

  // With cacheComponents Next keeps a visited page mounted but hidden (React Activity), so an
  // opened plot would still be open on return. Hiding runs this cleanup.
  useEffect(() => () => setOpen(false), []);

  return (
    <div data-part="spoiler">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={plotId}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <span data-part="spoiler-hide">
            <EyeOffIcon />
            <span>
              {t.rich("hidePlot", {
                sr: (chunks) => <span data-part="sr-only">{chunks}</span>,
              })}
            </span>
          </span>
        ) : (
          <>
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
          </>
        )}
      </button>
      <p id={plotId} hidden={!open}>
        {overview}
      </p>
    </div>
  );
}
