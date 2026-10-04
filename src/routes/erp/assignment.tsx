import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Printer } from "lucide-react";

import { api, isMockApi } from "@/api";
import { useApi } from "@/api/use-api";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/assignment")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: AssignmentFrontPage,
  head: () => ({ meta: [{ title: "Assignment Front Page | Student ERP" }] }),
});

function AssignmentFrontPage() {
  const profile = useApi(["erp", "profile"], api.getProfile);
  const options = useApi(["erp", "assignment-options"], api.getAssignmentOptions);
  const [subjectCode, setSubjectCode] = useState("");
  const [assignmentNumber, setAssignmentNumber] = useState<number | null>(null);
  const [generated, setGenerated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!subjectCode || assignmentNumber === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createAssignmentFrontPage(subjectCode, assignmentNumber);
      setGenerated(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not generate the front page.");
    } finally {
      setSubmitting(false);
    }
  };

  if (profile.loading || options.loading) return <Skeleton rows={4} className="flex-1 p-4" />;
  if (profile.error || options.error || !profile.data || !options.data) {
    return (
      <div className="p-4">
        <ErrorState
          message={
            profile.error?.message ??
            options.error?.message ??
            "Assignment options are unavailable."
          }
          onRetry={() => {
            profile.reload();
            options.reload();
          }}
        />
      </div>
    );
  }

  const selectedSubject = options.data.subjects.find((subject) => subject.code === subjectCode);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
      <PageBanner
        title="Assignment Front Page"
        subtitle="Select your subject and assignment to generate the PDF"
        icon={FileText}
      />
      <section className="erp-surface grid gap-5 p-4 lg:grid-cols-2">
        <fieldset className="min-w-0">
          <legend className="mb-3 text-lg font-semibold text-foreground">Subject</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.data.subjects.map((subject) => (
              <button
                key={subject.code}
                type="button"
                aria-pressed={subject.code === subjectCode}
                onClick={() => {
                  setSubjectCode(subject.code);
                  setGenerated(false);
                }}
                className={`flex min-h-16 items-center gap-3 rounded-xl border px-4 text-left active:bg-white/10 ${
                  subject.code === subjectCode
                    ? "border-rose-300/40 bg-rose-400/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <span className="shrink-0 text-base font-semibold text-rose-200">
                  {subject.code}
                </span>
                <span className="text-sm text-foreground">{subject.name}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-lg font-semibold text-foreground">Assignment Number</legend>
          <div className="flex flex-wrap gap-2">
            {options.data.assignmentNumbers.map((number) => (
              <button
                key={number}
                type="button"
                aria-pressed={number === assignmentNumber}
                onClick={() => {
                  setAssignmentNumber(number);
                  setGenerated(false);
                }}
                className={`min-h-14 min-w-16 rounded-xl border px-5 text-base font-semibold active:bg-white/10 ${
                  number === assignmentNumber
                    ? "border-violet-300/40 bg-violet-400/10 text-violet-200"
                    : "border-white/10 bg-white/[0.03] text-foreground"
                }`}
              >
                {number}
              </button>
            ))}
          </div>
        </fieldset>
      </section>
      <p className="erp-surface text-sm text-muted-foreground p-4">
        Select the required subject and assignment number, then tap Generate PDF to create your
        assignment front page.
      </p>
      {error && (
        <p role="alert" className="text-base text-rose-200">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={!subjectCode || assignmentNumber === null || submitting}
          onClick={() => void generate()}
          className="min-h-14 px-6 text-base font-semibold"
        >
          {submitting ? "Generating…" : "Generate PDF"}
        </Button>
        {generated && isMockApi && (
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="min-h-14 gap-2 px-5 text-base"
          >
            <Printer aria-hidden="true" className="size-5" />
            Print or Save PDF
          </Button>
        )}
      </div>
      {generated && isMockApi && selectedSubject && assignmentNumber !== null && (
        <article className="assignment-print-page mx-auto flex min-h-[680px] w-full max-w-[560px] flex-col items-center border border-white/10 bg-white p-10 text-center text-black shadow-xl">
          <p className="mt-8 text-xl font-bold uppercase tracking-wide">
            Arunai Engineering College
          </p>
          <p className="mt-2 text-base">Assignment Front Page</p>
          <div className="my-16 w-full border-y border-black/20 py-12">
            <p className="text-lg font-semibold">{selectedSubject.code}</p>
            <h2 className="mt-3 text-2xl font-bold">{selectedSubject.name}</h2>
            <p className="mt-8 text-lg">Assignment Number {assignmentNumber}</p>
          </div>
          <dl className="mt-auto grid w-full gap-4 text-left text-base">
            <div>
              <dt className="font-semibold">Student Name</dt>
              <dd>{profile.data.name}</dd>
            </div>
            <div>
              <dt className="font-semibold">Register No.</dt>
              <dd>{profile.data.registerNo}</dd>
            </div>
            <div>
              <dt className="font-semibold">Department</dt>
              <dd>{profile.data.department}</dd>
            </div>
            <div>
              <dt className="font-semibold">Semester</dt>
              <dd>{profile.data.semester}</dd>
            </div>
          </dl>
          <p className="mt-12 text-sm">Sample layout — official format to be confirmed.</p>
        </article>
      )}
    </div>
  );
}
