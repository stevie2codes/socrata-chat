"use client";

import { useEffect } from "react";
import { MapPin, X } from "lucide-react";
import type { SessionState } from "@/types";
import { getPortalLabel } from "@/lib/portals";
import { SidebarDatasetSection } from "./sidebar-dataset-section";
import { SidebarFiltersSection } from "./sidebar-filters-section";

interface ContextSidebarProps {
  open: boolean;
  onClose: () => void;
  session: SessionState;
  onRemoveFilter: (index: number) => void;
}

export function ContextSidebar({
  open,
  onClose,
  session,
  onRemoveFilter,
}: ContextSidebarProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <aside
      aria-label="Data context"
      className={`fixed right-0 top-0 z-30 flex h-dvh w-[280px] flex-col glass-subtle transition-transform duration-200 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Context
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close sidebar"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* Portal — always visible */}
        <section className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Portal
          </h3>
          <div className="flex items-center gap-2 text-sm text-foreground/90">
            <MapPin className="size-3.5 text-muted-foreground" />
            {getPortalLabel(session.portal)}
          </div>
        </section>

        {/* Dataset — when active */}
        {session.activeDataset && (
          <SidebarDatasetSection dataset={session.activeDataset} />
        )}

        {/* Filters — when present */}
        {session.filters.length > 0 && (
          <SidebarFiltersSection
            filters={session.filters}
            onRemove={onRemoveFilter}
          />
        )}
      </div>
    </aside>
  );
}
