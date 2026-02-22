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

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-gray-700 flex-1 line-clamp-3">{content}</p>
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-bold text-primary-700">{scorePercent}%</span>
          <p className="text-xs text-gray-400">score</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-primary-500 h-1.5 rounded-full transition-all"
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400">
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
