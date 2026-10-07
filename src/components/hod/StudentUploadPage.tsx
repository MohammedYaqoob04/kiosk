import { useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Info, Loader2, Upload, UserCheck, X } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { Button } from "@/components/ui/button";
import { api, formatServerError } from "@/api";
import { useApi } from "@/api/use-api";
import type { StudentImportResponse } from "@/api/types";

export function StudentUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedCounsellor, setSelectedCounsellor] = useState("");
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [checkResult, setCheckResult] = useState<StudentImportResponse | null>(null);
  const [importResult, setImportResult] = useState<StudentImportResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const counsellorsQuery = useApi(["hodCounsellors"], () => api.getHodCounsellors());
  const counsellorsList = counsellorsQuery.data ?? [];

  const onFileChange = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const selected = incoming[0];
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setErrorMessage("Please select a valid Excel spreadsheet (.xlsx).");
      return;
    }
    setFile(selected);
    setCheckResult(null);
    setImportResult(null);
    setErrorMessage("");
  };

  const removeFile = () => {
    setFile(null);
    setCheckResult(null);
    setImportResult(null);
    setErrorMessage("");
  };

  const onCheckSheet = async () => {
    if (!file || checking || importing) return;
    setChecking(true);
    setErrorMessage("");
    setImportResult(null);
    try {
      const res = await api.importStudents(file, true);
      setCheckResult(res);
    } catch (err) {
      setErrorMessage(formatServerError(err, "Failed to validate student sheet."));
    } finally {
      setChecking(false);
    }
  };

  const onImport = async () => {
    if (!file || checking || importing || !checkResult || checkResult.errors.length > 0) return;
    setImporting(true);
    setErrorMessage("");
    try {
      const res = await api.importStudents(
        file,
        false,
        selectedCounsellor ? selectedCounsellor : undefined,
      );
      setImportResult(res);
    } catch (err) {
      setErrorMessage(formatServerError(err, "Failed to import students."));
    } finally {
      setImporting(false);
    }
  };

  const canImport = Boolean(file && checkResult && checkResult.errors.length === 0 && !checking && !importing);

  return (
    <div className="staff-portal-page flex flex-col gap-4 p-4 sm:p-6 overflow-y-auto">
      <PageBanner
        title="Upload Students"
        subtitle="Import and enroll students from an Excel (.xlsx) sheet"
        icon={FileSpreadsheet}
      />

      {/* Explanatory Info Card */}
      <section className="erp-surface rounded-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.5} />
          <div className="grid gap-1.5 text-sm text-foreground">
            <h2 className="font-semibold text-foreground">Student Login & Account Information</h2>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              <li>
                <strong className="text-foreground">Username:</strong> 12-digit register number starting with{" "}
                <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">5104</code> (e.g.{" "}
                <span className="font-mono">5104XXXXXXXX</span>).
              </li>
              <li>
                <strong className="text-foreground">Initial Password:</strong> Date of birth in{" "}
                <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">ddmmyyyy</code> format (e.g.{" "}
                <span className="font-mono">14052006</span>).
              </li>
              <li>
                <strong className="text-foreground">First Login:</strong> Students must change their password on first login
                before they can access student dashboard services.
              </li>
              <li>
                <strong className="text-foreground">Privacy Protection:</strong> Sensitive columns like Aadhaar, Community,
                Religion, and Parent Income are automatically ignored and never stored in the database.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Upload and Configuration Form */}
      <section className="erp-surface grid gap-4 p-4">
        <h2 className="text-lg font-semibold text-foreground">Select Spreadsheet</h2>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            {!file ? (
              <label className="inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface px-4 font-medium text-foreground hover:bg-surface-2">
                <Upload className="size-5 text-accent" strokeWidth={1.5} />
                <span>Choose .xlsx file</span>
                <input
                  type="file"
                  accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="sr-only"
                  onChange={(e) => onFileChange(e.target.files)}
                />
              </label>
            ) : (
              <div className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-4 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileSpreadsheet className="size-5 shrink-0 text-accent" strokeWidth={1.5} />
                  <span className="truncate font-medium text-foreground">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Remove selected file"
                  disabled={checking || importing}
                  onClick={removeFile}
                  className="grid size-10 place-items-center rounded-lg border border-border bg-surface hover:bg-surface-2 disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!file || checking || importing}
              onClick={onCheckSheet}
              className="min-h-14 gap-2 px-5 font-semibold"
            >
              {checking ? <Loader2 className="size-4 animate-spin" /> : null}
              {checking ? "Checking sheet…" : "Check sheet"}
            </Button>
          </div>
        </div>

        {/* Optional Counsellor Assignment Selector */}
        <div className="grid max-w-xl gap-2">
          <label htmlFor="assignToSelect" className="text-sm font-semibold text-foreground">
            Assign imported students to counsellor (Optional)
          </label>
          <select
            id="assignToSelect"
            value={selectedCounsellor}
            onChange={(e) => setSelectedCounsellor(e.target.value)}
            disabled={checking || importing}
            className="min-h-14 rounded-lg border border-border bg-surface px-3 text-foreground"
          >
            <option value="">Do not assign (Keep unassigned)</option>
            {counsellorsList.map((c) => {
              const cid = c.staffId || c.id;
              return (
                <option key={cid} value={cid}>
                  {c.name} ({cid})
                </option>
              );
            })}
          </select>
        </div>

        {errorMessage && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm font-medium text-danger">
            <AlertCircle className="size-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </section>

      {/* Checking & Validation Feedback Section */}
      {checkResult && (
        <section className="erp-surface grid gap-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Validation Results</h2>
              <p className="text-sm text-muted-foreground">
                Read <strong>{checkResult.rowsRead}</strong> student record{checkResult.rowsRead === 1 ? "" : "s"} from the sheet.
              </p>
            </div>
            {checkResult.errors.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 text-sm font-semibold text-ok">
                <CheckCircle2 className="size-4" />
                Sheet is ready to import
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-sm font-semibold text-danger">
                <AlertCircle className="size-4" />
                {checkResult.errors.length} error{checkResult.errors.length === 1 ? "" : "s"} found
              </span>
            )}
          </div>

          {/* Ignored Sensitive Columns Notice */}
          {checkResult.ignoredSensitiveColumns && checkResult.ignoredSensitiveColumns.length > 0 && (
            <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
              <span className="font-semibold text-foreground">Ignored sensitive columns: </span>
              <span className="text-muted-foreground">
                {checkResult.ignoredSensitiveColumns.join(", ")}
              </span>
              <p className="mt-1 text-xs text-muted-foreground italic">
                (these columns are never stored)
              </p>
            </div>
          )}

          {/* Warnings List */}
          {checkResult.warnings && checkResult.warnings.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-3 text-sm">
              <h3 className="font-semibold text-foreground">Warnings:</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {checkResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Errors Table */}
          {checkResult.errors.length > 0 ? (
            <div className="grid gap-2">
              <h3 className="font-semibold text-danger">Errors to resolve:</h3>
              <div className="max-h-80 overflow-auto rounded-lg border border-border">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-surface-2 text-sm text-foreground">
                    <tr>
                      <th scope="col" className="border-b border-border p-3 w-28">Row #</th>
                      <th scope="col" className="border-b border-border p-3">Issue Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkResult.errors.map((err, idx) => (
                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-surface-2">
                        <td className="p-3 font-mono text-sm font-semibold text-foreground">
                          {err.row > 0 ? `Row ${err.row}` : "General"}
                        </td>
                        <td className="p-3 text-sm text-danger">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground">
                Please update the spreadsheet to fix these rows and click <strong>Check sheet</strong> again.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-ok/20 bg-ok/5 p-4">
              <p className="text-sm font-medium text-foreground">
                All validation checks passed with zero errors. Click below to begin importing.
              </p>
              <div>
                <Button
                  type="button"
                  disabled={!canImport || importing}
                  onClick={onImport}
                  className="min-h-14 gap-2 px-6 font-semibold"
                >
                  {importing ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
                  {importing ? "Importing students…" : "Import"}
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Progress State while Importing */}
      {importing && (
        <section className="erp-surface flex flex-col items-center justify-center gap-3 p-8 text-center" role="status">
          <Loader2 className="size-8 animate-spin text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Importing students…</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Processing and creating student accounts. This can take up to a minute. Please do not close or navigate away from this page.
          </p>
        </section>
      )}

      {/* Import Completion Summary */}
      {importResult && (
        <section className="erp-surface grid gap-4 p-6" role="status">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-7 text-ok" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Import Completed Successfully</h2>
              <p className="text-sm text-muted-foreground">Student records have been processed and enrolled.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <span className="text-sm text-muted-foreground">Created</span>
              <p className="text-2xl font-bold text-foreground">{importResult.created}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <span className="text-sm text-muted-foreground">Updated</span>
              <p className="text-2xl font-bold text-foreground">{importResult.updated}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <span className="text-sm text-muted-foreground">Assigned to Counsellor</span>
              <p className="text-2xl font-bold text-foreground">{importResult.assigned}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
