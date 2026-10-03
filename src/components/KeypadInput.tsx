import { Delete, RotateCcw } from "lucide-react";

interface KeypadInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  masked?: boolean;
  placeholder?: string;
}

export function KeypadInput({
  label,
  value,
  onChange,
  maxLength = 12,
  masked = false,
  placeholder,
}: KeypadInputProps) {
  const append = (digit: string) => {
    if (value.length < maxLength) onChange(`${value}${digit}`);
  };

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-lg font-semibold text-foreground">{label}</legend>
      <input
        aria-label={label}
        className="mb-4 min-h-14 w-full rounded-xl border border-input bg-background px-4 text-center font-display text-2xl tracking-[0.2em] text-foreground outline-none"
        inputMode="none"
        readOnly
        value={masked ? "●".repeat(value.length) : value}
        placeholder={placeholder}
      />
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => append(digit)}
            className="min-h-14 rounded-xl border border-border bg-secondary text-xl font-semibold text-foreground active:bg-accent"
            aria-label={`Enter ${digit}`}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-secondary text-lg font-semibold text-muted-foreground active:bg-accent"
          aria-label={`Clear ${label}`}
        >
          <RotateCcw aria-hidden="true" className="size-5" />
          Clear
        </button>
        <button
          type="button"
          onClick={() => append("0")}
          className="min-h-14 rounded-xl border border-border bg-secondary text-xl font-semibold text-foreground active:bg-accent"
          aria-label="Enter 0"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => onChange(value.slice(0, -1))}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-secondary text-lg font-semibold text-muted-foreground active:bg-accent"
          aria-label={`Delete last digit from ${label}`}
        >
          <Delete aria-hidden="true" className="size-5" />
          Backspace
        </button>
      </div>
    </fieldset>
  );
}
