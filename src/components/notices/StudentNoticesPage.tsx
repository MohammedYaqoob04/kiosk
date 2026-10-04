import { useState, useSyncExternalStore } from "react";
import { Bell, FileText } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listForStudent, markRead, noticeCategories, subscribeToNotices, getNoticesSnapshot, type Notice, type NoticeCategory, type NoticeAttachment } from "@/lib/noticeStore";
import { useAuth } from "@/lib/auth-context";

type CategoryFilter = "All" | NoticeCategory;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function expiryHint(expiresAt?: string): string | null {
  if (!expiresAt) return null;
  const days = Math.ceil((Date.parse(`${expiresAt}T23:59:59`) - Date.now()) / 86_400_000);
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  return `Expires in ${days} day${days === 1 ? "" : "s"}`;
}

export function StudentNoticesPage() {
  const { user } = useAuth();
  const notices = useSyncExternalStore(
    subscribeToNotices,
    getNoticesSnapshot,
    getNoticesSnapshot,
  );
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [selected, setSelected] = useState<Notice | null>(null);
  const [attachment, setAttachment] = useState<NoticeAttachment | null>(null);
  const visibleNotices = listForStudent(user?.identifier ?? "").filter(
    (notice) => category === "All" || notice.category === category,
  );

  const openNotice = (notice: Notice) => {
    if (user?.identifier) markRead(notice.id, user.identifier);
    setSelected(notice);
  };

  return (
    <div className="staff-portal-page">
      <PageBanner title="Notices" subtitle="Notices and circulars for you" icon={Bell} />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter notices by category">
        {(["All", ...noticeCategories] as CategoryFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
            className={`min-h-14 rounded-lg border px-4 font-medium ${
              category === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <section className="min-h-0 flex-1 overflow-auto">
        {visibleNotices.length === 0 ? (
          <div className="erp-surface grid min-h-40 place-items-center p-6 text-center text-muted-foreground">
            No notices right now.
          </div>
        ) : (
          <ul className="grid gap-3">
            {visibleNotices.map((notice) => {
              const isRead = notice.readBy.includes(user?.identifier ?? "");
              return (
                <li key={notice.id}>
                  <button
                    type="button"
                    onClick={() => openNotice(notice)}
                    className="erp-surface grid min-h-14 w-full gap-2 p-4 text-left"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-foreground">
                        {notice.pinned && <span className="mr-2">Pinned ·</span>}
                        {notice.title}
                      </span>
                      {!isRead && (
                        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
                          Unread
                        </span>
                      )}
                    </span>
                    <span className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
                      <span>{notice.category}</span>
                      <span>·</span>
                      <span>{notice.authorName} ({notice.authorRole === "HOD" ? "HOD" : "Counsellor"})</span>
                      <span>·</span>
                      <span>{formatDate(notice.createdAt)}</span>
                      {notice.expiresAt && (
                        <>
                          <span>·</span>
                          <span>{expiryHint(notice.expiresAt)}</span>
                        </>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90svh] max-w-3xl overflow-y-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                {selected.category} · {selected.authorName} · {formatDate(selected.createdAt)}
                {selected.expiresAt ? ` · ${expiryHint(selected.expiresAt)}` : ""}
              </p>
              <p className="whitespace-pre-wrap text-foreground">{selected.body}</p>
              {selected.attachments.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => setAttachment(file)}
                  className="inline-flex min-h-14 items-center gap-2 rounded-lg border border-border px-4 text-left"
                >
                  <FileText aria-hidden="true" className="size-5" strokeWidth={1.5} />
                  {file.name}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={attachment !== null} onOpenChange={(open) => !open && setAttachment(null)}>
        <DialogContent className="max-h-[90svh] max-w-5xl overflow-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>{attachment?.name}</DialogTitle>
          </DialogHeader>
          {attachment?.type === "application/pdf" ? (
            <iframe title={attachment.name} src={attachment.dataUrl} className="h-[70svh] w-full" />
          ) : attachment ? (
            <img
              src={attachment.dataUrl}
              alt={attachment.name}
              className="max-h-[70svh] max-w-full justify-self-center object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
