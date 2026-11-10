"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

/**
 * Trailer disclosure: a play tile that mounts the YouTube player only once the user opens it,
 * so nothing loads or plays before the click; closing it removes the player.
 * @param props YouTube video key.
 * @returns Details element.
 */
export function FilmTrailer({ trailerKey }: { readonly trailerKey: string }) {
  const t = useTranslations("Film");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDetailsElement>(null);

  // With cacheComponents Next keeps a visited page mounted but hidden (React Activity), so a
  // playing iframe would keep its audio after the user leaves. Hiding runs this cleanup.
  useEffect(() => {
    const details = ref.current;

    return () => {
      if (details) {
        details.open = false;
      }

      setOpen(false);
    };
  }, []);

  return (
    <details ref={ref} data-part="trailer" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>
        <span aria-hidden="true" data-part="play" />
        {t("watchTrailer")}
      </summary>
      {open && (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1`}
          title={t("trailer")}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}
    </details>
  );
}
