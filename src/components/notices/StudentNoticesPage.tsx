import { useEffect, useState } from "react";
import { AlertCircle, Bell, FileText, Loader2 } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, isMockApi } from "@/api";
import { useApi } from "@/api/use-api";
import type { NoticeAttachmentResponse, NoticeInboxItem } from "@/api/types";
import { noticeCategories, subscribeToNotices, type NoticeCategory } from "@/lib/noticeStore";

type CategoryFilter = "All" | NoticeCategory;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function expiryHint(expiresAt?: string | null): string | null {
  if (!expiresAt) return null;
  const days = Math.ceil((Date.parse(`${expiresAt}T23:59:59`) - Date.now()) / 86_400_000);
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  return `Expires in ${days} day${days === 1 ? "" : "s"}`;
}

export function StudentNoticesPage() {
  const [category, setCategory] = useState<CategoryFilter>("All");
  const { data: notices, loading, error, reload } = useApi(
    ["noticeInbox", category],
    () => api.getNoticeInbox(category),
  );

  useEffect(() => {
    if (!isMockApi) return;
    return subscribeToNotices(reload);
  }, [reload]);

  const [selected, setSelected] = useState<NoticeInboxItem | null>(null);
  const [activeAttachment, setActiveAttachment] = useState<{
    name: string;
    type: string;
    blobUrl: string;
  } | null>(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");

  const openNotice = async (notice: NoticeInboxItem) => {
    setSelected(notice);
    if (notice.unread) {
      try {
        await api.markNoticeRead(notice.id);
        notice.unread = false;
        reload();
      } catch {
        // read failure shouldn't prevent viewing
      }
    }
  };

  const openAttachment = async (noticeId: number | string, file: NoticeAttachmentResponse) => {
    setAttachmentLoading(true);
    setAttachmentError("");
    try {
      const blob = file.url
        ? await api.getBlob(file.url)
        : await api.getNoticeAttachmentBlob(noticeId, file.id);
      const blobUrl = URL.createObjectURL(blob);
      setActiveAttachment({
        name: file.name,
        type: file.type,
        blobUrl,
      });
    } catch (err) {
      setAttachmentError(err instanceof Error ? err.message : "Unable to load attachment.");
    } finally {
      setAttachmentLoading(false);
    }
  };

  const closeAttachment = () => {
    if (activeAttachment?.blobUrl) {
      URL.revokeObjectURL(activeAttachment.blobUrl);
    }
    setActiveAttachment(null);
    setAttachmentError("");
  };

  const visibleNotices = notices ?? [];

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
        {loading && visibleNotices.length === 0 ? (
          <div className="erp-surface grid min-h-40 place-items-center p-6 text-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            <p className="mt-2 text-sm">Loading notices…</p>
          </div>
        ) : error ? (
          <div className="erp-surface flex flex-col items-center justify-center gap-3 p-6 text-center text-danger">
            <AlertCircle className="size-8" />
            <p className="font-semibold">{error.message}</p>
            <Button type="button" variant="outline" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : visibleNotices.length === 0 ? (
          <div className="erp-surface grid min-h-40 place-items-center p-6 text-center text-muted-foreground">
            No notices right now.
          </div>
        ) : (
          <ul className="grid gap-3">
            {visibleNotices.map((notice) => (
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
                    {notice.unread && (
                      <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
                        Unread
                      </span>
                    )}
                  </span>
                  <span className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
                    <span>{notice.category}</span>
                    <span>·</span>
                    <span>
                      {notice.authorName} ({notice.authorRole === "HOD" ? "HOD" : "Counsellor"})
                    </span>
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
            ))}
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
                  key={file.id}
                  type="button"
                  disabled={attachmentLoading}
                  onClick={() => openAttachment(selected.id, file)}
                  className="inline-flex min-h-14 items-center gap-2 rounded-lg border border-border px-4 text-left hover:bg-surface-2 disabled:opacity-50"
                >
                  <FileText aria-hidden="true" className="size-5" strokeWidth={1.5} />
                  <span>{file.name}</span>
                  {attachmentLoading && <Loader2 className="ml-auto size-4 animate-spin" />}
                </button>
              ))}
              {attachmentError && (
                <p className="text-sm text-danger">{attachmentError}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={activeAttachment !== null} onOpenChange={(open) => !open && closeAttachment()}>
        <DialogContent className="max-h-[90svh] max-w-5xl overflow-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>{activeAttachment?.name}</DialogTitle>
          </DialogHeader>
          {activeAttachment?.type === "application/pdf" ? (
            <iframe
              title={activeAttachment.name}
              src={activeAttachment.blobUrl}
              className="h-[70svh] w-full border-0"
            />
          ) : activeAttachment ? (
            <img
              src={activeAttachment.blobUrl}
              alt={activeAttachment.name}
              className="max-h-[70svh] max-w-full justify-self-center object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
