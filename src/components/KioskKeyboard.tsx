import { Delete, RotateCcw } from "lucide-react";

interface KioskKeyboardProps {
  shift: boolean;
  onShift: () => void;
  onCharacter: (character: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

const characterRows = ["1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm-"];

export function KioskKeyboard({
  shift,
  onShift,
  onCharacter,
  onBackspace,
  onClear,
}: KioskKeyboardProps) {
  return (
    <div className="kiosk-keyboard" aria-label="On-screen text keyboard">
      {characterRows.map((row, rowIndex) => (
        <div className={`kiosk-keyboard-row row-${rowIndex + 1}`} key={row}>
          {[...row].map((character) => {
            const output =
              character >= "a" && character <= "z" && shift ? character.toUpperCase() : character;
            return (
              <button
                key={character}
                type="button"
                className="kiosk-keyboard-key"
                onClick={() => onCharacter(output)}
                aria-label={character === "-" ? "Enter hyphen" : `Enter ${output}`}
              >
                {output}
              </button>
            );
          })}
        </div>
      ))}
      <div className="kiosk-keyboard-row utility-row">
        <button
          type="button"
          className={`kiosk-keyboard-key utility-key ${shift ? "is-selected" : ""}`}
          onClick={onShift}
          aria-pressed={shift}
        >
          Shift
        </button>
        <button type="button" className="kiosk-keyboard-key utility-key" onClick={onBackspace}>
          <Delete aria-hidden="true" className="size-5" strokeWidth={1.5} />
          Backspace
        </button>
        <button type="button" className="kiosk-keyboard-key utility-key" onClick={onClear}>
          <RotateCcw aria-hidden="true" className="size-5" strokeWidth={1.5} />
          Clear
        </button>
      </div>
    </div>
  );
}
