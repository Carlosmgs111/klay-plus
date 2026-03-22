import { useEffect, useCallback, useState, useMemo } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { MetricCard } from "../../shared/MetricCard";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { OverlayPanel } from "../../shared/OverlayPanel";
import {
  SkeletonMetricCards,
  SkeletonCard,
  SkeletonLine,
} from "../../shared/Skeleton";
import { ProcessAllProfilesAction } from "../knowledge/ProcessAllProfilesAction";
import { SourceDetailView } from "./SourceDetailView";
import type {
  ListSourcesResult,
  SourceSummaryDTO,
  GetSourceInput,
  GetSourceResult,
  GetSourceContextsInput,
  GetSourceContextsResult,
} from "@klay/core";

export function SourcesPage() {
  const { service, isInitializing } = useRuntimeMode();
  const [filterText, setFilterText] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  // Fetch all sources
  const fetchSources = useCallback(
    () => service!.sources.list(),
    [service],
  );
  const { data, error, isLoading, execute } = usePipelineAction(fetchSources);

  useEffect(() => {
    if (service && !isInitializing) {
      execute(undefined as any);
    }
  }, [service, isInitializing]);

  // Filter sources
  const filteredSources = useMemo(() => {
    const sources = data?.sources ?? [];
    if (!filterText.trim()) return sources;
    const lower = filterText.toLowerCase();
    return sources.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.uri.toLowerCase().includes(lower) ||
        s.id.toLowerCase().includes(lower),
    );
  }, [data, filterText]);

  // Metrics
  const metrics = useMemo(() => {
    const sources = data?.sources ?? [];
    const extracted = sources.filter((s) => s.hasBeenExtracted).length;
    return {
      total: data?.total ?? 0,
      extracted,
      pending: sources.length - extracted,
    };
  }, [data]);

  if (isInitializing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonMetricCards count={3} />
        <div className="space-y-4">
          <SkeletonLine className="w-1/3 h-10" />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-primary">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard label="Total Sources" value={metrics.total} icon="database" />
        <MetricCard label="Extracted" value={metrics.extracted} icon="check" />
        <MetricCard label="Pending" value={metrics.pending} icon="clock" />
      </div>

      {error && <ErrorDisplay {...error} />}

      {/* Source List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="database" className="text-tertiary" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                All Sources
              </h2>
              {isLoading && <div className="skeleton w-4 h-4 rounded-full" />}
            </div>
            <span className="text-xs text-tertiary">
              {filteredSources.length} of {data?.total ?? 0} source
              {(data?.total ?? 0) !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          {/* Filter */}
          <div className="relative mb-4">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-tertiary"
            />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter sources by name, URI, or ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-surface-3 border border-default text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
            />
          </div>

          {filteredSources.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Icon name="database" className="text-3xl text-tertiary" />
              </div>
              {(data?.total ?? 0) === 0 ? (
                <>
                  <p className="text-sm text-secondary">No sources yet</p>
                  <a
                    href="/documents"
                    className="text-xs mt-2 inline-block text-accent hover:opacity-80 transition-opacity duration-fast"
                  >
                    Ingest your first document to create a source
                  </a>
                </>
              ) : (
                <p className="text-sm text-secondary">
                  No sources match "{filterText}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSources.map((source) => (
                <SourceCard
                  key={source.id}
                  source={source}
                  onClick={() => setSelectedSourceId(source.id)}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Source Detail Overlay */}
      <OverlayPanel
        open={selectedSourceId !== null}
        setOpen={(v) => { if (!v) setSelectedSourceId(null); }}
        icon="database"
        title="Source Details"
        width="w-[520px]"
      >
        {selectedSourceId && (
          <SourceDetailView
            sourceId={selectedSourceId}
            onAddedToContext={() => {
              setSelectedSourceId(null);
              execute(undefined as any);
            }}
          />
        )}
      </OverlayPanel>
    </div>
  );
}

// ── SourceCard (inline) ────────────────────────────────────────────

function SourceCard({
  source,
  onClick,
}: {
  source: SourceSummaryDTO;
  onClick: () => void;
}) {
  const truncatedId =
    source.id.length > 12 ? `${source.id.slice(0, 12)}...` : source.id;

  const formattedDate = new Date(source.registeredAt).toLocaleDateString(
    undefined,
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="block w-full text-left group cursor-pointer"
    >
      <Card className="transition-all duration-150 ease-in-out group-hover:border-accent group-hover:shadow-md p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon name="file-text" className="text-lg text-tertiary" />
              <h3 className="text-sm font-semibold truncate text-primary">
                {source.name}
              </h3>
            </div>

            <p className="mt-1 text-xs text-tertiary font-mono truncate">
              {source.uri}
            </p>

            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Icon name="hash" className="text-sm text-tertiary" />
                <span className="text-xs text-secondary">{truncatedId}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Icon name="file-text" className="text-sm text-tertiary" />
                <span className="text-xs text-secondary">{source.type}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Icon name="clock" className="text-sm text-tertiary" />
                <span className="text-xs text-secondary">{formattedDate}</span>
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-2 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {source.hasBeenExtracted && (
              <ProcessAllProfilesAction sourceId={source.id} />
            )}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                source.hasBeenExtracted
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-500"
              }`}
            >
              {source.hasBeenExtracted ? "Extracted" : "Pending"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
