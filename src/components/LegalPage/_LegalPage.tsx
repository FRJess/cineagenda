import type { ReactNode } from "react";
import "./_LegalPage.css";

/** Contact address named in both pages. */
export const CONTACT_EMAIL = "hello@cineagenda.app";

/**
 * Rich-text tag for a link that leaves the site, opened in a new tab.
 * @param href Absolute address.
 * @returns Renderer for `t.rich`.
 */
export const external = (href: string) =>
  function ExternalLink(chunks: ReactNode) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {chunks}
      </a>
    );
  };

/** Rich-text tags shared by the About and Privacy texts: bold lead-ins and the contact email. */
export const TEXT_TAGS = {
  b: (chunks: ReactNode) => <strong>{chunks}</strong>,
  mail: (chunks: ReactNode) => <a href={`mailto:${CONTACT_EMAIL}`}>{chunks}</a>,
};

/**
 * Shared body of the About and Privacy pages: one sheet with the title, an optional update line,
 * a lead paragraph and the sections.
 * @param props Title, optional update line, lead and the sections as children.
 * @returns Main landmark.
 */
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
