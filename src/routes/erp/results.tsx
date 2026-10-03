import { createFileRoute } from "@tanstack/react-router";

import { SemesterResults } from "@/components/semester-results";

export const Route = createFileRoute("/erp/results")({
  component: ResultsPage,
  head: () => ({ meta: [{ title: "Results | Student ERP" }] }),
});

function ResultsPage() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-8 sm:py-8">
      <SemesterResults />
    </div>
  );
}
