"use client";

import { useState } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
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
            "glass-pill flex items-center gap-1.5 rounded-lg px-3 py-1.5",
            "text-xs font-medium text-foreground/70",
            "hover:text-foreground/90"
          )}
        >
          <MapPin className="size-3.5 opacity-50" />
          {portal.label}
          <ChevronDown
            className={cn(
              "size-3 opacity-40 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
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
                <Check className="size-3.5" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
