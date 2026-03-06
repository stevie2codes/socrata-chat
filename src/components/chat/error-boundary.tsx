"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ChatErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center gap-4 px-4 py-16 text-center"
        >
          <AlertTriangle
            className="size-8 text-destructive/70"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-foreground/90">
              Something went wrong.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your conversation is preserved — reload to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
