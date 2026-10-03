import { useState } from "react";
import { Delete, RotateCcw } from "lucide-react";

interface TouchTextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const keyboardRows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export function TouchTextInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 120,
}: TouchTextInputProps) {
  const [open, setOpen] = useState(false);
  const [uppercase, setUppercase] = useState(false);
  const append = (character: string) => {
    if (value.length < maxLength) onChange(`${value}${character}`);
  };

  return (
    <div>
      <span className="mb-2 block text-lg font-medium text-foreground">{label}</span>
      <button
        type="button"
        aria-label={`Edit ${label}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="min-h-14 w-full rounded-xl border border-input bg-background px-4 text-left text-lg text-foreground active:bg-secondary"
      >
        {value || <span className="text-muted-foreground">{placeholder ?? "Tap to enter"}</span>}
      </button>
      {open && (
        <div
          className="mt-3 rounded-2xl border border-border bg-card p-3"
          aria-label="On-screen keyboard"
        >
          <div className="mb-2 grid grid-cols-10 gap-1">
            {"1234567890".split("").map((character) => (
              <button
                key={character}
                type="button"
                onClick={() => append(character)}
                className="min-h-12 min-w-0 rounded-lg border border-border bg-secondary text-lg font-semibold text-foreground active:bg-accent"
                aria-label={`Enter ${character}`}
              >
                {character}
              </button>
            ))}
          </div>
          {keyboardRows.map((row) => (
            <div key={row} className="mb-2 grid grid-cols-10 gap-1">
              {[...row].map((character) => {
                const shownCharacter = uppercase ? character.toUpperCase() : character;
                return (
                  <button
                    key={character}
                    type="button"
                    onClick={() => append(shownCharacter)}
                    className="min-h-12 min-w-0 rounded-lg border border-border bg-secondary text-lg font-semibold text-foreground active:bg-accent"
                    aria-label={`Enter ${shownCharacter}`}
                  >
                    {shownCharacter}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              aria-pressed={uppercase}
              onClick={() => setUppercase((current) => !current)}
              className="min-h-14 rounded-lg border border-border bg-secondary px-4 text-lg font-semibold text-foreground active:bg-accent"
            >
              Shift
            </button>
            <button
              type="button"
              onClick={() => append(" ")}
              className="min-h-14 min-w-28 rounded-lg border border-border bg-secondary px-4 text-lg text-foreground active:bg-accent"
            >
              Space
            </button>
            <button
              type="button"
              onClick={() => onChange(value.slice(0, -1))}
              className="inline-flex min-h-14 items-center gap-2 rounded-lg border border-border bg-secondary px-4 text-lg text-foreground active:bg-accent"
            >
              <Delete aria-hidden="true" className="size-5" /> Backspace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex min-h-14 items-center gap-2 rounded-lg border border-border bg-secondary px-4 text-lg text-foreground active:bg-accent"
            >
              <RotateCcw aria-hidden="true" className="size-5" /> Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-14 rounded-lg bg-primary px-5 text-lg font-semibold text-primary-foreground"
            >
              Done
            </button>
          </div>
          <p className="mt-2 text-right text-base text-muted-foreground">
            {value.length}/{maxLength}
          </p>
        </div>
      )}
    </div>
  );
}
