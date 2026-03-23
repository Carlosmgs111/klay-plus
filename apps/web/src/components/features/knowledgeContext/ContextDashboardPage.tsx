import { useMemo, useState, useEffect, useCallback } from "react";
import { Icon } from "../../shared/Icon";
import { MetricCard } from "../../shared/MetricCard";
import { StatusBadge } from "../../shared/StatusBadge";
import { EmptyState } from "../../shared/EmptyState";
import { PageErrorDisplay } from "../../shared/PageErrorDisplay";
import { Spinner } from "../../shared/Spinner";
import { SkeletonMetricCards, SkeletonLine } from "../../shared/Skeleton";
import { RelatedContexts } from "../knowledge/RelatedContexts";
import { ContextActionsMenu } from "../knowledge/ContextActionsMenu";
import { useKnowledgeContext } from "../../../contexts/KnowledgeContextContext";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import type { ListProfilesResult } from "@klay/core";

type ProfileEntry = ListProfilesResult["profiles"][number];

// ── Lifecycle accent color mapping ──────────────────────────────────────

const ACCENT_BORDER: Record<string, string> = {
  ACTIVE: "border-success",
  DEPRECATED: "border-warning",
  DRAFT: "border-accent",
  ARCHIVED: "border-subtle",
};

// ── Section divider ─────────────────────────────────────────────────────

function SectionHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-subtle pt-5 mt-6">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-tertiary">
        {label}
      </h3>
      {right && <span className="text-xs text-tertiary">{right}</span>}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export default function ContextDashboardPage() {
  const { contextId, detail, loading, error, refresh } = useKnowledgeContext();
  const { service, isInitializing } = useRuntimeMode();
  const { addToast } = useToast();

  const sources = detail?.sources ?? [];
  const versions = detail?.versions ?? [];
  const state = (detail?.state ?? "DRAFT") as string;

  // ── Derived metrics ─────────────────────────────────────────────────

  const totalProjectionCount = useMemo(
    () => sources.reduce((sum, s) => sum + (s.projections?.length ?? 0), 0),
    [sources],
  );

  const requiredProfileCoverage = useMemo(
    () => sources.filter((s) => s.projectionId).length,
    [sources],
  );

  const totalChunks = useMemo(
    () => sources.reduce((sum, s) => sum + (s.chunksCount ?? 0), 0),
    [sources],
  );

  const coveragePct = sources.length > 0
    ? Math.round((requiredProfileCoverage / sources.length) * 100)
    : 0;

  // ── Profile data ────────────────────────────────────────────────────

  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfiles = useCallback(async () => {
    if (!service) return;
    setProfilesLoading(true);
    try {
      const res = await service.listProfiles();
      if (res.success) {
        setProfiles(res.data.profiles.filter((p) => p.status === "ACTIVE"));
      }
    } finally {
      setProfilesLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (!isInitializing && service) loadProfiles();
  }, [isInitializing, service, loadProfiles]);

  const currentProfileId = detail?.requiredProfileId ?? null;
  const currentProfile = profiles.find((p) => p.id === currentProfileId);

  const handleChangeProfile = async (newProfileId: string) => {
    if (!service || newProfileId === currentProfileId) return;
    setSaving(true);
    try {
      const result = await service.updateContextProfile({
        contextId,
        profileId: newProfileId,
      });
      if (result.success) {
        const reconciled = (result.data as any)?.reconciled as { processedCount: number; failedCount: number } | undefined;
        const msg = reconciled != null
          ? `Profile updated. Reconciled ${reconciled.processedCount} sources.`
          : "Processing profile updated";
        addToast(msg, "success");
        refresh();
      } else {
        addToast(result.error?.message ?? "Failed to update profile", "error");
      }
    } catch {
      addToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────

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
    return <PageErrorDisplay message={error.message} code={error.code} />;
  }

  // ── Render ──────────────────────────────────────────────────────────

  const accentBorder = ACCENT_BORDER[state] ?? "border-subtle";
  const currentVersion = versions.length > 0 ? versions[0] : null;

  return (
    <div className={`border-l-2 ${accentBorder} pl-6 space-y-0`}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {state === "ACTIVE" && (
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
            )}
            <h1 className="text-lg font-semibold text-primary truncate">
              {detail?.name ?? contextId}
            </h1>
            <StatusBadge status={state as any} />
          </div>
          <p className="text-xs font-mono text-ghost mt-0.5 truncate">{contextId}</p>
        </div>
        <ContextActionsMenu contextId={contextId} />
      </div>

      {/* ── Coverage ───────────────────────────────────────────────── */}
      <SectionHeader label="Coverage" right={sources.length > 0 ? `${coveragePct}%` : undefined} />
      {sources.length > 0 ? (
        <div className="mt-3">
          <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${coveragePct === 100 ? "bg-success" : "bg-accent"}`}
              style={{ width: `${coveragePct}%` }}
            />
          </div>
          <p className="text-xs text-secondary mt-1.5">
            {requiredProfileCoverage} of {sources.length} sources projected (required profile)
          </p>
        </div>
      ) : (
        <p className="text-xs text-ghost mt-3">No sources yet</p>
      )}

      {/* ── Metric Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <MetricCard label="Sources" value={sources.length} icon="database" />
        <MetricCard label="Projections" value={totalProjectionCount} icon="layers" />
        <MetricCard label="Events" value={versions.length} icon="history" />
        <MetricCard label="Chunks" value={totalChunks} icon="file-text" />
      </div>

      {/* ── Processing Profile ─────────────────────────────────────── */}
      <SectionHeader
        label="Processing Profile"
        right={
          profilesLoading ? (
            <Spinner size="sm" />
          ) : saving ? (
            <Spinner size="sm" />
          ) : (
            <select
              value={currentProfileId ?? ""}
              onChange={(e) => handleChangeProfile(e.target.value)}
              disabled={saving || profiles.length === 0}
              className="text-xs bg-transparent border border-subtle rounded px-2 py-0.5 text-accent focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
            >
              {!currentProfile && currentProfileId && (
                <option value={currentProfileId}>
                  {currentProfileId} (not found)
                </option>
              )}
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )
        }
      />
      {currentProfile ? (
        <div className="grid grid-cols-3 gap-px mt-3 rounded-lg overflow-hidden border border-subtle">
          {([
            ["Preparation", currentProfile.preparation?.strategyId ?? "none"],
            ["Fragmentation", currentProfile.fragmentation.strategyId],
            ["Embedding", currentProfile.projection.strategyId],
          ] as const).map(([label, strategy]) => (
            <div key={label} className="bg-surface-0 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tertiary mb-1">
                {label}
              </p>
              <p className="text-xs font-mono text-accent truncate">{strategy}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ghost mt-3">
          {currentProfileId ? `Profile "${currentProfileId}" not found.` : "No profile assigned."}
        </p>
      )}

      {/* ── Sources ────────────────────────────────────────────────── */}
      <SectionHeader label="Sources" right={`${sources.length} total`} />
      {sources.length === 0 ? (
        <EmptyState
          icon="database"
          title="No sources added yet."
          link={{ label: "Go to Sources to add one", href: `/contexts/${contextId}/sources` }}
          compact
        />
      ) : (
        <div className="divide-y divide-subtle mt-3">
          {sources.map((source) => {
            const projected = !!source.projectionId;
            return (
              <div key={source.sourceId} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${projected ? "bg-success" : "bg-warning"}`} />
                  <span className="text-xs font-mono truncate text-primary">
                    {source.sourceName}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs text-ghost">
                  {projected ? (
                    <>
                      {source.projections && source.projections.length > 0 && (
                        <span>{source.projections.length} proj{source.projections.length !== 1 ? "s" : ""}</span>
                      )}
                      {source.chunksCount != null && <span>{source.chunksCount} chunks</span>}
                      {source.model && <span className="font-mono">{source.model}</span>}
                    </>
                  ) : (
                    <span className="text-warning">No projection</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Connections ────────────────────────────────────────────── */}
      <div className="border-t border-subtle pt-5 mt-6">
        <RelatedContexts contextId={contextId} />
      </div>

      {/* ── Activity ───────────────────────────────────────────────── */}
      <SectionHeader
        label="Activity"
        right={versions.length > 0 ? `${versions.length} events` : undefined}
      />
      {versions.length === 0 ? (
        <p className="text-xs text-ghost mt-3">No activity yet</p>
      ) : (
        <div className="space-y-1 mt-3">
          {versions.slice(0, 5).map((v) => (
            <div key={v.version} className="flex items-center gap-3 text-xs py-1">
              <span className="text-ghost flex-shrink-0">
                {new Date(v.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-secondary truncate">{v.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
