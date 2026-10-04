import { AlertTriangle, RotateCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry: () => void;
}

export function ErrorState({
  title = "Unable to load this information",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="erp-surface flex min-h-40 flex-col items-center justify-center p-6 text-center"
    >
      <AlertTriangle aria-hidden="true" className="mb-3 size-8 text-orange-300" strokeWidth={1.5} />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-14 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-base font-semibold text-foreground active:bg-white/10"
      >
        <RotateCw aria-hidden="true" className="size-5" strokeWidth={1.5} />
        Retry
      </button>
    </section>
  );
}
