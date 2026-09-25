import { useNoticeStore } from "@/features/notices/noticeStore";
import { cn } from "@/lib/utils";

/** Full-width notice line above the page. */
export function NoticeBar() {
  const notice = useNoticeStore((s) => s.notice);
  const dismiss = useNoticeStore((s) => s.dismiss);

  if (!notice) return null;

  const isError = notice.kind === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex min-h-9 shrink-0 items-center gap-4 border-b px-6 py-1.5 text-[13px]",
        isError ? "border-danger bg-danger text-white" : "bg-surface text-ink",
      )}
    >
      <span className="font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
        {isError ? "Error" : "Note"}
      </span>
      <span className="min-w-0 flex-1 break-words">{notice.message}</span>
      <button
        type="button"
        onClick={dismiss}
        className="font-mono text-[11px] tracking-[0.06em] uppercase underline-offset-4 hover:underline"
      >
        Dismiss
      </button>
    </div>
  );
}
