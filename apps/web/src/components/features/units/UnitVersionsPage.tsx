import { useMemo } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { StatusBadge } from "../../shared/StatusBadge";
import { SkeletonLine } from "../../shared/Skeleton";
import { RollbackAction } from "../knowledge/RollbackAction";
import {
  useUnit,
  getUnitSources,
  getCurrentVersion,
} from "../../../contexts/UnitContext";

interface VersionGroup {
  versionNumber: number;
  date: string;
  sources: Array<{
    sourceId: string;
    contentHash?: string;
    projectionId: string;
    status: string;
    chunksCount?: number;
    model?: string;
  }>;
  status: string;
}

export default function UnitVersionsPage() {
  const { unitId, manifests, loading, error, refresh } = useUnit();

  const currentVersion = useMemo(
    () => getCurrentVersion(manifests),
    [manifests],
  );

  // Group manifests by creation date to approximate versions.
  // Each distinct createdAt timestamp represents a pipeline run which
  // correlates with a version snapshot.
  const versions = useMemo<VersionGroup[]>(() => {
    if (manifests.length === 0) return [];

    // Sort manifests oldest first
    const sorted = [...manifests].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // Assign version numbers sequentially by unique sourceId
    const versionMap = new Map<number, VersionGroup>();
    sorted.forEach((m, idx) => {
      const versionNumber = idx + 1;
      versionMap.set(versionNumber, {
        versionNumber,
        date: m.createdAt,
        sources: [
          {
            sourceId: m.sourceId,
            contentHash: m.contentHash,
            projectionId: m.projectionId,
            status: m.status,
            chunksCount: m.chunksCount,
            model: m.model,
          },
        ],
        status: m.status,
      });
    });

    // Return as array, newest first
    return Array.from(versionMap.values()).reverse();
  }, [manifests]);

  const estimatedCurrentVersion = manifests.length;

  const handleActionSuccess = () => {
    refresh();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card p-6 space-y-4">
          <SkeletonLine className="w-1/3 h-5" />
          <SkeletonLine />
          <SkeletonLine className="w-3/4" />
          <SkeletonLine className="w-1/2" />
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
              VERSIONS_FETCH_ERROR
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Rollback Action */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Icon name="clock" style={{ color: "var(--text-tertiary)" }} />
          <h2
            className="text-sm font-semibold"
            style={{
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Versions ({versions.length})
          </h2>
        </div>
        <RollbackAction
          unitId={unitId}
          currentVersion={estimatedCurrentVersion}
          onSuccess={handleActionSuccess}
        />
      </div>

      {/* Current Version Info */}
      {currentVersion && (
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "var(--surface-0)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p
                className="text-xs font-medium"
                style={{
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.06em",
                }}
              >
                CURRENT VERSION
              </p>
              <p
                className="font-mono mt-1 text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                {estimatedCurrentVersion}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-medium"
                style={{
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.06em",
                }}
              >
                TOTAL SOURCES
              </p>
              <p
                className="font-mono mt-1 text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                {getUnitSources(manifests).length}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-medium"
                style={{
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.06em",
                }}
              >
                LAST UPDATED
              </p>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {new Date(currentVersion.createdAt).toLocaleDateString(
                  undefined,
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Version Timeline */}
      {versions.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <Icon
                name="clock"
                className="mx-auto mb-3 text-3xl"
                style={{ color: "var(--text-ghost)" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                No version history available.
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-ghost)" }}
              >
                Versions are created when sources are added, removed, or
                reprocessed.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-px"
            style={{ backgroundColor: "var(--border-subtle)" }}
          />

          <div className="space-y-4">
            {versions.map((version) => {
              const isCurrent =
                version.versionNumber === estimatedCurrentVersion;

              return (
                <div key={version.versionNumber} className="relative pl-10">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-2.5 top-4 w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: isCurrent
                        ? "var(--accent-primary)"
                        : "var(--text-ghost)",
                      border: isCurrent
                        ? "2px solid var(--accent-primary)"
                        : "2px solid var(--border-subtle)",
                      boxShadow: isCurrent
                        ? "0 0 0 3px rgba(59, 130, 246, 0.2)"
                        : "none",
                    }}
                  />

                  <Card
                    className={
                      isCurrent
                        ? "border-blue-400 dark:border-blue-500 shadow-sm"
                        : ""
                    }
                  >
                    <CardBody>
                      <div className="space-y-3">
                        {/* Version Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-semibold font-mono"
                              style={{ color: "var(--text-primary)" }}
                            >
                              v{version.versionNumber}
                            </span>
                            {isCurrent && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  backgroundColor:
                                    "rgba(59, 130, 246, 0.15)",
                                  color: "var(--accent-primary)",
                                }}
                              >
                                Current
                              </span>
                            )}
                            <StatusBadge
                              status={version.status as any}
                            />
                          </div>
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-ghost)" }}
                          >
                            {new Date(version.date).toLocaleString()}
                          </span>
                        </div>

                        {/* Sources Snapshot */}
                        <div>
                          <p
                            className="text-xs font-medium mb-2"
                            style={{
                              color: "var(--text-tertiary)",
                              letterSpacing: "0.06em",
                            }}
                          >
                            SOURCES IN THIS VERSION
                          </p>
                          <div className="space-y-2">
                            {version.sources.map((source) => (
                              <div
                                key={source.sourceId}
                                className="p-2 rounded"
                                style={{
                                  backgroundColor: "var(--surface-0)",
                                  border:
                                    "1px solid var(--border-subtle)",
                                }}
                              >
                                <div className="flex items-center gap-2 text-xs">
                                  <span
                                    className="font-mono"
                                    style={{
                                      color: "var(--accent-primary)",
                                    }}
                                  >
                                    {source.sourceId.length > 16
                                      ? `${source.sourceId.slice(0, 16)}...`
                                      : source.sourceId}
                                  </span>
                                  {source.contentHash && (
                                    <span
                                      className="font-mono"
                                      style={{
                                        color: "var(--text-ghost)",
                                      }}
                                    >
                                      #{source.contentHash.slice(0, 8)}
                                    </span>
                                  )}
                                  {source.chunksCount != null && (
                                    <span
                                      style={{
                                        color: "var(--text-tertiary)",
                                      }}
                                    >
                                      {source.chunksCount} chunks
                                    </span>
                                  )}
                                  {source.model && (
                                    <span
                                      style={{
                                        color: "var(--text-tertiary)",
                                      }}
                                    >
                                      {source.model}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
