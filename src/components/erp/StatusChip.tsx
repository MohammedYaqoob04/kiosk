type Status = "Present" | "Absent" | "OD" | "Paid" | "Due" | "Eligible" | "Low";

const colors: Record<Status, string> = {
  Present: "border-ok/20 bg-ok/10 text-ok",
  Absent: "border-danger/20 bg-danger/10 text-danger",
  OD: "border-border bg-surface text-foreground",
  Paid: "border-ok/20 bg-ok/10 text-ok",
  Due: "border-border bg-surface text-foreground",
  Eligible: "border-ok/20 bg-ok/10 text-ok",
  Low: "border-danger/20 bg-danger/10 text-danger",
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 text-sm font-semibold ${colors[status]}`}
    >
      {status}
    </span>
  );
}
