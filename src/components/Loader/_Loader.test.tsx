import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { Loader } from "./_Loader";

describe("Loader", () => {
  it.each([
    ["it", "Caricamento..."],
    ["en", "Loading..."],
    ["fr", "Chargement..."],
  ] as const)("is a status named in the UI language (%s)", (locale, label) => {
    renderWithIntl(<Loader />, locale);

    expect(screen.getByRole("status")).toHaveTextContent(label);
  });

  it("draws three perforations that are hidden from assistive technology", () => {
    const { container } = renderWithIntl(<Loader />);
    const mark = container.querySelector("[data-part='loader-mark']");

    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark?.querySelectorAll("span")).toHaveLength(3);
  });
});
