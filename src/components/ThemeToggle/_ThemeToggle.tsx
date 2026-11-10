"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import "./_ThemeToggle.css";

/** localStorage key; the inline script in the root layout reads the same key before paint. */
const THEME_STORAGE_KEY = "cineagenda-theme";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

/**
 * Subscribes a mounted toggle to theme changes.
 * @param listener Called after every change made by a toggle.
 * @returns Unsubscribe function.
 */
function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Theme in effect: the one the document already carries, then the stored choice, then the OS
 * preference.
 * @returns "light" or "dark".
 */
function readTheme(): Theme {
  const applied = document.documentElement.dataset.theme;

  if (applied === "light" || applied === "dark") {
    return applied;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // Storage blocked: fall back to the OS preference.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Footer switch between light and dark theme, shown as a sun and a moon with no text; the
 * choice is stored per viewer.
 * @returns Switch button named "Tema scuro" / "Dark theme", on while dark.
 */
export function ThemeToggle() {
  const t = useTranslations("Footer");
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light");

  // On a 404 response React re-creates the document on the client, so the boot script in the
  // layout never runs and a stored theme would be lost. Put it back from here.
  useEffect(() => {
    if (document.documentElement.dataset.theme) {
      return;
    }

    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

      if (stored === "light" || stored === "dark") {
        document.documentElement.dataset.theme = stored;
        listeners.forEach((listener) => listener());
      }
    } catch {
      // Storage blocked: the OS preference applies.
    }
  }, []);

  /** Flips the theme on the document, stores it and tells the other toggles; storage errors are ignored. */
  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = next;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice lasts until reload.
    }

    listeners.forEach((listener) => listener());
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label={t("theme")}
      data-part="theme-toggle"
      onClick={toggle}
    >
      <span data-part="theme-thumb" aria-hidden="true">
        <svg data-icon="sun" viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <svg data-icon="moon" viewBox="0 0 24 24" focusable="false">
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
        </svg>
      </span>
    </button>
  );
}
