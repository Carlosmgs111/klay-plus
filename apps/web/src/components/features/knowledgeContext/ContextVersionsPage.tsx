import { useMemo } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { StatusBadge } from "../../shared/StatusBadge";
import { SkeletonLine } from "../../shared/Skeleton";
import { RollbackAction } from "../knowledge/RollbackAction";
import {
  useKnowledgeContext,
  getUnitSources,
  getCurrentVersion,
} from "../../../contexts/KnowledgeContextContext";

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

// Each manifest maps to one pipeline run. "removed" would require
// aggregate version snapshots which the current data model doesn't provide.
type DiffTag = "added" | "unchanged";

interface SourceWithDiff {
  sourceId: string;
  contentHash?: string;
  projectionId: string;
  status: string;
  chunksCount?: number;
  model?: string;
  diff: DiffTag;
}

export default function UnitVersionsPage() {
  const { contextId, manifests, loading, error, refresh } = useKnowledgeContext();

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

  // Compute diffs: for each version, tag its sources as added/removed/unchanged
  // relative to the cumulative set of sourceIds from prior versions.
  const versionDiffs = useMemo<Map<number, SourceWithDiff[]>>(() => {
    const diffMap = new Map<number, SourceWithDiff[]>();

    // Iterate chronologically (oldest first)
    const chronological = [...versions].reverse();
    const cumulativeSources = new Set<string>();

    for (const version of chronological) {
      const currentSourceIds = new Set(version.sources.map((s) => s.sourceId));
      const sourcesWithDiff: SourceWithDiff[] = version.sources.map((s) => ({
        ...s,
        diff: cumulativeSources.has(s.sourceId) ? "unchanged" as DiffTag : "added" as DiffTag,
      }));

      // Add current sources to cumulative set
      for (const sid of currentSourceIds) {
        cumulativeSources.add(sid);
      }

      diffMap.set(version.versionNumber, sourcesWithDiff);
    }

    return diffMap;
  }, [versions]);

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
      <div className="rounded-lg p-4 bg-danger-muted border border-danger">
        <div className="flex items-start gap-3">
          <Icon
            name="alert-circle"
            className="text-danger mt-0.5 flex-shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-danger">
              {error}
            </p>
            <p className="text-xs mt-1 font-mono text-tertiary">
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
          <Icon name="clock" className="text-tertiary" />
          <h2 className="text-sm font-semibold text-primary tracking-heading">
            Versions ({versions.length})
          </h2>
        </div>
        <RollbackAction
          contextId={contextId}
          currentVersion={estimatedCurrentVersion}
          onSuccess={handleActionSuccess}
        />
      </div>

      {/* Current Version Info */}
      {currentVersion && (
        <div className="p-4 rounded-lg bg-surface-0 border border-subtle">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-tertiary tracking-caps">
                CURRENT VERSION
              </p>
              <p className="font-mono mt-1 text-lg text-primary">
                {estimatedCurrentVersion}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-tertiary tracking-caps">
                TOTAL SOURCES
              </p>
              <p className="font-mono mt-1 text-lg text-primary">
                {getUnitSources(manifests).length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-tertiary tracking-caps">
                LAST UPDATED
              </p>
              <p className="mt-1 text-sm text-primary">
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
                className="mx-auto mb-3 text-3xl text-ghost"
              />
              <p className="text-sm text-tertiary">
                No version history available.
              </p>
              <p className="text-xs mt-1 text-ghost">
                Versions are created when sources are added, removed, or
                reprocessed.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--border-subtle)]" />

          <div className="space-y-4">
            {versions.map((version) => {
              const isCurrent =
                version.versionNumber === estimatedCurrentVersion;
              const sourcesWithDiff =
                versionDiffs.get(version.versionNumber) ?? [];

              return (
                <div key={version.versionNumber} className="relative pl-10">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 transition-all
                      ${isCurrent
                        ? "bg-accent border-accent shadow-[0_0_0_3px_var(--accent-primary-glow)]"
                        : "bg-surface-2 border-subtle"
                      }`}
                  />

                  <Card
                    className={
                      isCurrent
                        ? "border-accent shadow-sm"
                        : ""
                    }
                  >
                    <CardBody>
                      <div className="space-y-3">
                        {/* Version Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold font-mono text-primary">
                              v{version.versionNumber}
                            </span>
                            {isCurrent && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--accent-primary-glow)] text-accent">
                                Current
                              </span>
                            )}
                            <StatusBadge
                              status={version.status as any}
                            />
                          </div>
                          <span className="text-xs text-ghost">
                            {new Date(version.date).toLocaleString()}
                          </span>
                        </div>

                        {/* Sources Snapshot with Diffs */}
                        <div>
                          <p className="text-xs font-medium mb-2 text-tertiary tracking-caps">
                            SOURCES IN THIS VERSION
                          </p>
                          <div className="space-y-2">
                            {sourcesWithDiff.map((source) => (
                              <div
                                key={source.sourceId}
                                className={`p-2 rounded border ${
                                  source.diff === "added"
                                    ? "bg-success-muted/30 border-success/30"
                                    : "bg-surface-0 border-subtle"
                                }`}
                              >
                                <div className="flex items-center gap-2 text-xs">
                                  {/* Diff badge */}
                                  {source.diff === "added" && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-success-muted text-success">
                                      + New
                                    </span>
                                  )}
                                  <span className="font-mono text-accent">
                                    {source.sourceId.length > 16
                                      ? `${source.sourceId.slice(0, 16)}...`
                                      : source.sourceId}
                                  </span>
                                  {source.contentHash && (
                                    <span className="font-mono text-ghost">
                                      #{source.contentHash.slice(0, 8)}
                                    </span>
                                  )}
                                  {source.chunksCount != null && (
                                    <span className="text-tertiary">
                                      {source.chunksCount} chunks
                                    </span>
                                  )}
                                  {source.model && (
                                    <span className="text-tertiary">
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
