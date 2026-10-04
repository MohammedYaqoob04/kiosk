import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, ReceiptText } from "lucide-react";
import { useMemo } from "react";

import { api, type FeeSummary, type StudentProfile } from "@/api";
import { useApi } from "@/api/use-api";
import { DataTable } from "@/components/erp/DataTable";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { StatusChip } from "@/components/erp/StatusChip";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/fees")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: FeesPage,
  head: () => ({ meta: [{ title: "Student Fee Details | Arunai ERP" }] }),
});

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatFeeType(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FeesPage() {
  const profile = useApi(["erp", "profile"], api.getProfile);
  const fees = useApi(["erp", "fees"], api.getFees);
  const retry = () => {
    profile.reload();
    fees.reload();
  };

  if (profile.loading || fees.loading) {
    return <Skeleton rows={5} className="flex-1 p-4" />;
  }
  if (profile.error || fees.error || !profile.data || !fees.data) {
    return (
      <div className="p-4">
        <ErrorState
          message={profile.error?.message ?? fees.error?.message ?? "Fee details are unavailable."}
          onRetry={retry}
        />
      </div>
    );
  }

  return <FeeDetails fees={fees.data} student={profile.data} />;
}

function FeeDetails({ fees, student }: { fees: FeeSummary; student: StudentProfile }) {
  const totals = useMemo(
    () =>
      fees.items.reduce(
        (sum, item) => ({
          total: sum.total + item.total,
          paid: sum.paid + item.paid,
          balance: sum.balance + item.balance,
        }),
        { total: 0, paid: 0, balance: 0 },
      ),
    [fees.items],
  );

  const structureRows = useMemo(
    () => [
      ...fees.items.map((item) => ({
        ...item,
        feeType: formatFeeType(item.feeType),
        isTotal: false,
      })),
      {
        feeType: "Total",
        total: totals.total,
        paid: totals.paid,
        balance: totals.balance,
        isTotal: true,
      },
    ],
    [fees.items, totals],
  );

  const structureColumns = [
    {
      key: "feeType",
      header: "Fee Type",
      cell: (row: (typeof structureRows)[number]) => (
        <span className={row.isTotal ? "font-semibold" : ""}>{row.feeType}</span>
      ),
    },
    {
      key: "total",
      header: "Total Fee",
      cell: (row: (typeof structureRows)[number]) => inr.format(row.total),
    },
    {
      key: "paid",
      header: "Paid",
      cell: (row: (typeof structureRows)[number]) => inr.format(row.paid),
    },
    {
      key: "balance",
      header: "Balance",
      cell: (row: (typeof structureRows)[number]) => inr.format(row.balance),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: (typeof structureRows)[number]) =>
        row.isTotal ? null : <StatusChip status={row.balance === 0 ? "Paid" : "Due"} />,
    },
  ];

  const paymentColumns = [
    {
      key: "transactionId",
      header: "Transaction ID",
      cell: (row: FeeSummary["payments"][number]) => row.transactionId,
    },
    {
      key: "feeType",
      header: "Fee Type",
      cell: (row: FeeSummary["payments"][number]) => formatFeeType(row.feeType),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row: FeeSummary["payments"][number]) => inr.format(row.amount),
    },
    {
      key: "date",
      header: "Date",
      cell: (row: FeeSummary["payments"][number]) => row.date,
    },
    {
      key: "receiptNo",
      header: "Receipt No.",
      cell: (row: FeeSummary["payments"][number]) => row.receiptNo,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 lg:overflow-hidden">
      <PageBanner
        title="Student Fee Details"
        subtitle="View your fee structure, payment status and transaction history"
        icon={CreditCard}
        chip={<span className="text-sm text-muted-foreground">View only</span>}
      />
      <section aria-label="Student details" className="erp-surface grid gap-3 p-4 sm:grid-cols-4">
        <StudentDetail label="Roll No" value={student.registerNo} />
        <StudentDetail label="Name" value={student.name} />
        <StudentDetail label="Academic Year" value={student.academicYear} />
        <StudentDetail label="Year" value={`Year ${student.year}`} />
      </section>
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <section className="flex min-h-0 min-w-0 flex-col gap-2">
          <h2 className="shrink-0 text-lg font-semibold text-foreground">Fee Structure</h2>
          <DataTable
            label="Fee structure"
            columns={structureColumns}
            rows={structureRows}
            getRowKey={(row) => row.feeType}
          />
        </section>
        <section className="flex min-h-0 min-w-0 flex-col gap-2">
          <h2 className="flex shrink-0 items-center gap-2 text-lg font-semibold text-foreground">
            <ReceiptText aria-hidden="true" className="size-5 text-violet-300" strokeWidth={1.5} />
            Payment History
          </h2>
          <DataTable
            label="Payment history"
            columns={paymentColumns}
            rows={fees.payments}
            getRowKey={(row) => row.transactionId}
            emptyMessage="No payment transactions are listed."
          />
        </section>
      </div>
      <p className="erp-surface shrink-0 px-4 py-3 text-sm text-muted-foreground">
        To pay your fees, please visit the accounts office.
      </p>
    </div>
  );
}

function StudentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="truncate text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
