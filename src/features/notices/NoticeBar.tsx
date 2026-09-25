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
      className={cn(
        "flex min-h-9 shrink-0 items-center gap-3 px-4 py-1.5 text-sm font-medium text-white",
        notice.kind === "error" ? "bg-destructive" : "bg-primary",
      )}
    >
      <span className="min-w-0 flex-1 break-words">{notice.message}</span>
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
