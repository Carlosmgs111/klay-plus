import { useEffect, useMemo, useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { MetricCard } from "../../shared/MetricCard";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonMetricCards, SkeletonLine } from "../../shared/Skeleton";
import type { EnrichedContextSummaryDTO, SourceSummaryDTO } from "@klay/core";

export function DashboardPage() {
  const { mode, service, isInitializing } = useRuntimeMode();
  const [contexts, setContexts] = useState<EnrichedContextSummaryDTO[]>([]);
  const [sources, setSources] = useState<SourceSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    setError(null);
    try {
      const [ctxResult, srcResult] = await Promise.all([
        service.contexts.list(),
        service.sources.list(),
      ]);
      if (ctxResult.success) setContexts(ctxResult.data.contexts);
      if (srcResult.success) setSources(srcResult.data.sources);
      if (!ctxResult.success) {
        setError({ message: ctxResult.error?.message ?? "Failed to load contexts" });
      }
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (service && !isInitializing) {
      loadDashboard();
    }
  }, [service, isInitializing]);

  const totalSources = sources.length;
  const totalContexts = contexts.length;
  const totalProjections = useMemo(
    () => contexts.reduce((sum, c) => sum + c.projectionCount, 0),
    [contexts],
  );
  const extractedSources = useMemo(
    () => sources.filter((s) => s.hasBeenExtracted).length,
    [sources],
  );

  // Top contexts by source count
  const topContexts = useMemo(
    () => [...contexts].sort((a, b) => b.sourceCount - a.sourceCount).slice(0, 5),
    [contexts],
  );

  const maxSourceCount = useMemo(
    () => Math.max(...topContexts.map((c) => c.sourceCount), 1),
    [topContexts],
  );

  if (isInitializing) {
    return (
      <div className="space-y-8 animate-fade-in">
        <SkeletonMetricCards />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <SkeletonLine className="w-1/3 h-5" />
            <SkeletonLine />
            <SkeletonLine className="w-3/4" />
            <SkeletonLine className="w-1/2" />
          </div>
          <div className="card p-6 space-y-4">
            <SkeletonLine className="w-1/3 h-5" />
            <SkeletonLine />
            <SkeletonLine className="w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-primary">
      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <MetricCard label="Sources" value={totalSources} icon="file-text" href="/sources" />
        <MetricCard label="Extracted" value={extractedSources} variant="success" icon="check-circle" href="/sources" />
        <MetricCard label="Contexts" value={totalContexts} icon="brain" href="/contexts" />
        <MetricCard label="Projections" value={totalProjections} icon="layers" href="/contexts" />
      </div>

      {error && <ErrorDisplay {...error} />}

      {/* Top Contexts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contexts by Source Count */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon name="brain" className="text-tertiary" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                Top Contexts by Sources
              </h2>
            </div>
          </CardHeader>
          <CardBody>
            {topContexts.length === 0 ? (
              <p className="text-sm text-ghost">
                No contexts created yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topContexts.map((ctx) => (
                  <a
                    key={ctx.id}
                    href={`/contexts/${ctx.id}/dashboard`}
                    className="block space-y-1 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-secondary truncate max-w-[200px]">
                        {ctx.name || (ctx.id.length > 20 ? `${ctx.id.slice(0, 20)}...` : ctx.id)}
                      </span>
                      <span className="font-mono text-primary font-medium">
                        {ctx.sourceCount}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{
                          width: `${(ctx.sourceCount / maxSourceCount) * 100}%`,
                        }}
                      />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon name="zap" className="text-tertiary" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                Quick Actions
              </h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-4">
              <a href="/documents" className="action-card">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-accent-muted">
                  <Icon name="upload" className="text-lg text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Ingest Document</p>
                  <p className="text-xs text-tertiary mt-0.5">
                    Process and index new documents
                  </p>
                </div>
                <Icon
                  name="chevron-right"
                  className="ml-auto flex-shrink-0 text-tertiary"
                />
              </a>

              <a href="/search" className="action-card">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-accent-muted">
                  <Icon name="search" className="text-lg text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Search Knowledge</p>
                  <p className="text-xs text-tertiary mt-0.5">
                    Query your semantic knowledge base
                  </p>
                </div>
                <Icon
                  name="chevron-right"
                  className="ml-auto flex-shrink-0 text-tertiary"
                />
              </a>

              <a href="/profiles" className="action-card">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-accent-muted">
                  <Icon name="sliders" className="text-lg text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Create Profile</p>
                  <p className="text-xs text-tertiary mt-0.5">
                    Configure chunking and embedding strategies
                  </p>
                </div>
                <Icon
                  name="chevron-right"
                  className="ml-auto flex-shrink-0 text-tertiary"
                />
              </a>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Sources */}
      {sources.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="file-text" className="text-tertiary" />
                <h2 className="text-sm font-semibold text-primary tracking-heading">
                  Recent Sources
                </h2>
              </div>
              {loading && <div className="skeleton w-4 h-4 rounded-full" />}
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-1">
              {sources.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-surface-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {s.name.length > 30 ? `${s.name.slice(0, 30)}...` : s.name}
                    </p>
                    <p className="text-xs text-ghost mt-0.5">{s.type}</p>
                  </div>
                  <span className="text-xs text-tertiary">
                    {new Date(s.registeredAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* System Overview */}
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-lg">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name={mode === "server" ? "server" : "globe"} className="text-xl"/>
        </div>
        <span className="text-sm">
          Running in <span className="font-semibold">{mode} mode</span>
          <span className="mx-1.5">&middot;</span>
          <span>
            {mode === "server"
              ? "Astro API routes + NeDB + OpenAI/Hash embeddings"
              : "Direct import + IndexedDB + WebLLM/Hash embeddings"}
          </span>
        </span>
      </div>
    </div>
  );
}
