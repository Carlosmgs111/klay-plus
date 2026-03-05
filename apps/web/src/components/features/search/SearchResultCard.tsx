interface SearchResultCardProps {
  content: string;
  score: number;
  sourceId: string;
  metadata: Record<string, unknown>;
}

export function SearchResultCard({
  content,
  score,
  sourceId,
  metadata,
}: SearchResultCardProps) {
  const scorePercent = Math.round(score * 100);

  const scoreClasses = scorePercent >= 80
    ? { text: "text-success", bg: "bg-success-muted" }
    : scorePercent >= 50
      ? { text: "text-accent", bg: "bg-accent-muted" }
      : { text: "text-warning", bg: "bg-warning-muted" };
  const scoreBarColor = scorePercent >= 80 ? "bg-success" : scorePercent >= 50 ? "bg-accent" : "bg-warning";

  return (
    <div
      className="p-4 rounded-lg space-y-3 bg-surface-1 border border-subtle hover:border-default hover:shadow-sm transition-all duration-fast ease-out-expo"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm flex-1 line-clamp-3 text-secondary">
          {content}
        </p>
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

      <div className="flex items-center gap-4 text-xs text-tertiary">
        <span className="font-mono">Source: {sourceId.slice(0, 8)}...</span>
        {Object.entries(metadata).slice(0, 3).map(([key, val]) => (
          <span key={key}>
            {key}: {String(val)}
          </span>
        ))}
      </div>
    </div>
  );
}
