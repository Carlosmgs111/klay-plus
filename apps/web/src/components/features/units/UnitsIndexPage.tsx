import { useEffect, useCallback, useState, useMemo } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { MetricCard } from "../../shared/MetricCard";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import {
  SkeletonMetricCards,
  SkeletonCard,
  SkeletonLine,
} from "../../shared/Skeleton";
import UnitCard from "./UnitCard";
import type { GetManifestInput, ContentManifestEntry } from "@klay/core";

export default function UnitsIndexPage() {
  const { service, isInitializing } = useRuntimeMode();
  const [filterText, setFilterText] = useState("");

  const fetchManifests = useCallback(
    (input: GetManifestInput) => service!.getManifest(input),
    [service],
  );

  const { data, error, isLoading, execute } = usePipelineAction(fetchManifests);

  useEffect(() => {
    if (service && !isInitializing) {
      execute({});
    }
  }, [service, isInitializing]);

  // Group manifests by semanticUnitId
  const manifestsByUnit = useMemo(() => {
    const map = new Map<string, ContentManifestEntry[]>();
    for (const manifest of data?.manifests ?? []) {
      const group = map.get(manifest.semanticUnitId) ?? [];
      group.push(manifest);
      map.set(manifest.semanticUnitId, group);
    }
    return map;
  }, [data]);

  // Apply filter
  const filteredUnitIds = useMemo(() => {
    const allIds = Array.from(manifestsByUnit.keys());
    if (!filterText.trim()) return allIds;
    const lower = filterText.toLowerCase();
    return allIds.filter((id) => id.toLowerCase().includes(lower));
  }, [manifestsByUnit, filterText]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const allManifests = data?.manifests ?? [];
    const uniqueSources = new Set(allManifests.map((m) => m.sourceId));
    const uniqueProjections = new Set(
      allManifests.filter((m) => m.projectionId).map((m) => m.projectionId),
    );
    return {
      totalUnits: manifestsByUnit.size,
      totalSources: uniqueSources.size,
      totalProjections: uniqueProjections.size,
    };
  }, [data, manifestsByUnit]);

  if (isInitializing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonMetricCards count={3} />
        <div className="space-y-4">
          <SkeletonLine className="w-1/3 h-10" />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-800 dark:text-slate-200">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          label="Semantic Units"
          value={metrics.totalUnits}
          icon="brain"
        />
        <MetricCard
          label="Total Sources"
          value={metrics.totalSources}
          icon="database"
        />
        <MetricCard
          label="Total Projections"
          value={metrics.totalProjections}
          icon="layers"
        />
      </div>

      {error && <ErrorDisplay {...error} />}

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="brain" style={{ color: "var(--text-tertiary)" }} />
              <h2
                className="text-sm font-semibold"
                style={{
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                All Units
              </h2>
              {isLoading && (
                <div className="skeleton w-4 h-4 rounded-full" />
              )}
            </div>
            <span
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              {filteredUnitIds.length} of {manifestsByUnit.size} unit
              {manifestsByUnit.size !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="relative mb-4">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--text-tertiary)" }}
            />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter units by ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-150"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          {filteredUnitIds.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Icon
                  name="brain"
                  className="text-3xl"
                  style={{ color: "var(--text-tertiary)" }}
                />
              </div>
              {manifestsByUnit.size === 0 ? (
                <>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    No semantic units yet
                  </p>
                  <a
                    href="/documents"
                    className="text-xs mt-2 inline-block"
                    style={{
                      color: "var(--accent-primary)",
                      transition: "opacity 150ms",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    Ingest your first document to create a unit
                  </a>
                </>
              ) : (
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No units match "{filterText}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUnitIds.map((unitId) => (
                <UnitCard
                  key={unitId}
                  unitId={unitId}
                  manifests={manifestsByUnit.get(unitId) ?? []}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
