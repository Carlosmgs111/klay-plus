import { useEffect, useCallback, useMemo } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { MetricCard } from "../../shared/MetricCard";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { StatusBadge } from "../../shared/StatusBadge";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonMetricCards, SkeletonLine } from "../../shared/Skeleton";
import type { GetManifestInput } from "@klay/core";

export function DashboardPage() {
  const { mode, service, isInitializing } = useRuntimeMode();

  const fetchManifests = useCallback(
    (input: GetManifestInput) => service!.getManifest(input),
    [service]
  );

  const { data, error, isLoading, execute } = usePipelineAction(fetchManifests);

  useEffect(() => {
    if (service && !isInitializing) {
      execute({});
    }
  }, [service, isInitializing]);

  const manifests = data?.manifests ?? [];
  const totalDocs = manifests.length;
  const totalChunks = manifests.reduce(
    (sum, m) => sum + (m.chunksCount ?? 0),
    0
  );
  const completed = manifests.filter((m) => m.status === "complete").length;
  const failed = manifests.filter((m) => m.status === "failed").length;

  // Unique contexts from manifests
  const uniqueContextIds = useMemo(() => {
    const ids = new Set<string>();
    manifests.forEach((m) => {
      if (m.contextId) ids.add(m.contextId);
    });
    return ids;
  }, [manifests]);

  // Top contexts by source count
  const topContexts = useMemo(() => {
    const contextSourceMap = new Map<string, Set<string>>();
    manifests.forEach((m) => {
      if (!m.contextId) return;
      if (!contextSourceMap.has(m.contextId)) {
        contextSourceMap.set(m.contextId, new Set());
      }
      contextSourceMap.get(m.contextId)!.add(m.sourceId);
    });

    return Array.from(contextSourceMap.entries())
      .map(([contextId, sourceIds]) => ({
        contextId,
        sourceCount: sourceIds.size,
      }))
      .sort((a, b) => b.sourceCount - a.sourceCount)
      .slice(0, 5);
  }, [manifests]);

  // Most recent failed manifest
  const lastError = useMemo(() => {
    const failedManifests = manifests
      .filter((m) => m.status === "failed")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return failedManifests.length > 0 ? failedManifests[0] : null;
  }, [manifests]);

  // Max source count for bar scaling
  const maxSourceCount = useMemo(
    () => Math.max(...topContexts.map((c) => c.sourceCount), 1),
    [topContexts]
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        <MetricCard label="Documents" value={totalDocs} icon="file-text" />
        <MetricCard label="Chunks" value={totalChunks} icon="layers" />
        <MetricCard label="Contexts" value={uniqueContextIds.size} icon="database" />
        <MetricCard
          label="Completed"
          value={completed}
          variant="success"
          icon="check-circle"
        />
        <MetricCard
          label="Failed"
          value={failed}
          variant="danger"
          icon="x-circle"
        />
      </div>

      {error && <ErrorDisplay {...error} />}

      {/* Context Distribution + Last Error row */}
      {manifests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Contexts by Source Count */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon name="database" className="text-tertiary" />
                <h2 className="text-sm font-semibold text-primary tracking-heading">
                  Top Contexts by Sources
                </h2>
              </div>
            </CardHeader>
            <CardBody>
              {topContexts.length === 0 ? (
                <p className="text-sm text-ghost">
                  No contexts found in manifests.
                </p>
              ) : (
                <div className="space-y-3">
                  {topContexts.map((ctx) => (
                    <div key={ctx.contextId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-secondary truncate max-w-[200px]">
                          {ctx.contextId.length > 20
                            ? `${ctx.contextId.slice(0, 20)}...`
                            : ctx.contextId}
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
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Last Pipeline Error */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon name="alert-triangle" className="text-tertiary" />
                <h2 className="text-sm font-semibold text-primary tracking-heading">
                  Last Pipeline Error
                </h2>
              </div>
            </CardHeader>
            <CardBody>
              {!lastError ? (
                <div className="text-center py-6">
                  <Icon name="check-circle" className="mx-auto mb-2 text-2xl text-success" />
                  <p className="text-sm text-ghost">No recent errors</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-tertiary">Source: </span>
                      <span className="font-mono text-secondary">
                        {lastError.sourceId.length > 16
                          ? `${lastError.sourceId.slice(0, 16)}...`
                          : lastError.sourceId}
                      </span>
                    </div>
                    <div>
                      <span className="text-tertiary">Date: </span>
                      <span className="text-secondary">
                        {new Date(lastError.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {lastError.failedStep && (
                      <div className="col-span-2">
                        <span className="text-tertiary">Failed Step: </span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-danger-muted text-danger">
                          {lastError.failedStep}
                        </span>
                      </div>
                    )}
                  </div>
                  {lastError.completedSteps.length > 0 && (
                    <div className="pt-2 border-t border-subtle">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lastError.completedSteps.map((step, idx) => (
                          <span key={step} className="flex items-center gap-1">
                            {idx > 0 && (
                              <Icon name="chevron-right" className="text-ghost" />
                            )}
                            <span className="badge-complete text-xs">{step}</span>
                          </span>
                        ))}
                        {lastError.failedStep && (
                          <>
                            <Icon name="chevron-right" className="text-ghost" />
                            <span className="badge-failed text-xs">
                              {lastError.failedStep}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Pipeline Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="zap" className="text-tertiary" />
                <h2 className="text-sm font-semibold text-primary tracking-heading">
                  Pipeline Status
                </h2>
              </div>
              {isLoading && <div className="skeleton w-4 h-4 rounded-full" />}
            </div>
          </CardHeader>
          <CardBody>
            {manifests.length === 0 ? (
              <div className="text-center py-8 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-accent-muted">
                  <Icon name="file-text" className="text-3xl text-accent animate-float" />
                </div>
                <p className="text-sm font-medium text-primary">No documents processed yet</p>
                <a
                  href="/documents"
                  className="text-sm mt-2 inline-block text-accent font-medium hover:underline"
                >
                  Ingest your first document &rarr;
                </a>
              </div>
            ) : (
              <div className="space-y-1">
                {manifests.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-surface-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {m.sourceId.length > 24
                          ? `${m.sourceId.slice(0, 24)}...`
                          : m.sourceId}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {m.completedSteps.map((step, idx) => (
                          <span key={step} className="flex items-center gap-1">
                            {idx > 0 && <Icon name="chevron-right" />}
                            <span className="text-xs font-mono">{step}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <StatusBadge status={m.status as any} />
                  </div>
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
