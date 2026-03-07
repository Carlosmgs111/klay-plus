import { useState } from "react";
import { Icon } from "../../shared/Icon";

interface SearchResultCardProps {
  content: string;
  score: number;
  sourceId: string;
  metadata: Record<string, unknown>;
  rank?: number;
}

export function SearchResultCard({
  content,
  score,
  sourceId,
  metadata,
  rank,
}: SearchResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const scorePercent = Math.round(score * 100);

  const scoreClasses = scorePercent >= 80
    ? { text: "text-success", bg: "bg-success-muted" }
    : scorePercent >= 50
      ? { text: "text-accent", bg: "bg-accent-muted" }
      : { text: "text-warning", bg: "bg-warning-muted" };
  const scoreBarColor = scorePercent >= 80 ? "bg-success" : scorePercent >= 50 ? "bg-accent" : "bg-warning";

  const handleCopySourceId = async () => {
    try {
      await navigator.clipboard.writeText(sourceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available
    }
  };

  // Extract prominent metadata fields
  const contextId = metadata.contextId as string | undefined;
  const model = metadata.model as string | undefined;
  const chunkIndex = metadata.chunkIndex as number | undefined;
  const totalChunks = metadata.totalChunks as number | undefined;
  const prominentKeys = new Set(["contextId", "model", "chunkIndex", "totalChunks"]);

  // Remaining metadata (non-prominent)
  const otherMetadata = Object.entries(metadata).filter(
    ([key]) => !prominentKeys.has(key),
  );

  const hasProminent = contextId || model || chunkIndex != null;
  const hasOther = otherMetadata.length > 0;

  return (
    <div className="p-4 rounded-lg space-y-3 bg-surface-1 border border-subtle hover:border-default hover:shadow-sm transition-all duration-fast ease-out-expo">
      {/* Header: rank + content + score */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {rank != null && (
            <span className="flex-shrink-0 w-5 h-5 rounded bg-surface-2 text-ghost text-[10px] font-semibold font-mono flex items-center justify-center mt-0.5">
              {rank}
            </span>
          )}
          <p
            className={`text-sm flex-1 text-secondary cursor-pointer ${expanded ? "" : "line-clamp-3"}`}
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Click to collapse" : "Click to expand"}
          >
            {content}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono ${scoreClasses.bg} ${scoreClasses.text}`}
          >
            {scorePercent}%
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-1 rounded-full bg-surface-3">
        <div
          className={`h-1 rounded-full transition-[width] duration-slow ease-out-expo ${scoreBarColor}`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* Source ID */}
      <div className="flex items-center gap-2 text-xs text-tertiary">
        <span className="tracking-caps">Source:</span>
        <code className="font-mono text-secondary bg-surface-2 px-1.5 py-0.5 rounded text-[11px]">
          {sourceId}
        </code>
        <button
          type="button"
          onClick={handleCopySourceId}
          className="p-0.5 rounded hover:bg-surface-3 transition-colors duration-fast cursor-pointer"
          title="Copy source ID"
        >
          <Icon name={copied ? "check" : "copy"} className={`text-xs ${copied ? "text-success" : "text-ghost"}`} />
        </button>
      </div>

      {/* Prominent metadata */}
      {hasProminent && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {contextId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-muted text-accent font-mono text-[11px]">
              <Icon name="layers" className="text-[10px]" />
              {contextId.length > 16 ? `${contextId.slice(0, 16)}...` : contextId}
            </span>
          )}
          {model && (
            <span className="inline-flex items-center gap-1 text-tertiary">
              <Icon name="zap" className="text-[10px]" />
              {model}
            </span>
          )}
          {chunkIndex != null && (
            <span className="font-mono text-tertiary">
              Chunk {chunkIndex}{totalChunks != null ? `/${totalChunks}` : ""}
            </span>
          )}
        </div>
      )}

      {/* Other metadata grid */}
      {hasOther && (
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-xs text-tertiary">
          {otherMetadata.map(([key, val]) => (
            <div key={key} className="contents">
              <span className="text-ghost">{key}</span>
              <span className="text-secondary truncate font-mono">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
