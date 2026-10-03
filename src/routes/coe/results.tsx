import { createFileRoute } from "@tanstack/react-router";

import { SemesterResults } from "@/components/semester-results";

export const Route = createFileRoute("/coe/results")({
  component: CoeResultsPage,
  head: () => ({ meta: [{ title: "Results | Controller of Examinations" }] }),
});

function CoeResultsPage() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-8 sm:py-8">
      <SemesterResults eyebrow="Controller of Examinations · Sample data" />
    </div>
  );
}
