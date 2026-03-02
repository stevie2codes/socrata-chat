"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Portal } from "@/lib/portals";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface PortalSelectorProps {
  portal: Portal;
  portals: Portal[];
  onPortalChange: (domain: string) => void;
}

export function PortalSelector({
  portal,
  portals,
  onPortalChange,
}: PortalSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Select data portal"
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5",
            "text-xs font-medium text-foreground/70",
            "bg-white/[0.07] border border-white/[0.12]",
            "transition-all duration-200",
            "hover:bg-white/[0.12] hover:text-foreground/90 hover:border-white/[0.18]",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="size-3.5 opacity-50"
          >
            <path
              fillRule="evenodd"
              d="M8 1a3.5 3.5 0 0 0-3.5 3.5 .75.75 0 0 1-1.5 0 5 5 0 1 1 10 0A5 5 0 0 1 9.25 8.957l-.552.588-.502.681A7.517 7.517 0 0 0 7.032 13.5H9.5a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1 0-1.5h1.032a9.013 9.013 0 0 1 1.597-4.07l.503-.682.55-.586A3.5 3.5 0 0 0 8 1Z"
              clipRule="evenodd"
            />
          </svg>
          {portal.label}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={cn(
              "size-3 opacity-40 transition-transform duration-200",
              open && "rotate-180"
            )}
          >
            <path
              fillRule="evenodd"
              d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(
          "w-56 rounded-xl p-1.5",
          "bg-[oklch(0.14_0.015_265_/_0.95)]",
          "backdrop-blur-2xl saturate-[180%]",
          "border border-white/[0.15]",
          "shadow-[0_16px_64px_oklch(0_0_0_/_0.6),0_0_0_0.5px_oklch(1_0_0_/_0.08)_inset]"
        )}
      >
        <div className="flex flex-col gap-0.5">
          {portals.map((p) => (
            <button
              key={p.domain}
              type="button"
              onClick={() => {
                onPortalChange(p.domain);
                setOpen(false);
              }}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors",
                p.domain === portal.domain
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-foreground/70 hover:bg-white/[0.08] hover:text-foreground/90"
              )}
            >
              <span>{p.label}</span>
              {p.domain === portal.domain && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
