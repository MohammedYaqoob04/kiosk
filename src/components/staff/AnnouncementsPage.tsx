import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FileText, Loader2, Megaphone, X } from "lucide-react";

import { TouchTextInput } from "@/components/TouchTextInput";
import { PageBanner } from "@/components/erp/PageBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { api, isMockApi } from "@/api";
import { useApi } from "@/api/use-api";
import type { NoticeAttachmentResponse, NoticeInboxItem, NoticeSentItem } from "@/api/types";
import {
  noticeAudienceSelection,
  noticeCategories,
  subscribeToNotices,
  type NoticeAudience,
  type NoticeCategory,
  type NoticeRole,
} from "@/lib/noticeStore";
import { listAllStudents, listStudents } from "@/lib/staffData";

type Tab = "compose" | "sent" | "from-hod";

const attachmentTypes = ["application/pdf", "image/jpeg", "image/png"] as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function AnnouncementsPage({ role }: { role: NoticeRole }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("compose");

  const sentQuery = useApi(["sentNotices"], () => api.getSentNotices());
  const hodInboxQuery = useApi(["hodInboxNotices"], () => api.getNoticeInbox(), {
    enabled: role === "COUNSELLOR",
  });
  const studentsQuery = useApi(
    ["staffNoticeStudents", role],
    () => (role === "COUNSELLOR" ? api.getAssignedStudents() : api.getHodStudents()),
  );

  useEffect(() => {
    if (!isMockApi) return;
    return subscribeToNotices(() => {
      sentQuery.reload();
      hodInboxQuery.reload();
    });
  }, [sentQuery.reload, hodInboxQuery.reload]);

  const students = useMemo(() => {
    if (studentsQuery.data && studentsQuery.data.length > 0) {
      return studentsQuery.data.map((s) => ({
        regNo: s.registerNo,
        name: s.name,
        section: s.section,
      }));
    }
    return role === "COUNSELLOR" ? listStudents(user?.id ?? "") : listAllStudents();
  }, [role, studentsQuery.data, user?.id]);

  const sent = sentQuery.data ?? [];
  const inbox = hodInboxQuery.data ?? [];

  return (
    <div className="staff-portal-page">
      <PageBanner
        title="Announcements"
        subtitle="Send one-way notices and circulars"
        icon={Megaphone}
        chip={<span className="text-sm text-muted-foreground">{sent.length} sent</span>}
      />
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Announcements">
        {([
          ["compose", "Compose"],
          ["sent", "Sent"],
          ...(role === "COUNSELLOR" ? [["from-hod", "From HOD"] as const] : []),
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`min-h-14 rounded-lg border px-4 font-medium ${
              tab === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "compose" && user && (
        <ComposeNotice
          role={role}
          authorId={user.id}
          authorName={user.name}
          students={students}
          onSent={() => {
            sentQuery.reload();
            setTab("sent");
          }}
        />
      )}
      {tab === "sent" && (
        <NoticeList
          notices={sent}
          empty="No notices sent yet."
          loading={sentQuery.loading}
          error={sentQuery.error?.message}
          allowWithdraw
          allowPin={role === "HOD"}
          onReload={() => sentQuery.reload()}
        />
      )}
      {tab === "from-hod" && role === "COUNSELLOR" && (
        <NoticeList
          notices={inbox}
          empty="No notices from HOD."
          loading={hodInboxQuery.loading}
          error={hodInboxQuery.error?.message}
          allowWithdraw={false}
          allowPin={false}
          onReload={() => hodInboxQuery.reload()}
        />
      )}
    </div>
  );
}

function ComposeNotice({
  role,
  authorId: _authorId,
  authorName: _authorName,
  students,
  onSent,
}: {
  role: NoticeRole;
  authorId: string;
  authorName: string;
  students?: Array<{ regNo: string; name: string; section?: string }>;
  onSent?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("Notice");
  const [audience, setAudience] = useState<NoticeAudience>(
    role === "COUNSELLOR" ? "MY_STUDENTS" : "ALL_STUDENTS",
  );
  const [selectedRegNos, setSelectedRegNos] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [preview, setPreview] = useState<{
    name: string;
    type: string;
    blobUrl: string;
  } | null>(null);

  const isSelectedAudience = audience.startsWith("SELECTED_STUDENTS:");
  const selectedAudience = noticeAudienceSelection(selectedRegNos);
  const currentAudience =
    role === "COUNSELLOR" && isSelectedAudience ? selectedAudience : audience;
  const isValid =
    title.trim().length > 0 &&
    title.trim().length <= 80 &&
    body.trim().length > 0 &&
    body.trim().length <= 1500 &&
    files.length <= 3 &&
    (!isSelectedAudience || selectedRegNos.length > 0);

  const upload = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList);
    if (files.length + incoming.length > 3) {
      setError("Attach no more than 3 files.");
      return;
    }
    if (
      incoming.some(
        (file) => !attachmentTypes.includes(file.type as (typeof attachmentTypes)[number]),
      )
    ) {
      setError("Attachments must be PDF, JPG, or PNG files.");
      return;
    }
    if (incoming.some((file) => file.size <= 0 || file.size > 2 * 1024 * 1024)) {
      setError("Each attachment must be no larger than 2 MB.");
      return;
    }
    setFiles((current) => [...current, ...incoming]);
    setError("");
  };

  const previewDraftFile = (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    setPreview({
      name: file.name,
      type: file.type,
      blobUrl,
    });
  };

  const closePreview = () => {
    if (preview?.blobUrl) {
      URL.revokeObjectURL(preview.blobUrl);
    }
    setPreview(null);
  };

  const send = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError("");
    setConfirmation("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("body", body.trim());
      formData.append("category", category);
      formData.append("audience", currentAudience);
      if (expiresAt) {
        formData.append("expiresAt", expiresAt);
      }
      if (role === "HOD" && pinned) {
        formData.append("pinned", "true");
      }
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await api.createNotice(formData);
      setConfirmation(`Sent to ${res.recipientCount} recipients.`);
      setTitle("");
      setBody("");
      setFiles([]);
      setSelectedRegNos([]);
      setExpiresAt("");
      setPinned(false);
      onSent?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The notice could not be sent.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="erp-surface grid min-h-0 flex-1 gap-4 overflow-auto p-4">
      <div className="grid gap-1">
        <TouchTextInput label="Title" value={title} onChange={setTitle} maxLength={80} />
        <p className="text-right text-sm text-muted-foreground">{title.length}/80</p>
      </div>
      <div className="grid gap-1">
        <TouchTextInput
          label="Message"
          value={body}
          onChange={setBody}
          maxLength={1500}
          multiline
        />
        <p className="text-right text-sm text-muted-foreground">{body.length}/1500</p>
      </div>
      <fieldset className="grid gap-2">
        <legend className="font-semibold text-foreground">Category</legend>
        <div className="flex flex-wrap gap-2">
          {noticeCategories.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={`min-h-14 rounded-lg border px-4 ${
                category === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="grid max-w-lg gap-2 font-semibold text-foreground">
        Audience
        <select
          value={audience}
          onChange={(event) => setAudience(event.target.value as NoticeAudience)}
          className="min-h-14 rounded-lg border border-border bg-surface px-3"
        >
          {role === "COUNSELLOR" ? (
            <>
              <option value="MY_STUDENTS">My Students</option>
              <option value="SELECTED_STUDENTS:">Pick students</option>
            </>
          ) : (
            <>
              <option value="ALL_STUDENTS">All students</option>
              <option value="SECTION:A">Section A</option>
              <option value="SECTION:B">Section B</option>
              <option value="ALL_COUNSELLORS">All counsellors</option>
              <option value="SELECTED_STUDENTS:">Pick students</option>
            </>
          )}
        </select>
      </label>
      {isSelectedAudience && students && (
        <fieldset className="grid max-h-56 gap-1 overflow-auto rounded-xl border border-border p-3">
          <legend className="px-1 font-semibold text-foreground">Choose students</legend>
          {students.map((student) => (
            <label key={student.regNo} className="flex min-h-14 items-center gap-3 px-2">
              <input
                type="checkbox"
                checked={selectedRegNos.includes(student.regNo)}
                onChange={(event) =>
                  setSelectedRegNos((current) =>
                    event.target.checked
                      ? [...current, student.regNo]
                      : current.filter((regNo) => regNo !== student.regNo),
                  )
                }
                className="size-5 accent-primary"
              />
              <span>
                {student.name} · {student.regNo}
              </span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid max-w-lg gap-2 font-semibold text-foreground">
          Optional expiry date
          <input
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="min-h-14 rounded-lg border border-border bg-surface px-3 font-normal"
          />
        </label>
        {role === "HOD" && (
          <label className="flex min-h-14 items-center gap-3">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
              className="size-5 accent-primary"
            />
            Pin notice
          </label>
        )}
      </div>
      <div className="grid gap-2">
        <label className="inline-flex min-h-14 w-fit cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 font-medium text-foreground hover:bg-surface-2">
          <FileText aria-hidden="true" className="size-5" strokeWidth={1.5} />
          Attach files
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            multiple
            className="sr-only"
            onChange={(event) => {
              upload(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="flex min-h-14 items-center gap-3">
            <button
              type="button"
              onClick={() => previewDraftFile(file)}
              className="min-h-14 flex-1 text-left underline"
            >
              {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </button>
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
              className="grid size-14 place-items-center rounded-lg border border-border hover:bg-surface-2"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {confirmation && (
        <p role="status" className="text-sm font-semibold text-ok">
          {confirmation}
        </p>
      )}
      <Button
        type="button"
        onClick={send}
        disabled={!isValid || submitting}
        className="min-h-14 w-fit"
      >
        {submitting ? "Sending…" : "Send"}
      </Button>
      <AttachmentPreview preview={preview} onClose={closePreview} />
    </section>
  );
}

function NoticeList({
  notices,
  empty,
  loading = false,
  error,
  allowWithdraw = false,
  allowPin = false,
  onReload,
}: {
  notices: Array<NoticeSentItem | NoticeInboxItem>;
  empty: string;
  loading?: boolean;
  error?: string | null | undefined;
  allowWithdraw?: boolean;
  allowPin?: boolean;
  onReload?: () => void;
}) {
  const [actionError, setActionError] = useState("");
  const [activePreview, setActivePreview] = useState<{
    name: string;
    type: string;
    blobUrl: string;
  } | null>(null);
  const [loadingAttachmentId, setLoadingAttachmentId] = useState<string | number | null>(null);

  const handleWithdraw = async (id: number | string) => {
    setActionError("");
    try {
      await api.withdrawNotice(id);
      onReload?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not withdraw notice.");
    }
  };

  const handleTogglePin = async (id: number | string, nextPin: boolean) => {
    setActionError("");
    try {
      await api.pinNotice(id, nextPin);
      onReload?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update pin.");
    }
  };

  const openRemoteAttachment = async (
    noticeId: number | string,
    attachment: NoticeAttachmentResponse,
  ) => {
    setLoadingAttachmentId(attachment.id);
    setActionError("");
    try {
      const blob = attachment.url
        ? await api.getBlob(attachment.url)
        : await api.getNoticeAttachmentBlob(noticeId, attachment.id);
      const blobUrl = URL.createObjectURL(blob);
      setActivePreview({
        name: attachment.name,
        type: attachment.type,
        blobUrl,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to load attachment.");
    } finally {
      setLoadingAttachmentId(null);
    }
  };

  const closePreview = () => {
    if (activePreview?.blobUrl) {
      URL.revokeObjectURL(activePreview.blobUrl);
    }
    setActivePreview(null);
  };

  return (
    <section className="min-h-0 flex-1 overflow-auto">
      {loading && notices.length === 0 ? (
        <div className="erp-surface grid min-h-40 place-items-center p-6 text-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p className="mt-2 text-sm">Loading notices…</p>
        </div>
      ) : error ? (
        <div className="erp-surface flex flex-col items-center justify-center gap-3 p-6 text-center text-danger">
          <AlertCircle className="size-8" />
          <p className="font-semibold">{error}</p>
          {onReload && (
            <Button type="button" variant="outline" onClick={onReload}>
              Try again
            </Button>
          )}
        </div>
      ) : notices.length === 0 ? (
        <div className="erp-surface grid min-h-40 place-items-center p-6 text-center text-muted-foreground">
          {empty}
        </div>
      ) : (
        <ul className="grid gap-3">
          {notices.map((notice) => {
            const isSent = "recipientCount" in notice;
            const sentItem = isSent ? (notice as NoticeSentItem) : null;
            return (
              <li key={notice.id} className="erp-surface grid gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{notice.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notice.category} · {formatDate(notice.createdAt)}
                      {sentItem && ` · ${sentItem.readCount} of ${sentItem.recipientCount} read`}
                      {sentItem?.expired && " · Expired"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notice.pinned && (
                      <span className="rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                        Pinned
                      </span>
                    )}
                    {sentItem?.withdrawn && (
                      <span className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
                        Withdrawn
                      </span>
                    )}
                    {allowPin && (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(notice.id, !notice.pinned)}
                        className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-surface-2"
                      >
                        {notice.pinned ? "Unpin" : "Pin"}
                      </button>
                    )}
                  </div>
                </div>
                {"body" in notice && notice.body && (
                  <p className="whitespace-pre-wrap text-sm text-foreground">{notice.body}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  To {notice.audience.replaceAll("_", " ").replace(":", " · ")}
                </p>
                {notice.attachments && notice.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {notice.attachments.map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        disabled={loadingAttachmentId === att.id}
                        onClick={() => openRemoteAttachment(notice.id, att)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
                      >
                        <FileText aria-hidden="true" className="size-4" strokeWidth={1.5} />
                        <span>{att.name}</span>
                        {loadingAttachmentId === att.id && (
                          <Loader2 className="ml-1 size-3 animate-spin" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {allowWithdraw && !sentItem?.withdrawn && (
                  <button
                    type="button"
                    onClick={() => handleWithdraw(notice.id)}
                    className="min-h-14 w-fit rounded-lg border border-border px-4 font-medium hover:bg-surface-2"
                  >
                    Withdraw
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {actionError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {actionError}
        </p>
      )}
      <AttachmentPreview preview={activePreview} onClose={closePreview} />
    </section>
  );
}

function AttachmentPreview({
  preview,
  onClose,
}: {
  preview: { name: string; type: string; blobUrl: string } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={preview !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] max-w-5xl overflow-auto border-border bg-surface text-foreground">
        <DialogHeader>
          <DialogTitle>{preview?.name}</DialogTitle>
        </DialogHeader>
        {preview?.type === "application/pdf" ? (
          <iframe
            title={preview.name}
            src={preview.blobUrl}
            className="h-[70svh] w-full border-0"
          />
        ) : (
          preview && (
            <img
              src={preview.blobUrl}
              alt={preview.name}
              className="max-h-[70svh] max-w-full justify-self-center object-contain"
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
