import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requireAuth } from "@/lib/require-auth";
import { fakeAssignmentOptions, fakeProfile } from "@/lib/erpData";

export const Route = createFileRoute("/erp/assignment")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: AssignmentFrontPage,
  head: () => ({ meta: [{ title: "Assignment Front Page | Student ERP" }] }),
});

function AssignmentFrontPage() {
  const [subjectCode, setSubjectCode] = useState("");
  const [assignmentNumber, setAssignmentNumber] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedSubject = fakeAssignmentOptions.subjects.find(
    (subject) => subject.code === subjectCode,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 lg:overflow-hidden">
      <PageBanner
        title="Assignment Front Page"
        subtitle="Select your subject and assignment to generate the PDF"
        icon={FileText}
      />
      <section className="erp-surface grid gap-5 p-4 lg:grid-cols-2">
        <label className="grid gap-2 text-base font-semibold text-foreground">
          Select Subject
          <select
            value={subjectCode}
            onChange={(event) => setSubjectCode(event.currentTarget.value)}
            className="min-h-14 rounded-lg border border-border bg-surface px-4 text-base font-normal text-foreground"
          >
            <option value="">-- Select Subject --</option>
            {fakeAssignmentOptions.subjects.map((subject) => (
              <option key={subject.code} value={subject.code}>
                {subject.code} · {subject.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-base font-semibold text-foreground">
          Select Assignment Number
          <select
            value={assignmentNumber ?? ""}
            onChange={(event) =>
              setAssignmentNumber(
                event.currentTarget.value ? Number(event.currentTarget.value) : null,
              )
            }
            className="min-h-14 rounded-lg border border-border bg-surface px-4 text-base font-normal text-foreground"
          >
            <option value="">-- Select Assignment --</option>
            {fakeAssignmentOptions.assignmentNumbers.map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </label>
      </section>
      <p className="erp-surface text-sm text-muted-foreground p-4">
        Select the required subject and assignment number, then click Generate PDF to create your
        assignment front page.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={!subjectCode || assignmentNumber === null}
          onClick={() => setPreviewOpen(true)}
          className="min-h-14 px-6 text-base font-semibold"
        >
          Generate PDF
        </Button>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
            <DialogDescription>Assignment Front Page · Preview only</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 rounded-xl border border-border bg-surface p-6 text-center">
            <p className="font-semibold">Arunai Engineering College (Autonomous)</p>
            <h2 className="text-xl font-semibold">Assignment Front Page</h2>
            <p>
              {selectedSubject?.code} · {selectedSubject?.name}
            </p>
            <p>Assignment Number {assignmentNumber}</p>
            <p>
              {fakeProfile.name} · {fakeProfile.registerNo}
            </p>
            <p className="text-sm text-muted-foreground">
              No printer or file destination is configured. This is a mock preview only.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
