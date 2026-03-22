import { useState, useEffect } from "react";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import type { ListProfilesResult } from "@klay/core";

type ProfileEntry = ListProfilesResult["profiles"][number];

interface SearchBarProps {
  onSearch: (query: string, topK: number, minScore: number, filters?: Record<string, unknown>) => void;
  isLoading: boolean;
  hideContextFilter?: boolean;
}

const STATUS_OPTIONS = ["complete", "partial", "failed"] as const;

interface SearchFilters {
  topK: number;
  minScore: number;
  statusFilters: string[];
  contextFilter: string;
  sourceFilter: string;
  profileFilter: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  topK: 5,
  minScore: 0,
  statusFilters: [],
  contextFilter: "",
  sourceFilter: "",
  profileFilter: "",
};

export function SearchBar({ onSearch, isLoading, hideContextFilter }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const { service } = useRuntimeMode();
  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);

  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    service.profiles.list().then((result) => {
      if (!cancelled && result.success) {
        setProfiles(result.data.profiles.filter((p) => p.status === "ACTIVE"));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [service]);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleStatus = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      statusFilters: prev.statusFilters.includes(status)
        ? prev.statusFilters.filter((s) => s !== status)
        : [...prev.statusFilters, status],
    }));
  };

  const activeFilterCount = [
    filters.topK !== 5,
    filters.minScore !== 0,
    filters.statusFilters.length > 0,
    !hideContextFilter && filters.contextFilter.trim() !== "",
    filters.sourceFilter.trim() !== "",
    filters.profileFilter !== "",
  ].filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const apiFilters: Record<string, unknown> = {};
    if (filters.statusFilters.length > 0) apiFilters.status = filters.statusFilters;
    if (!hideContextFilter && filters.contextFilter.trim()) apiFilters.contextId = filters.contextFilter.trim();
    if (filters.sourceFilter.trim()) apiFilters.sourceId = filters.sourceFilter.trim();
    if (filters.profileFilter) apiFilters.processingProfileId = filters.profileFilter;

    const hasFilters = Object.keys(apiFilters).length > 0;
    onSearch(query.trim(), filters.topK, filters.minScore, hasFilters ? apiFilters : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Main input row */}
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
          aria-expanded={filtersOpen}
          aria-controls="search-filters-panel"
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

      {/* Profile quick-filter chips — always visible when profiles exist */}
      {profiles.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-tertiary tracking-caps">Profile:</span>
          <button
            type="button"
            onClick={() => updateFilter("profileFilter", "")}
            className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors duration-fast ${
              filters.profileFilter === ""
                ? "bg-accent text-white"
                : "bg-surface-2 text-tertiary hover:bg-surface-3"
            }`}
          >
            All
          </button>
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => updateFilter("profileFilter", p.id)}
              className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors duration-fast ${
                filters.profileFilter === p.id
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-tertiary hover:bg-surface-3"
              }`}
              title={p.id}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Collapsible advanced filters */}
      <div
        id="search-filters-panel"
        role="region"
        aria-label="Advanced search filters"
        className="grid transition-[grid-template-rows,opacity] duration-fast ease-out-expo"
        style={{
          gridTemplateRows: filtersOpen ? "1fr" : "0fr",
          opacity: filtersOpen ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
        <div className="pt-1 pb-2 space-y-4">
          {/* Top K + Min Score row */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <label className="text-xs text-tertiary tracking-caps">Top K:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={filters.topK}
                onChange={(e) => updateFilter("topK", Number(e.target.value))}
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
                value={filters.minScore}
                onChange={(e) => updateFilter("minScore", Number(e.target.value))}
                className="flex-1 accent-[var(--color-accent)]"
              />
              <span className="text-xs font-mono text-secondary w-8 text-right">
                {filters.minScore.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Status filter badges */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-tertiary tracking-caps">Status:</label>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((status) => {
                const isActive = filters.statusFilters.includes(status);
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
                    aria-pressed={isActive}
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
                  value={filters.contextFilter}
                  onChange={(e) => updateFilter("contextFilter", e.target.value)}
                  placeholder="Filter by context..."
                  className="input text-xs py-1 w-48 font-mono"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tertiary tracking-caps">Source ID:</label>
              <input
                type="text"
                value={filters.sourceFilter}
                onChange={(e) => updateFilter("sourceFilter", e.target.value)}
                placeholder="Filter by source..."
                className="input text-xs py-1 w-48 font-mono"
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    </form>
  );
}
