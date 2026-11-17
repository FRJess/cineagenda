import type { ReactNode } from "react";
import "./_ServicePage.css";

const CODE_LABEL = { "404": "NOT FOUND", "!": "ERR" } as const;

export function ServicePage({
  code,
  eyebrow,
  title,
  text,
  primary,
  secondary,
}: {
  readonly code: keyof typeof CODE_LABEL;
  readonly eyebrow: string;
  readonly title: string;
  readonly text: string;
  readonly primary: ReactNode;
  readonly secondary?: ReactNode;
}) {
  return (
    <main data-part="not-found">
      <div data-part="nf-poster" aria-hidden="true">
        <b>{code}</b>
        <small>{CODE_LABEL[code]}</small>
      </div>
      <div data-part="nf-text">
        <p data-part="nf-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
        <div data-part="nf-actions">
          {primary}
          {secondary}
        </div>
      </div>
    </main>
  );
}
