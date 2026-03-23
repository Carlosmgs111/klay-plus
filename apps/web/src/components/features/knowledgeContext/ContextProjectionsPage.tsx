import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { DataTable } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { EmptyState } from "../../shared/EmptyState";
import { SkeletonCard } from "../../shared/Skeleton";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { LoadingButton } from "../../shared/LoadingButton";
import { ProcessAllProfilesAction } from "../knowledge/ProcessAllProfilesAction";
import { useKnowledgeContext } from "../../../contexts/KnowledgeContextContext";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import type { ReconcileAllProfilesInput } from "@klay/core";

interface ProjectionRow {
  projectionId: string;
  processingProfileId: string;
  sourceId: string;
  sourceName: string;
  isRequiredProfile: boolean;
  chunksCount: number;
  dimensions: number;
  model: string;
}

export default function UnitProjectionsPage() {
  const { contextId, detail, loading, error, refresh } = useKnowledgeContext();
  const { service } = useRuntimeMode();
  const { addToast } = useToast();

  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [activeProfiles, setActiveProfiles] = useState<Array<{ id: string; name: string }>>([]);

  const sources = detail?.sources ?? [];
  const requiredProfileId = detail?.requiredProfileId ?? "";

  // Load active profiles for coverage matrix columns
  useEffect(() => {
    if (!service || !detail) return;
    service.listProfiles().then((result) => {
      if (result.success && result.data) {
        setActiveProfiles(result.data.profiles.filter((p) => p.status === "ACTIVE"));
      }
    });
  }, [service, detail]);

  // "Fill all gaps" — reconcile all active profiles for all sources in context
  const reconcileAllAction = useCallback(
    (input: ReconcileAllProfilesInput) => service!.reconcileAllProfiles(input),
    [service],
  );
  const { isLoading: isReconciling, execute: executeReconcileAll } = useServiceAction(reconcileAllAction);

  const handleFillAllGaps = async () => {
    const result = await executeReconcileAll({ contextId });
    if (result) {
      addToast(
        `Gaps filled: ${result.totalProcessed} processed across ${result.profileResults.length} profiles`,
        result.totalFailed === 0 ? "success" : "error",
      );
      refresh();
    }
  };

  // Flatten sources × projections → flat list rows
  const projections = useMemo<ProjectionRow[]>(() => {
    return sources.flatMap((s) =>
      (s.projections ?? []).map((p) => ({
        projectionId: p.projectionId,
        processingProfileId: p.processingProfileId,
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        isRequiredProfile: p.processingProfileId === requiredProfileId,
        chunksCount: p.chunksCount,
        dimensions: p.dimensions,
        model: p.model,
      })),
    );
  }, [sources, requiredProfileId]);

  const uniqueSources = useMemo(() => {
    const srcs = new Set<string>();
    projections.forEach((p) => srcs.add(p.sourceId));
    return Array.from(srcs);
  }, [projections]);

  const uniqueProfiles = useMemo(() => {
    const ids = new Set<string>();
    projections.forEach((p) => ids.add(p.processingProfileId));
    return Array.from(ids);
  }, [projections]);

  const filteredProjections = useMemo(() => {
    let result = projections;
    if (sourceFilter !== "all") result = result.filter((p) => p.sourceId === sourceFilter);
    if (profileFilter !== "all") result = result.filter((p) => p.processingProfileId === profileFilter);
    return result;
  }, [projections, sourceFilter, profileFilter]);

  // Coverage matrix: sources × activeProfiles
  const coverageMatrix = useMemo(() => {
    return sources.map((source) => ({
      sourceId: source.sourceId,
      sourceName: source.sourceName,
      coverage: activeProfiles.map((profile) => ({
        profileId: profile.id,
        profileName: profile.name,
        isRequired: profile.id === requiredProfileId,
        hasProjection: (source.projections ?? []).some(
          (p) => p.processingProfileId === profile.id,
        ),
      })),
    }));
  }, [sources, activeProfiles, requiredProfileId]);

  const fullyCoveredCount = coverageMatrix.filter(
    (s) => s.coverage.length === 0 || s.coverage.every((c) => c.hasProjection),
  ).length;

  const totalGaps = coverageMatrix.reduce(
    (sum, s) => sum + s.coverage.filter((c) => !c.hasProjection).length,
    0,
  );

  const columns = [
    {
      key: "projectionId",
      header: "Projection ID",
      render: (row: ProjectionRow) => (
        <span className="font-mono text-xs text-primary">
          {row.projectionId.slice(0, 12)}...
        </span>
      ),
    },
    {
      key: "sourceId",
      header: "Source",
      render: (row: ProjectionRow) => (
        <span className="font-mono text-xs text-secondary">
          {row.sourceName.length > 20 ? `${row.sourceName.slice(0, 20)}...` : row.sourceName}
        </span>
      ),
    },
    {
      key: "processingProfileId",
      header: "Profile",
      render: (row: ProjectionRow) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
          {row.processingProfileId}
          {row.isRequiredProfile && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-muted text-accent">
              required
            </span>
          )}
        </span>
      ),
    },
    {
      key: "model",
      header: "Model",
      render: (row: ProjectionRow) => (
        <span className="text-xs text-secondary">{row.model}</span>
      ),
    },
    {
      key: "dimensions",
      header: "Dimensions",
      render: (row: ProjectionRow) => (
        <span className="font-mono text-xs text-secondary">{row.dimensions}</span>
      ),
    },
    {
      key: "chunksCount",
      header: "Chunks",
      render: (row: ProjectionRow) => (
        <span className="font-mono text-xs text-secondary">{row.chunksCount}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: () => <StatusBadge status="complete" />,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorDisplay message={error.message} code={error.code} />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Coverage Matrix */}
      {activeProfiles.length > 0 && sources.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Icon name="grid" className="text-tertiary" />
                <h2 className="text-sm font-semibold text-primary tracking-heading">
                  Coverage Matrix
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-surface-3 text-secondary">
                  {fullyCoveredCount}/{sources.length} fully covered
                </span>
                {totalGaps > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-warning-muted text-warning">
                    {totalGaps} gap{totalGaps !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {totalGaps > 0 && (
                <LoadingButton
                  variant="secondary"
                  size="sm"
                  loading={isReconciling}
                  loadingText="Filling gaps..."
                  onClick={handleFillAllGaps}
                >
                  <span className="flex items-center gap-1">
                    <Icon name="zap" /> Fill all gaps
                  </span>
                </LoadingButton>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="text-left py-2 pr-6 font-medium text-tertiary tracking-caps">
                      SOURCE
                    </th>
                    {activeProfiles.map((profile) => (
                      <th
                        key={profile.id}
                        className="text-center py-2 px-3 font-medium text-tertiary min-w-[90px]"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-secondary truncate max-w-[80px]" title={profile.name}>
                            {profile.name.length > 10 ? `${profile.name.slice(0, 10)}…` : profile.name}
                          </span>
                          {profile.id === requiredProfileId && (
                            <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-accent-muted text-accent">
                              req
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="py-2 pl-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {coverageMatrix.map((row) => {
                    const rowGaps = row.coverage.filter((c) => !c.hasProjection).length;
                    return (
                      <tr
                        key={row.sourceId}
                        className="border-b border-subtle last:border-0 hover:bg-surface-1 transition-colors"
                      >
                        <td className="py-2.5 pr-6">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-primary">
                              {row.sourceName.length > 24
                                ? `${row.sourceName.slice(0, 24)}…`
                                : row.sourceName}
                            </span>
                            <span className="font-mono text-ghost text-[10px]">
                              {row.sourceId.slice(0, 16)}…
                            </span>
                          </div>
                        </td>
                        {row.coverage.map((cell) => (
                          <td key={cell.profileId} className="text-center py-2.5 px-3">
                            {cell.hasProjection ? (
                              <Icon name="check" className="w-4 h-4 text-green-500 mx-auto" />
                            ) : (
                              <Icon name="minus" className="w-4 h-4 text-ghost mx-auto" />
                            )}
                          </td>
                        ))}
                        <td className="py-2.5 pl-3">
                          {rowGaps > 0 && (
                            <ProcessAllProfilesAction
                              sourceId={row.sourceId}
                              onSuccess={refresh}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Projections flat list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Icon name="layers" className="text-tertiary" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                Projections
              </h2>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-surface-3 text-secondary">
                {projections.length}
              </span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              {uniqueProfiles.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-tertiary tracking-caps">Profile:</label>
                  <select
                    value={profileFilter}
                    onChange={(e) => setProfileFilter(e.target.value)}
                    className="input text-xs py-1 px-2"
                  >
                    <option value="all">All profiles</option>
                    {uniqueProfiles.map((pid) => (
                      <option key={pid} value={pid}>{pid}</option>
                    ))}
                  </select>
                </div>
              )}
              {uniqueSources.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-tertiary tracking-caps">Source:</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="input text-xs py-1 px-2"
                  >
                    <option value="all">All sources</option>
                    {uniqueSources.map((sid) => (
                      <option key={sid} value={sid}>
                        {sid.slice(0, 12)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {projections.length === 0 ? (
            <EmptyState
              title="No projections"
              description="This unit has no projections yet. Projections are created when a source is processed through the pipeline."
              icon="layers"
            />
          ) : (
            <>
              {/* Summary metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                <SummaryMetric
                  label="Total Projections"
                  value={String(filteredProjections.length)}
                />
                <SummaryMetric
                  label="Profiles"
                  value={String(uniqueProfiles.length)}
                />
                <SummaryMetric
                  label="Models"
                  value={String(
                    new Set(filteredProjections.map((p) => p.model)).size,
                  )}
                />
                <SummaryMetric
                  label="Total Chunks"
                  value={String(
                    filteredProjections.reduce((sum, p) => sum + p.chunksCount, 0),
                  )}
                />
                <SummaryMetric
                  label="Sources"
                  value={String(uniqueSources.length)}
                />
              </div>

              <DataTable
                columns={columns}
                rows={filteredProjections}
                keyExtractor={(row) => row.projectionId}
                emptyMessage="No projections match the current filter."
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg text-center bg-surface-1">
      <p className="text-lg font-semibold font-mono text-primary">
        {value}
      </p>
      <p className="text-xs mt-0.5 text-tertiary tracking-caps">
        {label}
      </p>
    </div>
  );
}
