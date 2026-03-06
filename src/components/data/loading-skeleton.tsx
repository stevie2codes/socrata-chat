"use client";

import { cn } from "@/lib/utils";

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded bg-white/[0.06] motion-safe:animate-[shimmer-bg_1.8s_ease-in-out_infinite]",
        className
      )}
      style={style}
    />
  );
}

export function DatasetCardSkeleton() {
  return (
    <div aria-hidden="true" className="glass-subtle rounded-xl px-4 py-3 space-y-2">
      <SkeletonBlock className="h-4" style={{ width: "66%" }} />
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3" style={{ width: "80%" }} />
      <div className="flex gap-1.5 pt-1">
        <SkeletonBlock className="h-4 rounded-full" style={{ width: 64 }} />
        <SkeletonBlock className="h-4 rounded-full" style={{ width: 64 }} />
      </div>
    </div>
  );
}

export function DataTableSkeleton() {
  const widths = [80, 120, 100, 90];
  return (
    <div aria-hidden="true" className="my-3 rounded-lg border-l-2 border-white/10">
      <div className="flex items-center gap-3 px-3 py-2">
        <SkeletonBlock className="h-3" style={{ width: 96 }} />
        <SkeletonBlock className="ml-auto h-3" style={{ width: 64 }} />
      </div>
      <div className="px-1 pb-3 space-y-1.5">
        {/* Header row */}
        <div className="flex gap-4 px-2 py-1.5">
          {widths.map((w, i) => (
            <SkeletonBlock key={i} className="h-3" style={{ width: w }} />
          ))}
        </div>
        {/* Data rows */}
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="flex gap-4 px-2 py-1.5 border-t border-white/[0.04]">
            {widths.map((w, i) => (
              <SkeletonBlock key={i} className="h-3" style={{ width: w * 0.9 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
