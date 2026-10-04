import { useMemo, useState, useSyncExternalStore } from "react";
import { FileText, Megaphone, X } from "lucide-react";

import { TouchTextInput } from "@/components/TouchTextInput";
import { PageBanner } from "@/components/erp/PageBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import {
  createNotice,
  getNoticesSnapshot,
  listForCounsellor,
  noticeAudienceSelection,
  noticeCategories,
  readCount,
  recipientCount,
  subscribeToNotices,
  withdraw,
  type Notice,
  type NoticeAttachment,
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
  const notices = useSyncExternalStore(
    subscribeToNotices,
    getNoticesSnapshot,
    getNoticesSnapshot,
  );
  const students = useMemo(
    () => (role === "COUNSELLOR" ? listStudents(user?.id ?? "") : listAllStudents()),
    [role, user?.id],
  );
  const sent = useMemo(
    () => notices.filter((notice) => notice.authorId === user?.id),
    [notices, user?.id],
  );
  const inbox = useMemo(
    () => (role === "COUNSELLOR" ? listForCounsellor(user?.id ?? "") : []),
    [notices, role, user?.id],
  );

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
        />
      )}
      {tab === "sent" && (
        <NoticeList
          notices={sent}
          empty="No notices sent yet."
          authorId={user?.id ?? ""}
          allowPin={role === "HOD"}
        />
      )}
      {tab === "from-hod" && role === "COUNSELLOR" && (
        <NoticeList notices={inbox} empty="No notices from HOD." authorId="" />
      )}
    </div>
  );
}

function ComposeNotice({
  role,
  authorId,
  authorName,
  students,
}: {
  role: NoticeRole;
  authorId: string;
  authorName: string;
  students?: ReturnType<typeof listStudents>;
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
  const [attachments, setAttachments] = useState<NoticeAttachment[]>([]);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [preview, setPreview] = useState<NoticeAttachment | null>(null);
  const isSelectedAudience = audience.startsWith("SELECTED_STUDENTS:");
  const selectedAudience = noticeAudienceSelection(selectedRegNos);
  const currentAudience =
    role === "COUNSELLOR" && isSelectedAudience ? selectedAudience : audience;
  const isValid =
    title.trim().length > 0 &&
    title.trim().length <= 80 &&
    body.trim().length > 0 &&
    body.trim().length <= 1500 &&
    attachments.length <= 3 &&
    (!isSelectedAudience || selectedRegNos.length > 0);

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const incoming = Array.from(files);
    if (attachments.length + incoming.length > 3) {
      setError("Attach no more than 3 files.");
      return;
    }
    if (incoming.some((file) => !attachmentTypes.includes(file.type as (typeof attachmentTypes)[number]))) {
      setError("Attachments must be PDF, JPG, or PNG files.");
      return;
    }
    if (incoming.some((file) => file.size <= 0 || file.size > 2 * 1024 * 1024)) {
      setError("Each attachment must be no larger than 2 MB.");
      return;
    }
    Promise.all(
      incoming.map(
        (file) =>
          new Promise<NoticeAttachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error(`${file.name} could not be read.`));
            reader.onload = () => {
              if (typeof reader.result !== "string") {
                reject(new Error(`${file.name} could not be read.`));
                return;
              }
              resolve({
                name: file.name,
                type: file.type as NoticeAttachment["type"],
                size: file.size,
                dataUrl: reader.result,
              });
            };
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((loaded) => {
        setAttachments((current) => [...current, ...loaded]);
        setError("");
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Attachments could not be read.");
      });
  };

  const send = () => {
    if (!isValid) return;
    try {
      const notice = createNotice({
        title,
        body,
        category,
        audience: currentAudience,
        authorRole: role,
        authorId,
        authorName,
        ...(expiresAt ? { expiresAt } : {}),
        ...(role === "HOD" && pinned ? { pinned } : {}),
        attachments,
      });
      const count = recipientCount(notice);
      setConfirmation(`Sent to ${count} students.`);
      setTitle("");
      setBody("");
      setAttachments([]);
      setSelectedRegNos([]);
      setExpiresAt("");
      setPinned(false);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The notice could not be sent.");
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
              <span>{student.name} · {student.regNo}</span>
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
        <label className="inline-flex min-h-14 w-fit cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 font-medium text-foreground">
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
        {attachments.map((attachment, index) => (
          <div key={`${attachment.name}-${index}`} className="flex min-h-14 items-center gap-3">
            <button
              type="button"
              onClick={() => setPreview(attachment)}
              className="min-h-14 flex-1 text-left underline"
            >
              {attachment.name}
            </button>
            <button
              type="button"
              aria-label={`Remove ${attachment.name}`}
              onClick={() => setAttachments((current) => current.filter((_, i) => i !== index))}
              className="grid size-14 place-items-center rounded-lg border border-border"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {confirmation && <p role="status" className="text-sm font-semibold text-ok">{confirmation}</p>}
      <Button type="button" onClick={send} disabled={!isValid} className="min-h-14 w-fit">
        Send
      </Button>
      <AttachmentPreview attachment={preview} onClose={() => setPreview(null)} />
    </section>
  );
}

function NoticeList({
  notices,
  empty,
  authorId,
  allowPin = false,
}: {
  notices: Notice[];
  empty: string;
  authorId: string;
  allowPin?: boolean;
}) {
  const [error, setError] = useState("");
  return (
    <section className="min-h-0 flex-1 overflow-auto">
      {notices.length === 0 ? (
        <div className="erp-surface grid min-h-40 place-items-center p-6 text-center text-muted-foreground">
          {empty}
        </div>
      ) : (
        <ul className="grid gap-3">
          {notices.map((notice) => (
            <li key={notice.id} className="erp-surface grid gap-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{notice.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notice.category} · {formatDate(notice.createdAt)} · {readCount(notice)} of{" "}
                    {recipientCount(notice)} read
                  </p>
                </div>
                {allowPin && notice.pinned && (
                  <span className="rounded-full border border-border px-3 py-2 text-sm">Pinned</span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{notice.body}</p>
              <p className="text-sm text-muted-foreground">
                To {notice.audience.replaceAll("_", " ").replace(":", " · ")}
              </p>
              {authorId && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      withdraw(notice.id, authorId);
                      setError("");
                    } catch (cause) {
                      setError(cause instanceof Error ? cause.message : "Could not withdraw notice.");
                    }
                  }}
                  className="min-h-14 w-fit rounded-lg border border-border px-4 font-medium"
                >
                  Withdraw
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </section>
  );
}

function AttachmentPreview({
  attachment,
  onClose,
}: {
  attachment: NoticeAttachment | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={attachment !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] max-w-5xl overflow-auto border-border bg-surface text-foreground">
        <DialogHeader>
          <DialogTitle>{attachment?.name}</DialogTitle>
        </DialogHeader>
        {attachment?.type === "application/pdf" ? (
          <iframe title={attachment.name} src={attachment.dataUrl} className="h-[70svh] w-full" />
        ) : (
          attachment && (
            <img
              src={attachment.dataUrl}
              alt={attachment.name}
              className="max-h-[70svh] max-w-full justify-self-center object-contain"
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
