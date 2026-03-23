import { useEffect, useCallback, useState, useMemo } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { MetricCard } from "../../shared/MetricCard";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import {
  SkeletonMetricCards,
  SkeletonCard,
  SkeletonLine,
} from "../../shared/Skeleton";
import type { EnrichedContextSummaryDTO } from "@klay/core";
import ContextCard from "./ContextCard";
import { CreateContextForm } from "../knowledge/CreateContextForm";
import { OverlayPanel } from "../../shared/OverlayPanel";

export default function UnitsIndexPage() {
  const { service, isInitializing } = useRuntimeMode();
  const [filterText, setFilterText] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [contexts, setContexts] = useState<EnrichedContextSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  const loadAll = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    setError(null);
    try {
      const result = await service.listContexts();
      if (result.success) {
        setContexts(result.data.contexts);
      } else {
        setError({ message: result.error?.message ?? "Failed to load contexts" });
      }
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (service && !isInitializing) {
      loadAll();
    }
  }, [service, isInitializing]);

  // Apply filter (matches by ID or name)
  const filteredContexts = useMemo(() => {
    if (!filterText.trim()) return contexts;
    const lower = filterText.toLowerCase();
    return contexts.filter((c) =>
      c.id.toLowerCase().includes(lower) || c.name.toLowerCase().includes(lower),
    );
  }, [contexts, filterText]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalSources = contexts.reduce((sum, c) => sum + c.sourceCount, 0);
    const uniqueProfiles = new Set(contexts.map((c) => c.requiredProfileId)).size;
    return {
      totalUnits: contexts.length,
      totalSources,
      uniqueProfiles,
    };
  }, [contexts]);

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
          label="Profiles"
          value={metrics.uniqueProfiles}
          icon="settings"
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
              {loading && (
                <div className="skeleton w-4 h-4 rounded-full" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs text-tertiary"
              >
                {filteredContexts.length} of {contexts.length} context
                {contexts.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-accent hover:bg-accent-muted"
              >
                <Icon name="plus" className="text-sm" />
                New Context
              </button>
            </div>
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
              placeholder="Filter contexts..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-surface-3 border border-default text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
            />
          </div>

          {filteredContexts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Icon
                  name="brain"
                  className="text-3xl text-tertiary"
                />
              </div>
              {contexts.length === 0 ? (
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
              {filteredContexts.map((ctx) => (
                <ContextCard
                  key={ctx.id}
                  context={ctx}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Context Overlay */}
      <OverlayPanel open={showCreate} setOpen={setShowCreate} icon="folder-plus" title="New Context">
        <CreateContextForm
          onSuccess={() => {
            setShowCreate(false);
            loadAll();
          }}
        />
      </OverlayPanel>
    </div>
  );
}
