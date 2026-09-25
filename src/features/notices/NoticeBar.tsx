import { X } from "lucide-react";
import { useNoticeStore } from "@/features/notices/noticeStore";
import { cn } from "@/lib/utils";

/** Discord-style notice banner shown above page content. */
export function NoticeBar() {
  const notice = useNoticeStore((s) => s.notice);
  const dismiss = useNoticeStore((s) => s.dismiss);

  if (!notice) return null;

  return (
    <div
      role={notice.kind === "error" ? "alert" : "status"}
      aria-label={notice.kind === "error" ? undefined : "Notification"}
      className={cn(
        "flex min-h-9 shrink-0 items-center gap-3 px-4 py-1.5 text-sm font-medium text-white",
        notice.kind === "error" && "bg-destructive",
        notice.kind === "info" && "bg-primary",
        notice.kind === "success" && "bg-success",
      )}
    >
      <span className="min-w-0 flex-1 break-words">{notice.message}</span>
      {notice.action && (
        <button
          type="button"
          onClick={() => {
            notice.action!.run();
            dismiss();
          }}
          className="h-6 shrink-0 rounded-[3px] bg-white/20 px-3 text-xs font-semibold hover:bg-white/30"
        >
          {notice.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-white/20"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
