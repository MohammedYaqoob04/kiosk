import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, FileText, Printer } from "lucide-react";

import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/assignment")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: AssignmentFrontPage,
  head: () => ({ meta: [{ title: "Assignment Front Page | Student ERP" }] }),
});

function AssignmentFrontPage() {
  const optionsQuery = useApi(["erp", "assignmentOptions"], api.getAssignmentOptions);
  const profileQuery = useApi(["erp", "profile"], api.getProfile);

  const [subjectCode, setSubjectCode] = useState("");
  const [assignmentNumber, setAssignmentNumber] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (optionsQuery.loading || profileQuery.loading) {
    return <Skeleton rows={4} className="flex-1 p-4" />;
  }

  if (optionsQuery.error || !optionsQuery.data) {
    return (
      <div className="p-4">
        <ErrorState
          message={optionsQuery.error?.message ?? "Assignment options are unavailable."}
          onRetry={optionsQuery.reload}
        />
      </div>
    );
  }

  const assignmentOptions = optionsQuery.data;

  const handleGenerate = async () => {
    if (!subjectCode || assignmentNumber === null || generating) return;
    setGenerating(true);
    setGenerateError("");
    try {
      const blob = await api.getAssignmentFrontPageBlob(subjectCode, assignmentNumber);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPreviewOpen(true);
      const openedWindow = window.open(url, "_blank");
      openedWindow?.focus();
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Failed to generate assignment front page.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const win = window.open(pdfUrl, "_blank");
      win?.focus();
    }
  };

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
            {assignmentOptions.subjects.map((subject) => (
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
            {assignmentOptions.assignmentNumbers.map((number) => (
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
      {generateError && (
        <p role="alert" className="text-sm font-semibold text-destructive px-1">
          {generateError}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={!subjectCode || assignmentNumber === null || generating}
          onClick={handleGenerate}
          className="min-h-14 px-6 text-base font-semibold"
        >
          {generating ? "Generating PDF…" : "Generate PDF"}
        </Button>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90svh] w-[min(90vw,50rem)] max-w-4xl overflow-y-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
            <DialogDescription>
              Assignment Front Page · {subjectCode} (Assignment {assignmentNumber})
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="Assignment Front Page Preview"
                className="h-[60vh] w-full rounded-xl border border-border bg-white"
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground">Loading preview…</p>
            )}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                className="min-h-12 gap-2 text-base font-semibold"
              >
                <Printer aria-hidden="true" className="size-4" />
                Open / Print
              </Button>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  download={`assignment-${subjectCode}-${assignmentNumber}.pdf`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground"
                >
                  <ExternalLink aria-hidden="true" className="size-4" />
                  Download PDF
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
