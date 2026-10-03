import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { demoFees } from "@/mock/erp";

export const Route = createFileRoute("/erp/fees")({
  component: FeesPage,
  head: () => ({ meta: [{ title: "Fees | Student ERP" }] }),
});

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function FeesPage() {
  const totalDue = demoFees.reduce((total, fee) => total + fee.amount - fee.paid, 0);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader title="Fees" description="Fee details · View only · Sample data" />

      <section
        aria-label="Total fees due"
        className="mb-6 rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <p className="text-lg text-muted-foreground">Total due</p>
        <p className="mt-1 font-display text-3xl font-bold text-foreground">
          {inr.format(totalDue)}
        </p>
        <p className="mt-2 text-lg text-muted-foreground">
          Demo balance · No payment actions available
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">Fee details</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-lg text-muted-foreground">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Fee item
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Semester
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Amount
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Paid
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Due
                </th>
                <th scope="col" className="py-3 font-medium">
                  Due date
                </th>
              </tr>
            </thead>
            <tbody>
              {demoFees.map((fee) => {
                const due = fee.amount - fee.paid;
                return (
                  <tr key={fee.item} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-lg text-foreground">{fee.item}</td>
                    <td className="py-3 pr-4 text-lg text-foreground">{fee.semester}</td>
                    <td className="py-3 pr-4 text-lg text-foreground">{inr.format(fee.amount)}</td>
                    <td className="py-3 pr-4 text-lg text-foreground">{inr.format(fee.paid)}</td>
                    <td className="py-3 pr-4 text-lg font-semibold text-foreground">
                      {inr.format(due)}
                    </td>
                    <td className="py-3 text-lg text-muted-foreground">{fee.dueDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
