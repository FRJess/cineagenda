"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Date disclosure: a native details element that also closes on Escape and on a press outside
 * its summary and form. The page stays server-rendered; only this disclosure needs script.
 * @param props Summary content and the panel content.
 * @returns Details element.
 */
export function DatePicker({
  summary,
  children,
}: {
  readonly summary: ReactNode;
  readonly children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    // The phone scrim is a pseudo-element of the details box, so a press on it targets the box.
    const onPointerDown = (event: Event) => {
      const details = ref.current;
      const target = event.target;
      const inPanel =
        target instanceof Element && (target.closest("summary") ?? target.closest("form"));

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
    <details ref={ref} data-part="date-picker">
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
