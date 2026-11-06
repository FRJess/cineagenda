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
        </form>
      </DatePicker>
    </>,
  );

const openPicker = () => {
  const details = document.querySelector("details") as HTMLDetailsElement;
  details.open = true;

  return details;
};

describe("DatePicker", () => {
  it("renders a closed details element named by the summary", () => {
    renderPicker();

    expect(document.querySelector("details")).not.toHaveAttribute("open");
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("closes when the pointer is pressed outside it", () => {
    renderPicker();
    const details = openPicker();

    fireEvent.pointerDown(screen.getByRole("button", { name: "altrove" }));

    expect(details.open).toBe(false);
  });

  it("closes when the pointer is pressed on the details box itself, the phone scrim", () => {
    renderPicker();
    const details = openPicker();

    fireEvent.pointerDown(details);

    expect(details.open).toBe(false);
  });

  it("stays open when the pointer is pressed inside the form", () => {
    renderPicker();
    const details = openPicker();

    fireEvent.pointerDown(screen.getByLabelText("Dal"));

    expect(details.open).toBe(true);
  });

  it("closes on Escape", () => {
    renderPicker();
    const details = openPicker();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(details.open).toBe(false);
  });

  it("ignores other keys", () => {
    renderPicker();
    const details = openPicker();

    fireEvent.keyDown(document, { key: "Enter" });

    expect(details.open).toBe(true);
  });
});
