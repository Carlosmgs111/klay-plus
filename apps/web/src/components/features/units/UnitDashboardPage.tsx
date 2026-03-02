import { useMemo } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { MetricCard } from "../../shared/MetricCard";
import { StatusBadge } from "../../shared/StatusBadge";
import { SkeletonMetricCards, SkeletonLine } from "../../shared/Skeleton";
import {
  useUnit,
  getUnitSources,
  getUnitProjections,
  getOverallStatus,
  getCurrentVersion,
} from "../../../contexts/UnitContext";

export default function UnitDashboardPage() {
  const { unitId, manifests, loading, error } = useUnit();

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
        className="rounded-lg p-4"
        style={{
          backgroundColor: "var(--semantic-danger-muted)",
          border: "1px solid var(--semantic-danger)",
          borderColor: "rgba(240, 104, 104, 0.2)",
        }}
      >
        <div className="flex items-start gap-3">
          <Icon
            name="alert-circle"
            size={18}
            style={{
              color: "var(--semantic-danger)",
              marginTop: "2px",
              flexShrink: 0,
            }}
          />
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--semantic-danger)" }}
            >
              {error}
            </p>
            <p
              className="text-xs mt-1 font-mono"
              style={{ color: "var(--text-tertiary)" }}
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
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon
            name="layout-dashboard"
            className="text-lg"
            style={{ color: "var(--text-tertiary)" }}
          />
          <h2
            className="text-sm font-semibold"
            style={{
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Unit Dashboard
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

      {/* Sources Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon
              name="database"
              style={{ color: "var(--text-tertiary)" }}
            />
            <h3
              className="text-sm font-semibold"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Sources ({sources.length})
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          {sources.length === 0 ? (
            <div className="text-center py-6">
              <Icon
                name="database"
                className="mx-auto mb-2 text-2xl"
                style={{ color: "var(--text-ghost)" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                No sources added yet.
              </p>
              <a
                href={`/units/${unitId}/sources`}
                className="text-xs mt-1 inline-block"
                style={{ color: "var(--accent-primary)" }}
              >
                Add your first source
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((manifest) => (
                <div
                  key={manifest.sourceId}
                  className="flex items-center justify-between py-2 px-3 -mx-1 rounded-lg"
                  style={{
                    backgroundColor: "var(--surface-0)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="font-mono text-xs truncate"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {manifest.sourceId.length > 16
                        ? `${manifest.sourceId.slice(0, 16)}...`
                        : manifest.sourceId}
                    </span>
                  </div>
                  <StatusBadge status={manifest.status as any} />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="clock" style={{ color: "var(--text-tertiary)" }} />
            <h3
              className="text-sm font-semibold"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Recent Activity
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          {recentActivity.length === 0 ? (
            <p
              className="text-sm text-center py-4"
              style={{ color: "var(--text-tertiary)" }}
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
                        className="text-xs font-mono truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {manifest.sourceId.length > 16
                          ? `${manifest.sourceId.slice(0, 16)}...`
                          : manifest.sourceId}
                      </span>
                      <StatusBadge status={manifest.status as any} />
                    </div>
                    {manifest.completedSteps.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {manifest.completedSteps.map((step, idx) => (
                          <span key={step} className="flex items-center gap-1">
                            {idx > 0 && (
                              <Icon
                                name="chevron-right"
                                style={{ color: "var(--text-ghost)" }}
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
                              style={{ color: "var(--text-ghost)" }}
                            />
                            <span className="badge-failed text-xs">
                              {manifest.failedStep}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-ghost)" }}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="zap" style={{ color: "var(--text-tertiary)" }} />
            <h3
              className="text-sm font-semibold"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Quick Actions
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col gap-3">
            <a
              href={`/units/${unitId}/sources`}
              className="action-card flex items-center p-4 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg"
              style={{ textDecoration: "none" }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon name="folder-plus" className="text-xl mr-2" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Add Source
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Ingest and attach a new source to this unit
                </p>
              </div>
              <Icon
                name="chevron-right"
                className="ml-auto flex-shrink-0 text-xl"
                style={{ color: "var(--text-tertiary)" }}
              />
            </a>

            <a
              href={`/units/${unitId}/sources`}
              className="action-card flex items-center p-4 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg"
              style={{ textDecoration: "none" }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon name="refresh" className="text-xl mr-2" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Reprocess
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Re-run processing with a different profile
                </p>
              </div>
              <Icon
                name="chevron-right"
                className="ml-auto flex-shrink-0 text-xl"
                style={{ color: "var(--text-tertiary)" }}
              />
            </a>

            <a
              href={`/units/${unitId}/search`}
              className="action-card flex items-center p-4 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg"
              style={{ textDecoration: "none" }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon name="search" className="text-xl mr-2" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Search
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Query this unit's semantic knowledge
                </p>
              </div>
              <Icon
                name="chevron-right"
                className="ml-auto flex-shrink-0 text-xl"
                style={{ color: "var(--text-tertiary)" }}
              />
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
