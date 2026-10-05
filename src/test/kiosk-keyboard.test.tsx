import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { KioskKeyboard } from "@/components/KioskKeyboard";

function FullKeyboardHarness() {
  const [value, setValue] = useState("");
  return (
    <div>
      <input data-testid="result-input" value={value} readOnly />
      <KioskKeyboard
        layout="full"
        onCharacter={(char) => setValue((prev) => prev + char)}
        onBackspace={() => setValue((prev) => prev.slice(0, -1))}
        onClear={() => setValue("")}
        onSpace={() => setValue((prev) => prev + " ")}
      />
    </div>
  );
}

function NumericKeyboardHarness() {
  const [value, setValue] = useState("");
  return (
    <div>
      <input data-testid="result-input" value={value} readOnly />
      <KioskKeyboard
        layout="numeric"
        onCharacter={(char) => setValue((prev) => prev + char)}
        onBackspace={() => setValue((prev) => prev.slice(0, -1))}
        onClear={() => setValue("")}
      />
    </div>
  );
}

describe("KioskKeyboard", () => {
  it("'-' exists in both numeric and full layouts", () => {
    const { unmount: unmountNumeric } = render(<NumericKeyboardHarness />);
    const numericHyphen = screen.getByRole("button", { name: "-" });
    expect(numericHyphen).toBeInTheDocument();
    fireEvent.click(numericHyphen);
    expect(screen.getByTestId("result-input")).toHaveValue("-");
    unmountNumeric();

    render(<FullKeyboardHarness />);
    const fullHyphen = screen.getByRole("button", { name: "-" });
    expect(fullHyphen).toBeInTheDocument();
    fireEvent.click(fullHyphen);
    expect(screen.getByTestId("result-input")).toHaveValue("-");
  });

  it("typing a, n, i, t, h, a, '-', s, t, a, f, f gives 'anitha-staff'", () => {
    render(<FullKeyboardHarness />);

    const keysToType = ["a", "n", "i", "t", "h", "a", "-", "s", "t", "a", "f", "f"];

    for (const char of keysToType) {
      const button = screen.getByRole("button", { name: char });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
    }

    const input = screen.getByTestId("result-input");
    expect(input).toHaveValue("anitha-staff");
  });

  it("numeric layout includes 0-9, '-', '/', '.', Backspace, and Clear", () => {
    render(<NumericKeyboardHarness />);

    const expectedKeys = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "/", "."];
    for (const key of expectedKeys) {
      expect(screen.getByRole("button", { name: key })).toBeInTheDocument();
    }

    expect(screen.getByRole("button", { name: /backspace/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("full layout includes digits, QWERTY letters, symbols, shift, space, backspace, and clear", () => {
    render(<FullKeyboardHarness />);

    // Digits 0-9
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole("button", { name: String(i) })).toBeInTheDocument();
    }

    // Required symbols
    for (const sym of ["-", "_", ".", "@", "#", "!"]) {
      expect(screen.getByRole("button", { name: sym })).toBeInTheDocument();
    }

    // Utility keys
    expect(screen.getByRole("button", { name: /^shift$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^space$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^backspace$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^clear$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "?123" })).toBeInTheDocument();
  });

  it("all keyboard keys have min-h-14 ensuring at least 56px height", () => {
    const { container } = render(<FullKeyboardHarness />);
    const buttons = container.querySelectorAll(".kiosk-keyboard-key");
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect(btn.className).toContain("min-h-14");
    });
  });

  it("supports password show/hide toggle when isPassword is true", () => {
    let visible = false;
    const toggle = () => {
      visible = !visible;
    };

    const { rerender } = render(
      <KioskKeyboard
        layout="full"
        onCharacter={() => {}}
        onBackspace={() => {}}
        onClear={() => {}}
        isPassword={true}
        passwordVisible={false}
        onTogglePassword={toggle}
      />
    );

    const showButton = screen.getByRole("button", { name: /show password/i });
    expect(showButton).toBeInTheDocument();
    fireEvent.click(showButton);
    expect(visible).toBe(true);

    rerender(
      <KioskKeyboard
        layout="full"
        onCharacter={() => {}}
        onBackspace={() => {}}
        onClear={() => {}}
        isPassword={true}
        passwordVisible={true}
        onTogglePassword={toggle}
      />
    );

    const hideButton = screen.getByRole("button", { name: /hide password/i });
    expect(hideButton).toBeInTheDocument();
  });
});
