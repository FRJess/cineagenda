import { describe, expect, it } from "vitest";
import { comingSoonOriginalTitle, parseComingSoon } from "./comingsoon";
import { parseSchedule } from "./the-numbers";
import { agendaOriginalTitle, parseAgenda } from "./webedia";

// Markup copied from the live pages on 2026-11-18, trimmed to the parts the parsers read.
const COMINGSOON = `
<a href="/film/fjord/67491/scheda/" title="Fjord" class="cards cards-horiz-box box-office min film brd-c">
<div class="titolo h2">Fjord</div>
<div class='p'><b>Anno:</b> <span>2026</span></div>
<div class='p'><b>Uscita:</b> <span>19/11/2026</span></div>
</a>
<a href="/film/senza-data/1/scheda/" title="Senza data" class="cards cards-horiz-box film">
<div class="titolo h2">Senza data</div>
</a>
<ul>
 <li><a href="/film/mustang/69142/scheda/" title="Mustang"><div><span>Mustang</span> <span>23 novembre 2026</span></div></a></li>
 <li><a href="/film/e-andata-cosi/68256/scheda/" title="&#200; Andata Cos&#236;"><div><span>&#200; Andata Cos&#236;</span> <span>26 novembre 2026</span></div></a></li>
</ul>`;

const FILM_URL = "/film/fichefilm_gen_cfilm=1000022995.html";

const card = (title: string, date: string): string => `
<li class="mdl">
<div class="card entity-card entity-card-list cf">
  <h2 class="meta-title">
    <a class="meta-title-link" href="/film/fichefilm_gen_cfilm=1000022995.html">${title}</a>
  </h2>
  <div class="meta-body-item meta-body-info">
    <span class="date">${date}</span>
    <span class="spacer">|</span>
  </div>
</div>
</li>`;

const THE_NUMBERS = `
<table>
<tr><th>Release Date</th><th>Movie</th><th>Distributor</th></tr>
<tr><td colspan=4 style="text-align:left">November 2026</td></tr>
<tr id="2026-11-18">
<td style="padding-left:5px">November 18</td>
<td><b><a href="/movie/Madden-(2026)">Madden</a></b> (Limited)</td>
</tr>
<tr>
<td></td>
<td><b><a href="/movie/Tutu-(2026-United-Kingdom)">TUTU</a></b> (Limited)</td>
</tr>
<tr>
<td colspan=4>&nbsp;</td>
</tr>
<tr class="highlight" id="2026-11-20">
<td style="padding-left:5px">November 20</td>
<td><b><a href="/movie/Hunger-Games">The Hunger Games: Sunrise on the Reaping</a></b> (Wide)</td>
</tr>
<tr class="highlight">
<td></td>
<td><b><a href="/movie/I-Play-Rocky-(2026)">I Play Rocky</a></b> (Expands Wide)</td>
</tr>
</table>`;

describe("parseComingSoon", () => {
  it("reads the cards and the week lists, and skips a card with no date", () => {
    expect(parseComingSoon(COMINGSOON)).toEqual([
      { title: "Fjord", date: "2026-11-19", url: "/film/fjord/67491/scheda/" },
      { title: "Mustang", date: "2026-11-23", url: "/film/mustang/69142/scheda/" },
      { title: "È Andata Così", date: "2026-11-26", url: "/film/e-andata-cosi/68256/scheda/" },
    ]);
  });
});

describe("parseAgenda", () => {
  it("reads French and German agenda cards", () => {
    const html =
      card("Jupiter", "18 novembre 2026") + card("Der Regenbogenfisch", "19. November 2026");

    expect(parseAgenda(html)).toEqual([
      { title: "Jupiter", date: "2026-11-18", url: FILM_URL },
      { title: "Der Regenbogenfisch", date: "2026-11-19", url: FILM_URL },
    ]);
  });

  it("skips a card whose date cannot be read", () => {
    expect(parseAgenda(card("Jupiter", "Prochainement"))).toEqual([]);
  });
});

describe("parseSchedule", () => {
  it("gives each film the day of its row group and skips expansions", () => {
    expect(parseSchedule(THE_NUMBERS)).toEqual([
      { title: "Madden", date: "2026-11-18" },
      { title: "TUTU", date: "2026-11-18" },
      { title: "The Hunger Games: Sunrise on the Reaping", date: "2026-11-20" },
    ]);
  });
});

describe("original titles", () => {
  it("reads the ComingSoon.it film page", () => {
    const html = `<div class='p'><b>Titolo:</b> <span>Il Caso Marie-Claire</span></div>
<div class='p'><b>Titolo originale:</b> <span>L'Affaire Marie-Claire</span></div>`;

    expect(comingSoonOriginalTitle(html)).toBe("L'Affaire Marie-Claire");
    expect(comingSoonOriginalTitle("<b>Titolo:</b> <span>Fjord</span>")).toBeNull();
  });

  it("reads the AlloCine and Filmstarts film pages", () => {
    const page = (label: string): string =>
      `<div class="meta-body-item"> <span class="light">${label}</span> <span class="dark-grey">The Weight</span> </div>`;

    expect(agendaOriginalTitle(page("Titre original "))).toBe("The Weight");
    expect(agendaOriginalTitle(page("Originaltitel: "))).toBe("The Weight");
    expect(agendaOriginalTitle('<span class="light">De</span>')).toBeNull();
  });
});
