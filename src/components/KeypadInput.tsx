import { useState } from "react";
import { KioskKeyboard } from "@/components/KioskKeyboard";

interface KeypadInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  masked?: boolean;
  placeholder?: string;
  layout?: "numeric" | "full";
}

export function KeypadInput({
  label,
  value,
  onChange,
  maxLength = 32,
  masked = false,
  placeholder,
  layout = "numeric",
}: KeypadInputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-lg font-semibold text-foreground">{label}</legend>
      <input
        aria-label={label}
        className="mb-4 min-h-14 w-full rounded-xl border border-input bg-background px-4 text-center font-display text-2xl tracking-[0.2em] text-foreground outline-none"
        inputMode="none"
        readOnly
        value={masked && !passwordVisible ? "●".repeat(value.length) : value}
        placeholder={placeholder}
      />
      <KioskKeyboard
        layout={layout}
        isPassword={masked}
        passwordVisible={passwordVisible}
        onTogglePassword={() => setPasswordVisible((v) => !v)}
        onCharacter={(char) => {
          if (value.length < maxLength) onChange(`${value}${char}`);
        }}
        onBackspace={() => onChange(value.slice(0, -1))}
        onClear={() => onChange("")}
        onSpace={() => {
          if (value.length < maxLength) onChange(`${value} `);
        }}
      />
    </fieldset>
  );
}
