const NAMED: Readonly<Record<string, string>> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
};

// Italian, French and German month names without accents; shared names agree on the number.
const MONTHS: Readonly<Record<string, number>> = {
  gennaio: 1,
  febbraio: 2,
  marzo: 3,
  aprile: 4,
  maggio: 5,
  giugno: 6,
  luglio: 7,
  agosto: 8,
  settembre: 9,
  ottobre: 10,
  novembre: 11,
  dicembre: 12,
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  decembre: 12,
  januar: 1,
  februar: 2,
  marz: 3,
  april: 4,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12,
};

const LONG_DATE = /(\d{1,2})(?:er|\.)?\s+(\S+)\s+(\d{4})/;

const pad = (value: number | string): string => String(value).padStart(2, "0");

/** Text of an HTML fragment: tags dropped, entities decoded, spaces collapsed. */
export function htmlText(html: string): string {
  return html
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (entity, code: string) => {
      if (code[0] !== "#") {
        return NAMED[code] ?? entity;
      }

      const point =
        code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);

      return point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    })
    .replaceAll(/\s+/g, " ")
    .trim();
}

/**
 * ISO date of a written date such as "23 novembre 2026", "1er décembre 2026" or
 * "19. November 2026"; null when the text is not one.
 */
export function parseLongDate(text: string): string | null {
  const match = LONG_DATE.exec(text);

  if (!match) {
    return null;
  }

  const month = MONTHS[match[2].normalize("NFD").replaceAll(/\p{M}/gu, "").toLowerCase()];

  return month ? `${match[3]}-${pad(month)}-${pad(match[1])}` : null;
}
