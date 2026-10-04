type Status = "Present" | "Absent" | "OD" | "Paid" | "Due" | "Eligible" | "Low";

const colors: Record<Status, string> = {
  Present: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  Absent: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  OD: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  Paid: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  Due: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  Eligible: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  Low: "border-rose-400/20 bg-rose-400/10 text-rose-300",
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
