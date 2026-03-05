import { useMemo, useState } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { DataTable } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { EmptyState } from "../../shared/EmptyState";
import { SkeletonCard } from "../../shared/Skeleton";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { useUnit, getUnitProjections } from "../../../contexts/UnitContext";

interface ProjectionRow {
  projectionId: string;
  sourceId: string;
  status: "partial" | "complete" | "failed";
  chunksCount?: number;
  dimensions?: number;
  model?: string;
}

export default function UnitProjectionsPage() {
  const { manifests, loading, error } = useUnit();
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const projections = useMemo<ProjectionRow[]>(
    () => getUnitProjections(manifests) as ProjectionRow[],
    [manifests],
  );

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    projections.forEach((p) => sources.add(p.sourceId));
    return Array.from(sources);
  }, [projections]);

  const filteredProjections = useMemo(
    () =>
      sourceFilter === "all"
        ? projections
        : projections.filter((p) => p.sourceId === sourceFilter),
    [projections, sourceFilter],
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
          {row.sourceId.slice(0, 12)}...
        </span>
      ),
    },
    {
      key: "model",
      header: "Model",
      render: (row: ProjectionRow) => (
        <span className="text-xs text-secondary">
          {row.model ?? "—"}
        </span>
      ),
    },
    {
      key: "dimensions",
      header: "Dimensions",
      render: (row: ProjectionRow) => (
        <span className="font-mono text-xs text-secondary">
          {row.dimensions ?? "—"}
        </span>
      ),
    },
    {
      key: "chunksCount",
      header: "Chunks",
      render: (row: ProjectionRow) => (
        <span className="font-mono text-xs text-secondary">
          {row.chunksCount ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: ProjectionRow) => <StatusBadge status={row.status} />,
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
        <ErrorDisplay message={error} code="PROJECTIONS_LOAD_ERROR" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="layers" className="text-tertiary" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                Projections
              </h2>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-surface-3 text-secondary">
                {projections.length}
              </span>
            </div>

            {/* Source filter */}
            {uniqueSources.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-tertiary tracking-caps">
                  Source:
                </label>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <SummaryMetric
                  label="Total Projections"
                  value={String(filteredProjections.length)}
                />
                <SummaryMetric
                  label="Models"
                  value={String(
                    new Set(
                      filteredProjections
                        .map((p) => p.model)
                        .filter(Boolean),
                    ).size,
                  )}
                />
                <SummaryMetric
                  label="Total Chunks"
                  value={String(
                    filteredProjections.reduce(
                      (sum, p) => sum + (p.chunksCount ?? 0),
                      0,
                    ),
                  )}
                />
                <SummaryMetric
                  label="Complete"
                  value={String(
                    filteredProjections.filter((p) => p.status === "complete")
                      .length,
                  )}
                />
              </div>

              {/* Data table */}
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
