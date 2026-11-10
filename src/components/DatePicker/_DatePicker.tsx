"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Navbar disclosure, for the dates and the country: a native details element that also closes
 * on Escape, on a press outside its summary and panel, and on a link inside it (a shortcut chip,
 * a country), since client navigation keeps the layout and the details open. The page stays
 * server-rendered; only this disclosure needs script.
 * @param props Summary content, its accessible name when the visible text is not enough, the
 * panel content and the `data-part` of the details.
 * @returns Details element.
 */
export function DatePicker({
  summary,
  summaryLabel,
  children,
  part = "date-picker",
}: {
  readonly summary: ReactNode;
  readonly summaryLabel?: string;
  readonly children: ReactNode;
  readonly part?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    // The phone scrim is a pseudo-element of the details box, so a press on it targets the box.
    const onPointerDown = (event: Event) => {
      const details = ref.current;
      const target = event.target;
      const inPanel = target instanceof Node && target !== details && details?.contains(target);

      if (details?.open && !inPanel) {
        details.open = false;
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details
      ref={ref}
      data-part={part}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          event.currentTarget.open = false;
        }
      }}
    >
      <summary aria-label={summaryLabel}>{summary}</summary>
      {children}
    </details>
  );
}
