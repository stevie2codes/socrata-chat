"use client";

const TOOL_PHASE_LABELS: Record<string, string> = {
  search_datasets: "Searching datasets",
  get_dataset_info: "Reading dataset schema",
  confirm_query: "Preparing query plan",
  query_dataset: "Running query",
};

interface StreamingPhaseProps {
  activeToolName: string | null;
  isOnlyTools: boolean;
}

export function StreamingPhaseIndicator({
  activeToolName,
  isOnlyTools,
}: StreamingPhaseProps) {
  if (!activeToolName && !isOnlyTools) return null;

  const label = activeToolName
    ? `${TOOL_PHASE_LABELS[activeToolName] ?? "Working"}...`
    : "Working...";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="mt-3 flex items-center gap-3"
    >
      <div className="relative h-0.5 w-32 overflow-hidden rounded-full bg-glass">
        <div
          className="absolute inset-0 rounded-full motion-safe:animate-[shimmer_1.8s_ease-in-out_infinite]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--primary), transparent)",
          }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
