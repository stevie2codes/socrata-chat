"use client";

export function StreamingIndicator() {
  return (
    <div
      role="status"
      aria-label="Assistant is thinking"
      className="flex items-center gap-1.5 px-4 py-3"
    >
      <span
        className="bg-muted-foreground/50 size-2 rounded-full motion-safe:animate-[pulse-dot_1.4s_ease-in-out_infinite]"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="bg-muted-foreground/50 size-2 rounded-full motion-safe:animate-[pulse-dot_1.4s_ease-in-out_infinite]"
        style={{ animationDelay: "200ms" }}
      />
      <span
        className="bg-muted-foreground/50 size-2 rounded-full motion-safe:animate-[pulse-dot_1.4s_ease-in-out_infinite]"
        style={{ animationDelay: "400ms" }}
      />
    </div>
  );
}
