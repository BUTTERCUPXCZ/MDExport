export function Keycap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-line-strong bg-canvas px-2 font-sans text-[13px] font-medium text-text-2 shadow-[inset_0_-1px_0_rgb(0_0_0/0.35)]">
      {children}
    </kbd>
  );
}
