import type { ReactNode } from "react";

/** Title block at the top of every inner page (sits below the fixed nav). */
export function PageIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="max-w-[680px]">
      <h1 className="text-[clamp(36px,5vw,52px)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-text">
        {title}
      </h1>
      {children && (
        <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-text-2">{children}</p>
      )}
    </header>
  );
}
