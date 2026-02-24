interface SearchResultCardProps {
  content: string;
  score: number;
  semanticUnitId: string;
  metadata: Record<string, unknown>;
}

export function SearchResultCard({
  content,
  score,
  semanticUnitId,
  metadata,
}: SearchResultCardProps) {
  const scorePercent = Math.round(score * 100);

  const scoreColor =
    scorePercent >= 80
      ? "var(--semantic-success)"
      : scorePercent >= 50
        ? "var(--accent-primary)"
        : "var(--semantic-warning)";

  const scoreBg =
    scorePercent >= 80
      ? "var(--semantic-success-muted)"
      : scorePercent >= 50
        ? "var(--accent-primary-muted)"
        : "var(--semantic-warning-muted)";

  return (
    <div
      className="p-4 rounded-lg space-y-3"
      style={{
        backgroundColor: "var(--surface-1)",
        border: "1px solid var(--border-subtle)",
        transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm flex-1 line-clamp-3" style={{ color: "var(--text-secondary)" }}>
          {content}
        </p>
        <div className="text-right flex-shrink-0">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono"
            style={{
              backgroundColor: scoreBg,
              color: scoreColor,
            }}
          >
            {scorePercent}%
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-1 rounded-full" style={{ backgroundColor: "var(--surface-3)" }}>
        <div
          className="h-1 rounded-full"
          style={{
            width: `${scorePercent}%`,
            backgroundColor: scoreColor,
            transition: "width 280ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>

      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
        <span className="font-mono">Unit: {semanticUnitId.slice(0, 8)}...</span>
        {Object.entries(metadata).slice(0, 3).map(([key, val]) => (
          <span key={key}>
            {key}: {String(val)}
          </span>
        ))}
      </div>
    </div>
  );
}
