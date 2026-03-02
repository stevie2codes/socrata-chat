"use client";

export function StreamingIndicator() {
  return (
    <div
      role="status"
      aria-label="Assistant is thinking"
      className="flex items-center gap-2 px-4 py-3"
    >
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className="size-1.5 rounded-full"
          style={{
            background: "var(--primary)",
            boxShadow: "0 0 6px var(--glow)",
            animation: `pulse-dot 1.4s ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </div>
  );
}
