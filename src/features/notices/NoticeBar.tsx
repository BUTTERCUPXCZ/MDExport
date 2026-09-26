import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useNoticeStore } from "@/features/notices/noticeStore";
import { cn } from "@/lib/utils";

const ICONS = { error: CircleAlert, success: CircleCheck, info: Info };

/** One-line notice above the page: what happened, and the next step if there is one. */
export function NoticeBar() {
  const notice = useNoticeStore((s) => s.notice);
  const dismiss = useNoticeStore((s) => s.dismiss);

  if (!notice) return null;
  const Icon = ICONS[notice.kind];

  return (
    <div
      role={notice.kind === "error" ? "alert" : "status"}
      aria-label={notice.kind === "error" ? undefined : "Notification"}
      className={cn(
        "flex min-h-10 shrink-0 items-center gap-2.5 border-b border-line bg-panel px-4 py-1.5 text-[13px] text-text",
        notice.kind === "error" && "bg-danger-soft",
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-4 shrink-0",
          notice.kind === "error" && "text-danger",
          notice.kind === "success" && "text-success",
          notice.kind === "info" && "text-accent",
        )}
      />
      <span className="min-w-0 flex-1 break-words">{notice.message}</span>
      {notice.action && (
        <button
          type="button"
          onClick={() => {
            notice.action!.run();
            dismiss();
          }}
          className="h-7 shrink-0 rounded-md border border-line-strong px-2.5 text-[12.5px] font-medium text-text transition-colors hover:bg-raised"
        >
          {notice.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-text"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
