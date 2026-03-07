import { useRef, useState } from "react";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";

interface SearchBarProps {
  onSearch: (query: string, topK: number, minScore: number, filters?: Record<string, unknown>) => void;
  isLoading: boolean;
  hideContextFilter?: boolean;
}

const STATUS_OPTIONS = ["complete", "partial", "failed"] as const;

export function SearchBar({ onSearch, isLoading, hideContextFilter }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [minScore, setMinScore] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [contextFilter, setContextFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = [
    topK !== 5,
    minScore !== 0,
    statusFilters.length > 0,
    !hideContextFilter && contextFilter.trim() !== "",
    sourceFilter.trim() !== "",
  ].filter(Boolean).length;

  const toggleStatus = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const filters: Record<string, unknown> = {};
    if (statusFilters.length > 0) filters.status = statusFilters;
    if (!hideContextFilter && contextFilter.trim()) filters.contextId = contextFilter.trim();
    if (sourceFilter.trim()) filters.sourceId = sourceFilter.trim();

    const hasFilters = Object.keys(filters).length > 0;
    onSearch(query.trim(), topK, minScore, hasFilters ? filters : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon name="search" className="text-ghost" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your knowledge base..."
            required
            className="input pl-9 py-2.5"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="btn-ghost flex items-center gap-1.5 relative"
        >
          <Icon name="filter" className="text-tertiary" />
          <span className="text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold bg-accent text-white">
              {activeFilterCount}
            </span>
          )}
          <Icon
            name={filtersOpen ? "chevron-up" : "chevron-down"}
            className="text-ghost text-xs"
          />
        </button>
        <Button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Searching...
            </span>
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {/* Collapsible advanced filters */}
      <div
        ref={panelRef}
        className="overflow-hidden transition-all duration-fast ease-out-expo"
        style={{
          maxHeight: filtersOpen ? panelRef.current?.scrollHeight ?? 500 : 0,
          opacity: filtersOpen ? 1 : 0,
        }}
      >
        <div className="pt-1 pb-2 space-y-4">
          {/* Top K + Min Score row */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <label className="text-xs text-tertiary tracking-caps">Top K:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="input w-16 text-xs py-1"
              />
            </div>
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <label className="text-xs text-tertiary tracking-caps whitespace-nowrap">
                Min Score:
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="flex-1 accent-[var(--color-accent)]"
              />
              <span className="text-xs font-mono text-secondary w-8 text-right">
                {minScore.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Status filter badges */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-tertiary tracking-caps">Status:</label>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((status) => {
                const isActive = statusFilters.includes(status);
                const badgeClass = isActive
                  ? status === "complete"
                    ? "bg-success-muted text-success"
                    : status === "partial"
                      ? "bg-accent-muted text-accent"
                      : "bg-danger-muted text-danger"
                  : "bg-surface-2 text-tertiary";
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleStatus(status)}
                    className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors duration-fast cursor-pointer ${badgeClass} ${
                      isActive ? "ring-1 ring-current/20" : "hover:bg-surface-3"
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ID filters */}
          <div className="flex flex-wrap gap-4">
            {!hideContextFilter && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-tertiary tracking-caps">Context ID:</label>
                <input
                  type="text"
                  value={contextFilter}
                  onChange={(e) => setContextFilter(e.target.value)}
                  placeholder="Filter by context..."
                  className="input text-xs py-1 w-48 font-mono"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tertiary tracking-caps">Source ID:</label>
              <input
                type="text"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                placeholder="Filter by source..."
                className="input text-xs py-1 w-48 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
