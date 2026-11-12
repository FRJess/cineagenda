"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

/**
 * Trailer: a play button that, once pressed, is replaced by the YouTube player, so nothing loads
 * or plays before the click. Focus moves to the player, since the button is gone.
 * @param props YouTube video key.
 * @returns Play button, or the player.
 */
export function FilmTrailer({ trailerKey }: { readonly trailerKey: string }) {
  const t = useTranslations("Film");
  const [playing, setPlaying] = useState(false);
  const player = useRef<HTMLIFrameElement>(null);

  // With cacheComponents Next keeps a visited page mounted but hidden (React Activity), so a
  // playing iframe would keep its audio after the user leaves. Hiding runs this cleanup.
  useEffect(() => () => setPlaying(false), []);

  useEffect(() => {
    if (playing) {
      player.current?.focus();
    }
  }, [playing]);

  return (
    <div data-part="trailer">
      {playing ? (
        <iframe
          ref={player}
          src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1`}
          title={t("trailer")}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)}>
          <span aria-hidden="true" data-part="play" />
          {t("watchTrailer")}
        </button>
      )}
    </div>
  );
}
