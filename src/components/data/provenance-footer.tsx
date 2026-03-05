import { ExternalLink } from "lucide-react";

interface Provenance {
  domain: string;
  datasetId: string;
  sodaApiUrl: string;
  portalPermalink: string;
  queryTimestamp: string;
}

interface ProvenanceFooterProps {
  provenance: Provenance;
  totalRows: number;
  limitApplied: boolean;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ProvenanceFooter({ provenance, totalRows, limitApplied }: ProvenanceFooterProps) {
  return (
    <div className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          Source:{" "}
          <a
            href={provenance.portalPermalink}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
          >
            {provenance.domain}
          </a>
          {" "}
          <span className="text-muted-foreground/60">({provenance.datasetId})</span>
        </span>

        <span className="text-muted-foreground/30">|</span>

        <span>
          Queried {formatTimestamp(provenance.queryTimestamp)} &middot; {totalRows.toLocaleString()}{" "}
          {totalRows === 1 ? "row" : "rows"}
        </span>

        {limitApplied && (
          <>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-amber-400/80">Results may be partial (LIMIT applied)</span>
          </>
        )}

        <span className="text-muted-foreground/30">|</span>

        <a
          href={provenance.sodaApiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
        >
          Verify via SODA API
          <ExternalLink className="size-2.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
