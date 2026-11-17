import type { ReactNode } from "react";
import "./_LegalPage.css";

export const CONTACT_EMAIL = "hello@cineagenda.app";

export const external = (href: string) =>
  function ExternalLink(chunks: ReactNode) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {chunks}
      </a>
    );
  };

export const TEXT_TAGS = {
  b: (chunks: ReactNode) => <strong>{chunks}</strong>,
  mail: (chunks: ReactNode) => <a href={`mailto:${CONTACT_EMAIL}`}>{chunks}</a>,
};

export function LegalPage({
  title,
  updated,
  lead,
  children,
}: {
  readonly title: string;
  readonly updated?: ReactNode;
  readonly lead: string;
  readonly children: ReactNode;
}) {
  return (
    <main data-part="legal">
      <article data-part="legal-sheet">
        <header>
          <h1>{title}</h1>
          {updated && <p data-part="legal-updated">{updated}</p>}
          <p data-part="legal-lead">{lead}</p>
        </header>
        {children}
      </article>
    </main>
  );
}
