"use client";

import { AlertTriangle } from "lucide-react";

interface ErrorCalloutProps {
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorCallout({
  message,
  errorCode,
  onRetry,
  retryLabel = "Try again",
}: ErrorCalloutProps) {
  return (
    <div className="my-3 flex items-start gap-3 rounded-lg glass-subtle px-4 py-3">
      <AlertTriangle
        className="mt-0.5 size-4 shrink-0 text-destructive"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground/90">{message}</p>
        {errorCode && (
          <span className="mt-1 inline-block rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {errorCode}
          </span>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 block text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
