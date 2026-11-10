import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { ServicePage } from "./_ServicePage";

const renderPage = (code: "404" | "!" = "404") =>
  renderWithIntl(
    <ServicePage
      code={code}
      eyebrow="Fuori programmazione"
      title="Questa pagina non è in cartellone."
      text="L'indirizzo è sbagliato."
      primary={<button type="button">Vai alle uscite</button>}
      secondary={<a href="https://www.themoviedb.org/search">Cerca su TMDB</a>}
    />,
  );

describe("ServicePage", () => {
  it("is a main landmark with eyebrow, heading, text and actions in order", () => {
    const { container } = renderPage();
    const text = container.querySelector("[data-part='nf-text']");

    expect(screen.getByRole("main")).toHaveAttribute("data-part", "not-found");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Questa pagina non è in cartellone.",
    );
    expect([...(text?.children ?? [])].map((el) => el.textContent)).toEqual([
      "Fuori programmazione",
      "Questa pagina non è in cartellone.",
      "L'indirizzo è sbagliato.",
      "Vai alle usciteCerca su TMDB",
    ]);
  });

  it("draws the empty poster with the code as decoration only", () => {
    const { container } = renderPage();
    const poster = container.querySelector("[data-part='nf-poster']");

    expect(poster).toHaveAttribute("aria-hidden", "true");
    expect(poster).toHaveTextContent("404NOT FOUND");
  });

  it("labels the error poster ERR", () => {
    const { container } = renderPage("!");

    expect(container.querySelector("[data-part='nf-poster']")).toHaveTextContent("!ERR");
  });

  it("renders only the primary action when there is no secondary one", () => {
    const { container } = renderWithIntl(
      <ServicePage
        code="404"
        eyebrow="Fuori programmazione"
        title="Questa pagina non è in cartellone."
        text="L'indirizzo è sbagliato."
        primary={<button type="button">Vai alle uscite</button>}
      />,
    );

    expect(container.querySelector("[data-part='nf-actions']")?.children).toHaveLength(1);
  });
});
