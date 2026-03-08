import { useMemo } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { MetricCard } from "../../shared/MetricCard";
import { StatusBadge } from "../../shared/StatusBadge";
// STANDBY: Overlay and AddSourceUploadForm removed — add-source moved to Sources page
// import { Overlay } from "../../shared/Overlay";
// import { AddSourceUploadForm } from "../knowledge/AddSourceUploadForm";
// STANDBY: Action buttons moved to ContextActionsMenu in Header
// import { ArchiveContextAction } from "../knowledge/ArchiveContextAction";
// import { DeprecateContextAction } from "../knowledge/DeprecateContextAction";
// import { ActivateContextAction } from "../knowledge/ActivateContextAction";
import { SkeletonMetricCards, SkeletonLine } from "../../shared/Skeleton";
import { RelatedContexts } from "../knowledge/RelatedContexts";
import {
  useKnowledgeContext,
  getUnitSources,
  getUnitProjections,
  getOverallStatus,
  getCurrentVersion,
} from "../../../contexts/KnowledgeContextContext";

export default function ContextDashboardPage() {
  const { contextId, manifests, loading, error } = useKnowledgeContext();

  const sources = useMemo(() => getUnitSources(manifests), [manifests]);
  const projections = useMemo(() => getUnitProjections(manifests), [manifests]);
  const overallStatus = useMemo(() => getOverallStatus(manifests), [manifests]);
  const currentVersion = useMemo(() => getCurrentVersion(manifests), [manifests]);

  const totalChunks = useMemo(
    () => projections.reduce((sum, p) => sum + (p.chunksCount ?? 0), 0),
    [projections],
  );

  const recentActivity = useMemo(() => {
    return [...manifests]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [manifests]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonMetricCards count={4} />
        <div className="card p-6 space-y-4">
          <SkeletonLine className="w-1/3 h-5" />
          <SkeletonLine />
          <SkeletonLine className="w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg p-4 bg-danger-muted border border-danger"
      >
        <div className="flex items-start gap-3">
          <Icon
            name="alert-circle"
            className="text-danger mt-0.5 flex-shrink-0"
          />
          <div>
            <p
              className="text-sm font-medium text-danger"
            >
              {error}
            </p>
            <p
              className="text-xs mt-1 font-mono text-tertiary"
            >
              UNIT_FETCH_ERROR
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Header — read-only, actions moved to ContextActionsMenu in Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon
            name="layout-dashboard"
            className="text-lg text-tertiary"
          />
          <h2
            className="text-sm font-semibold text-primary tracking-heading"
          >
            Overview
          </h2>
        </div>
        <StatusBadge status={overallStatus} />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Sources"
          value={sources.length}
          icon="database"
        />
        <MetricCard
          label="Projections"
          value={projections.length}
          icon="layers"
        />
        <MetricCard
          label="Version"
          value={currentVersion ? manifests.length : 0}
          icon="history"
        />
        <MetricCard
          label="Chunks"
          value={totalChunks}
          icon="file-text"
        />
      </div>

      {/* Sources Summary — read-only */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Icon
                name="database"
                className="text-tertiary"
              />
              <h3
                className="text-sm font-semibold text-primary tracking-heading"
              >
                Sources ({sources.length})
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {sources.length === 0 ? (
            <div className="text-center py-6">
              <Icon
                name="database"
                className="mx-auto mb-2 text-2xl text-ghost"
              />
              <p
                className="text-sm text-tertiary"
              >
                No sources added yet.
              </p>
              <a
                href={`/contexts/${contextId}/sources`}
                className="text-xs mt-1 inline-block text-accent hover:underline"
              >
                Go to Sources to add one
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((manifest) => (
                <div
                  key={manifest.sourceId}
                  className="flex items-center justify-between py-2 px-3 -mx-1 rounded-lg bg-surface-0 border border-subtle"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="font-mono text-xs truncate text-accent"
                    >
                      {manifest.sourceId.length > 16
                        ? `${manifest.sourceId.slice(0, 16)}...`
                        : manifest.sourceId}
                    </span>
                  </div>
                  <StatusBadge status={manifest.status} />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Related Contexts */}
      <RelatedContexts contextId={contextId} />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="clock" className="text-tertiary" />
            <h3
              className="text-sm font-semibold text-primary tracking-heading"
            >
              Recent Activity
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          {recentActivity.length === 0 ? (
            <p
              className="text-sm text-center py-4 text-tertiary"
            >
              No activity recorded yet.
            </p>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((manifest) => (
                <div
                  key={manifest.id}
                  className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-mono truncate text-secondary"
                      >
                        {manifest.sourceId.length > 16
                          ? `${manifest.sourceId.slice(0, 16)}...`
                          : manifest.sourceId}
                      </span>
                      <StatusBadge status={manifest.status} />
                    </div>
                    {manifest.completedSteps.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {manifest.completedSteps.map((step, idx) => (
                          <span key={step} className="flex items-center gap-1">
                            {idx > 0 && (
                              <Icon
                                name="chevron-right"
                                className="text-ghost"
                              />
                            )}
                            <span className="badge-complete text-xs">
                              {step}
                            </span>
                          </span>
                        ))}
                        {manifest.failedStep && (
                          <>
                            <Icon
                              name="chevron-right"
                              className="text-ghost"
                            />
                            <span className="badge-failed text-xs">
                              {manifest.failedStep}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <p
                      className="text-xs mt-1 text-ghost"
                    >
                      {new Date(manifest.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* STANDBY: Quick Actions card removed — actions now in ContextActionsMenu (Header) and Sources page */}
      {/* STANDBY: Add Source Overlay removed — available on Sources page */}
    </div>
  );
}
