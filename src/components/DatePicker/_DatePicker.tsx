"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Navbar disclosure, for the dates and the country: a button with `aria-expanded` and a panel
 * mounted only while open, so every opening starts from the URL state. It closes on Escape
 * (focus back on the button), on a press outside the button and panel, and on a link inside it
 * (a country), since client navigation keeps the layout mounted.
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    // The phone scrim is a pseudo-element of the wrapper, so a press on it targets the wrapper.
    const onPointerDown = (event: Event) => {
      const wrapper = ref.current;
      const target = event.target;
      const inside = target instanceof Node && target !== wrapper && wrapper?.contains(target);

      if (!inside) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      data-part={part}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-label={summaryLabel}
        onClick={() => setOpen(!open)}
      >
        {summary}
      </button>
      {open && children}
    </div>
  );
}
