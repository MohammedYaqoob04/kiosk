import { useState } from "react";
import { Delete, Eye, EyeOff, RotateCcw } from "lucide-react";

export interface KioskKeyboardProps {
  layout?: "numeric" | "full";
  shift?: boolean;
  onShift?: () => void;
  onCharacter: (character: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSpace?: () => void;
  isPassword?: boolean;
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
  className?: string;
}

const letterTopRow = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"] as const;
const letterHomeRow = ["a", "s", "d", "f", "g", "h", "j", "k", "l"] as const;
const letterBottomRow = ["z", "x", "c", "v", "b", "n", "m"] as const;

const symbolTopRow = ["/", "?", "+", "=", ":", ";", "\"", "'", "&", "*"] as const;
const symbolHomeRow = ["~", "$", "%", "^", "<", ">", "(", ")", "\\"] as const;
const symbolBottomRow = [",", "[", "]", "{", "}", "|", "`"] as const;

export function KioskKeyboard({
  layout = "full",
  shift,
  onShift,
  onCharacter,
  onBackspace,
  onClear,
  onSpace,
  isPassword = false,
  passwordVisible = false,
  onTogglePassword,
  className = "",
}: KioskKeyboardProps) {
  const [internalShift, setInternalShift] = useState(false);
  const [internalPasswordVisible, setInternalPasswordVisible] = useState(false);
  const [symbolMode, setSymbolMode] = useState(false);

  const isShifted = shift !== undefined ? shift : internalShift;
  const isPassVisible = passwordVisible !== undefined ? passwordVisible : internalPasswordVisible;

  const toggleShift = () => {
    if (onShift) {
      onShift();
    } else {
      setInternalShift((prev) => !prev);
    }
  };

  const handleTogglePassword = () => {
    if (onTogglePassword) {
      onTogglePassword();
    } else {
      setInternalPasswordVisible((prev) => !prev);
    }
  };

  const handleSpace = () => {
    if (onSpace) {
      onSpace();
    } else {
      onCharacter(" ");
    }
  };

  if (layout === "numeric") {
    return (
      <div
        className={`kiosk-keyboard kiosk-keyboard-numeric ${className}`}
        aria-label="On-screen numeric keypad"
      >
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              className="kiosk-keyboard-key min-h-14 font-semibold text-xl"
              onClick={() => onCharacter(digit)}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="kiosk-keyboard-key min-h-14 font-semibold text-xl"
            onClick={() => onCharacter("-")}
          >
            -
          </button>
          <button
            type="button"
            className="kiosk-keyboard-key min-h-14 font-semibold text-xl"
            onClick={() => onCharacter("0")}
          >
            0
          </button>
          <button
            type="button"
            className="kiosk-keyboard-key min-h-14 font-semibold text-xl"
            onClick={() => onCharacter("/")}
          >
            /
          </button>
          <button
            type="button"
            className="kiosk-keyboard-key min-h-14 font-semibold text-xl"
            onClick={() => onCharacter(".")}
          >
            .
          </button>
          <button
            type="button"
            className="kiosk-keyboard-key utility-key min-h-14 font-medium text-base gap-2"
            onClick={onClear}
            aria-label="Clear"
          >
            <RotateCcw aria-hidden="true" className="size-5" strokeWidth={1.5} />
            <span>Clear</span>
          </button>
          <button
            type="button"
            className="kiosk-keyboard-key utility-key min-h-14 font-medium text-base gap-2"
            onClick={onBackspace}
            aria-label="Backspace"
          >
            <Delete aria-hidden="true" className="size-5" strokeWidth={1.5} />
            <span>Backspace</span>
          </button>
        </div>
        {isPassword && (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="kiosk-keyboard-key utility-key min-h-14 w-full mt-2 font-medium text-base gap-2"
            aria-label={isPassVisible ? "Hide password" : "Show password"}
          >
            {isPassVisible ? (
              <EyeOff aria-hidden="true" className="size-5" strokeWidth={1.5} />
            ) : (
              <Eye aria-hidden="true" className="size-5" strokeWidth={1.5} />
            )}
            <span>{isPassVisible ? "Hide password" : "Show password"}</span>
          </button>
        )}
      </div>
    );
  }

  // Full layout (QWERTY letters, digits, symbols, shift, space, backspace, clear)
  const currentTopRow: readonly string[] = symbolMode ? symbolTopRow : letterTopRow;
  const currentHomeRow: readonly string[] = symbolMode ? symbolHomeRow : letterHomeRow;
  const currentBottomLetters: readonly string[] = symbolMode ? symbolBottomRow : letterBottomRow;

  return (
    <div
      className={`kiosk-keyboard kiosk-keyboard-full ${className}`}
      aria-label="On-screen text keyboard"
    >
      {/* Row 1: Digit row 1-0 */}
      <div className="flex gap-1.5 justify-center">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((digit) => (
          <button
            key={digit}
            type="button"
            className="kiosk-keyboard-key min-h-14 flex-1 font-semibold text-lg"
            onClick={() => onCharacter(digit)}
          >
            {digit}
          </button>
        ))}
      </div>

      {/* Row 2: QWERTY top row or Symbols top row */}
      <div className="flex gap-1.5 justify-center">
        {currentTopRow.map((character) => {
          const output =
            !symbolMode && isShifted && character >= "a" && character <= "z"
              ? character.toUpperCase()
              : character;
          return (
            <button
              key={character}
              type="button"
              className="kiosk-keyboard-key min-h-14 flex-1 font-semibold text-lg"
              onClick={() => onCharacter(output)}
            >
              {output}
            </button>
          );
        })}
      </div>

      {/* Row 3: QWERTY home row or Symbols home row */}
      <div className="flex gap-1.5 justify-center px-3">
        {currentHomeRow.map((character) => {
          const output =
            !symbolMode && isShifted && character >= "a" && character <= "z"
              ? character.toUpperCase()
              : character;
          return (
            <button
              key={character}
              type="button"
              className="kiosk-keyboard-key min-h-14 flex-1 font-semibold text-lg"
              onClick={() => onCharacter(output)}
            >
              {output}
            </button>
          );
        })}
      </div>

      {/* Row 4: Shift, bottom letters/symbols, hyphen '-', Backspace */}
      <div className="flex gap-1.5 justify-center">
        <button
          type="button"
          className={`kiosk-keyboard-key utility-key min-h-14 px-3 font-semibold text-base ${
            isShifted ? "is-selected border-primary bg-primary/20" : ""
          }`}
          style={{ flex: "1.3" }}
          onClick={toggleShift}
          aria-label="Shift"
          aria-pressed={isShifted}
        >
          Shift
        </button>

        {currentBottomLetters.map((character) => {
          const output =
            !symbolMode && isShifted && character >= "a" && character <= "z"
              ? character.toUpperCase()
              : character;
          return (
            <button
              key={character}
              type="button"
              className="kiosk-keyboard-key min-h-14 flex-1 font-semibold text-lg"
              onClick={() => onCharacter(output)}
            >
              {output}
            </button>
          );
        })}

        {/* Hyphen "-" always present in Row 4 in both ABC and symbol modes */}
        <button
          type="button"
          className="kiosk-keyboard-key min-h-14 flex-1 font-semibold text-lg"
          onClick={() => onCharacter("-")}
        >
          -
        </button>

        <button
          type="button"
          className="kiosk-keyboard-key utility-key min-h-14 px-3 font-semibold text-base gap-1"
          style={{ flex: "1.5" }}
          onClick={onBackspace}
          aria-label="Backspace"
        >
          <Delete aria-hidden="true" className="size-5" strokeWidth={1.5} />
          <span>Backspace</span>
        </button>
      </div>

      {/* Row 5: ?123/ABC switch, symbols: "_" "." "@" "#" "!", Space, Clear, Show/Hide */}
      <div className="flex gap-1.5 justify-center flex-wrap sm:flex-nowrap">
        <button
          type="button"
          className="kiosk-keyboard-key utility-key min-h-14 px-3 font-semibold text-base"
          style={{ flex: "1.2" }}
          onClick={() => setSymbolMode((prev) => !prev)}
        >
          {symbolMode ? "ABC" : "?123"}
        </button>

        {/* Essential symbol keys: "-" "_" "." "@" "#" "!" */}
        {["_", ".", "@", "#", "!"].map((sym) => (
          <button
            key={sym}
            type="button"
            className="kiosk-keyboard-key min-h-14 flex-1 font-semibold text-lg"
            onClick={() => onCharacter(sym)}
          >
            {sym}
          </button>
        ))}

        <button
          type="button"
          className="kiosk-keyboard-key utility-key min-h-14 px-6 font-semibold text-base"
          style={{ flex: "3" }}
          onClick={handleSpace}
          aria-label="Space"
        >
          Space
        </button>

        <button
          type="button"
          className="kiosk-keyboard-key utility-key min-h-14 px-3 font-semibold text-base gap-1"
          style={{ flex: "1.2" }}
          onClick={onClear}
          aria-label="Clear"
        >
          <RotateCcw aria-hidden="true" className="size-5" strokeWidth={1.5} />
          <span>Clear</span>
        </button>

        {isPassword && (
          <button
            type="button"
            className="kiosk-keyboard-key utility-key min-h-14 px-3 font-semibold text-base gap-1"
            style={{ flex: "1.4" }}
            onClick={handleTogglePassword}
            aria-label={isPassVisible ? "Hide password" : "Show password"}
          >
            {isPassVisible ? (
              <EyeOff aria-hidden="true" className="size-5" strokeWidth={1.5} />
            ) : (
              <Eye aria-hidden="true" className="size-5" strokeWidth={1.5} />
            )}
            <span>{isPassVisible ? "Hide" : "Show"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
