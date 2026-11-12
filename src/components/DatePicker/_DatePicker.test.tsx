import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DatePicker } from "./_DatePicker";

const renderPicker = () =>
  render(
    <>
      <button type="button">altrove</button>
      <DatePicker summary={<b>Date</b>}>
        <form>
          <label>
            Dal
            <input />
          </label>
          <a href="#two-weeks">2 settimane</a>
        </form>
      </DatePicker>
    </>,
  );

const trigger = () => screen.getByRole("button", { name: "Date" });

const openPicker = () => {
  fireEvent.click(trigger());

  return trigger();
};

describe("DatePicker", () => {
  it("renders a collapsed button named by its content, and no panel", () => {
    renderPicker();

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("type", "button");
    expect(screen.queryByLabelText("Dal")).toBeNull();
  });

  it("takes an accessible name when the visible content is not enough", () => {
    render(
      <DatePicker summary={<b>FR</b>} summaryLabel="Paese delle uscite: Francia">
        <ul />
      </DatePicker>,
    );

    expect(screen.getByRole("button", { name: "Paese delle uscite: Francia" })).toBeInTheDocument();
  });

  it("takes the data-part it is given, for the country menu", () => {
    const { container } = render(
      <DatePicker part="country-picker" summary={<b>Italia</b>}>
        <ul />
      </DatePicker>,
    );

    expect(container.firstElementChild).toHaveAttribute("data-part", "country-picker");
  });

  it("opens the panel and marks the button expanded, then closes on a second press", () => {
    renderPicker();

    expect(openPicker()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Dal")).toBeInTheDocument();

    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Dal")).toBeNull();
  });

  it("closes when the pointer is pressed outside it", () => {
    renderPicker();
    openPicker();

    fireEvent.pointerDown(screen.getByRole("button", { name: "altrove" }));

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when the pointer is pressed on the picker box itself, the phone scrim", () => {
    const { container } = renderPicker();
    openPicker();

    fireEvent.pointerDown(container.querySelector("[data-part='date-picker']")!);

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("stays open when the pointer is pressed inside the form", () => {
    renderPicker();
    openPicker();

    fireEvent.pointerDown(screen.getByLabelText("Dal"));

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes when a link inside it is clicked, such as a shortcut chip", () => {
    renderPicker();
    openPicker();

    fireEvent.click(screen.getByRole("link", { name: "2 settimane" }));

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("stays open when the panel is clicked outside its links", () => {
    renderPicker();
    openPicker();

    fireEvent.click(screen.getByLabelText("Dal"));

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on Escape and gives focus back to the button", () => {
    renderPicker();
    openPicker();
    screen.getByLabelText("Dal").focus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
  });

  it("ignores other keys", () => {
    renderPicker();
    openPicker();

    fireEvent.keyDown(document, { key: "Enter" });

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("drops what was typed but not sent when it reopens", () => {
    renderPicker();
    openPicker();
    fireEvent.change(screen.getByLabelText("Dal"), { target: { value: "2026-12-01" } });

    fireEvent.click(trigger());
    openPicker();

    expect(screen.getByLabelText("Dal")).toHaveValue("");
  });
});
