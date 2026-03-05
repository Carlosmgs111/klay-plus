import { useEffect, useCallback } from "react";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard label="Documents" value={totalDocs} icon="file-text" />
        <MetricCard label="Chunks" value={totalChunks} icon="layers" />
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
