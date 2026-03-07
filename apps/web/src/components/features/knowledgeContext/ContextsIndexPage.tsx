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
import type { GetManifestInput, ContentManifestEntry } from "@klay/core";
import ContextCard from "./ContextCard";

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

  // Group manifests by contextId (the unit/context they belong to)
  const manifestsByUnit = useMemo(() => {
    const map = new Map<string, ContentManifestEntry[]>();
    for (const manifest of data?.manifests ?? []) {
      if (!manifest.contextId) continue;
      const group = map.get(manifest.contextId) ?? [];
      group.push(manifest);
      map.set(manifest.contextId, group);
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
    <div className="space-y-8 text-primary">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          label="Contexts"
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
              <Icon name="brain" className="text-tertiary" />
              <h2
                className="text-sm font-semibold text-primary tracking-heading"
              >
                All Contexts
              </h2>
              {isLoading && (
                <div className="skeleton w-4 h-4 rounded-full" />
              )}
            </div>
            <span
              className="text-xs text-tertiary"
            >
              {filteredUnitIds.length} of {manifestsByUnit.size} context
              {manifestsByUnit.size !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="relative mb-4">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-tertiary"
            />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter contexts by ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-surface-3 border border-default text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
            />
          </div>

          {filteredUnitIds.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Icon
                  name="brain"
                  className="text-3xl text-tertiary"
                />
              </div>
              {manifestsByUnit.size === 0 ? (
                <>
                  <p
                    className="text-sm text-secondary"
                  >
                    No contexts yet
                  </p>
                  <a
                    href="/documents"
                    className="text-xs mt-2 inline-block text-accent hover:opacity-80 transition-opacity duration-fast"
                  >
                    Ingest your first document to create a context
                  </a>
                </>
              ) : (
                <p
                  className="text-sm text-secondary"
                >
                  No contexts match "{filterText}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUnitIds.map((contextId) => (
                <ContextCard
                  key={contextId}
                  contextId={contextId}
                  manifests={manifestsByUnit.get(contextId) ?? []}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
