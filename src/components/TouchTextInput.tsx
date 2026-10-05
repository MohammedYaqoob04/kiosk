import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { KioskKeyboard } from "@/components/KioskKeyboard";
import { Button } from "@/components/ui/button";

interface TouchTextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  masked?: boolean;
  layout?: "numeric" | "full";
}

export function TouchTextInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 120,
  multiline = false,
  masked = false,
  layout = "full",
}: TouchTextInputProps) {
  const [open, setOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const append = (character: string) => {
    if (value.length < maxLength) onChange(`${value}${character}`);
  };

  const backspace = () => {
    onChange(value.slice(0, -1));
  };

  const clear = () => {
    onChange("");
  };

  const displayValue = masked && !passwordVisible ? "●".repeat(value.length) : value;

  return (
    <div className="touch-text-input">
      <div className="mb-2 flex items-center justify-between">
        <span className="block text-lg font-medium text-foreground">{label}</span>
        {masked && value.length > 0 && (
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
          >
            {passwordVisible ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
            <span>{passwordVisible ? "Hide" : "Show"}</span>
          </button>
        )}
      </div>

      {multiline ? (
        <textarea
          aria-label={label}
          aria-expanded={open}
          readOnly
          rows={3}
          value={value}
          placeholder={placeholder ?? "Tap to enter"}
          onClick={() => setOpen((current) => !current)}
          className="min-h-24 w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-left text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <button
          type="button"
          aria-label={`Edit ${label}`}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="min-h-14 w-full rounded-xl border border-input bg-background px-4 text-left text-lg text-foreground active:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {value ? (
            displayValue
          ) : (
            <span className="text-muted-foreground">{placeholder ?? "Tap to enter"}</span>
          )}
        </button>
      )}

      {open && (
        <div
          className="mt-3 rounded-2xl border border-border bg-card p-3 shadow-lg"
          aria-label="On-screen keyboard"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-muted-foreground">{label}</span>
            <span className="text-sm text-muted-foreground">
              {value.length}/{maxLength}
            </span>
          </div>

          <KioskKeyboard
            layout={layout}
            isPassword={masked}
            passwordVisible={passwordVisible}
            onTogglePassword={() => setPasswordVisible((v) => !v)}
            onCharacter={append}
            onBackspace={backspace}
            onClear={clear}
            onSpace={() => append(" ")}
          />

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-14 rounded-lg bg-primary px-6 text-lg font-semibold text-primary-foreground"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
