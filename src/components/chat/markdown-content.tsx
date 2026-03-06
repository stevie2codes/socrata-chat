"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useId, type ComponentPropsWithoutRef } from "react";

interface MarkdownContentProps {
  content: string;
}

function CollapsibleTable({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="my-4 border-l-2" style={{ borderColor: "oklch(0.68 0.16 250 / 0.3)" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg
          className={`size-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {open ? "Hide data" : "Show data"}
      </button>
      {open && <div id={contentId} className="overflow-x-auto px-3 pb-3">{children}</div>}
    </div>
  );
}

const components = {
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-6 mb-2 text-base font-semibold tracking-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-5 mb-2 text-sm font-semibold" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className="mt-3 first:mt-0" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  code: ({ children, className, ...props }: ComponentPropsWithoutRef<"code">) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code
          className={`${className} glass block overflow-x-auto rounded-xl p-4 font-mono text-xs`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className="rounded-md bg-glass px-1.5 py-0.5 font-mono text-xs" {...props}>
        {children}
      </code>
    );
  },
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-2 list-disc space-y-1 pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-2 list-decimal space-y-1 pl-5" {...props}>
      {children}
    </ol>
  ),
  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <CollapsibleTable>
      <table className="w-full text-xs" {...props}>
        {children}
      </table>
    </CollapsibleTable>
  ),
  thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead className="border-b border-glass-border bg-glass" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th className="px-3 py-2 text-left font-medium whitespace-nowrap" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td className="border-t border-glass-border px-3 py-2 font-mono whitespace-nowrap" {...props}>
      {children}
    </td>
  ),
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
