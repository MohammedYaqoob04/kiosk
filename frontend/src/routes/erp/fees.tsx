import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, ReceiptText } from "lucide-react";

import { api } from "@/api";
import { useApi } from "@/api/use-api";
import type { FeeSummary, StudentProfile } from "@/api";
import { DataTable } from "@/components/erp/DataTable";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/fees")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: FeesPage,
  head: () => ({ meta: [{ title: "Student Fee Details | Arunai ERP" }] }),
});

const inr = new Intl.NumberFormat("en-IN", {
  minimumIntegerDigits: 1,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatFeeType(value: string): string {
  const labels: Record<string, string> = {
    tuition_fee: "Tuition Fee",
    transport_fee: "Transport Fee",
    development_fee: "Development Fee",
  };
  return (
    labels[value] ?? value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatAmount(value: number): string {
  return `₹ ${inr.format(value)}`;
}

function FeesPage() {
  const feesQuery = useApi(["erp", "fees"], api.getFees);
  const profileQuery = useApi(["erp", "profile"], api.getProfile);

  if (feesQuery.loading || profileQuery.loading) {
    return <Skeleton rows={5} className="flex-1 p-4" />;
  }

  if (feesQuery.error || profileQuery.error || !feesQuery.data || !profileQuery.data) {
    return (
      <div className="p-4">
        <ErrorState
          message={
            feesQuery.error?.message ??
            profileQuery.error?.message ??
            "Fee details are unavailable."
          }
          onRetry={() => {
            feesQuery.reload();
            profileQuery.reload();
          }}
        />
      </div>
    );
  }

  return <FeeDetails fees={feesQuery.data} student={profileQuery.data} />;
}

function FeeDetails({ fees, student }: { fees: FeeSummary; student: StudentProfile }) {
  const structureColumns = [
    {
      key: "feeType",
      header: "FEE TYPE",
      cell: (row: FeeSummary["items"][number]) => formatFeeType(row.feeType),
    },
    {
      key: "total",
      header: "TOTAL FEE",
      cell: (row: FeeSummary["items"][number]) => formatAmount(row.total),
    },
    {
      key: "paid",
      header: "PAID",
      cell: (row: FeeSummary["items"][number]) => formatAmount(row.paid),
    },
    {
      key: "balance",
      header: "BALANCE",
      cell: (row: FeeSummary["items"][number]) => formatAmount(row.balance),
    },
    {
      key: "action",
      header: "ACTION",
      cell: () => (
        <Button type="button" variant="outline" disabled className="min-h-14 whitespace-nowrap">
          Pay at accounts office
        </Button>
      ),
    },
  ];

  const paymentColumns = [
    {
      key: "transactionId",
      header: "TRANSACTION ID",
      cell: (row: FeeSummary["payments"][number]) => row.transactionId,
    },
    {
      key: "feeType",
      header: "FEE TYPE",
      cell: (row: FeeSummary["payments"][number]) => formatFeeType(row.feeType),
    },
    {
      key: "amount",
      header: "AMOUNT",
      cell: (row: FeeSummary["payments"][number]) => formatAmount(row.amount),
    },
    {
      key: "date",
      header: "DATE",
      cell: (row: FeeSummary["payments"][number]) => row.date,
    },
    {
      key: "receiptNo",
      header: "RECEIPT NO.",
      cell: (row: FeeSummary["payments"][number]) => row.receiptNo,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 lg:overflow-hidden">
      <PageBanner
        title="Student Fee Details"
        subtitle="View your fee structure, payment status and transaction history"
        icon={CreditCard}
      />
      <section aria-label="Student details" className="erp-surface grid gap-3 p-4 sm:grid-cols-4">
        <h2 className="text-lg font-semibold text-foreground sm:col-span-4">Student Details</h2>
        <StudentDetail label="ROLL" value={student.registerNo} />
        <StudentDetail label="NAME" value={student.name} />
        <StudentDetail label="ACADEMIC YEAR" value={student.academicYear} />
        <StudentDetail label="YEAR" value={`Year ${student.year}`} />
      </section>
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <section className="flex min-h-0 min-w-0 flex-col gap-2">
          <h2 className="shrink-0 text-lg font-semibold text-foreground">Fee Structure</h2>
          <DataTable
            label="Fee structure"
            columns={structureColumns}
            rows={fees.items}
            getRowKey={(row) => row.feeType}
          />
        </section>
        <section className="flex min-h-0 min-w-0 flex-col gap-2">
          <h2 className="flex shrink-0 items-center gap-2 text-lg font-semibold text-foreground">
            <ReceiptText aria-hidden="true" className="size-5 text-accent" strokeWidth={1.5} />
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
