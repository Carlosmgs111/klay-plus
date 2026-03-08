import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { StatusBadge } from "../../shared/StatusBadge";
import { Button } from "../../shared/Button";
import { SkeletonLine } from "../../shared/Skeleton";
import { Overlay } from "../../shared/Overlay";
import { AddSourceUploadForm } from "../knowledge/AddSourceUploadForm";
import { RemoveSourceAction } from "../knowledge/RemoveSourceAction";
import { ReprocessAction } from "../knowledge/ReprocessAction";
import { RollbackAction } from "../knowledge/RollbackAction";
import {
  useKnowledgeContext,
  getUnitSources,
  getCurrentVersion,
} from "../../../contexts/KnowledgeContextContext";

// --- Version history types (absorbed from ContextVersionsPage) ---

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

// --- Component ---

export default function UnitSourcesPage() {
  const { contextId, manifests, loading, error, refresh } = useKnowledgeContext();
  const [showAddSource, setShowAddSource] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const sources = useMemo(() => getUnitSources(manifests), [manifests]);
  const currentVersion = useMemo(() => getCurrentVersion(manifests), [manifests]);

  // --- Version history computation ---

  const versions = useMemo<VersionGroup[]>(() => {
    if (manifests.length === 0) return [];

    const sorted = [...manifests].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

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

    return Array.from(versionMap.values()).reverse();
  }, [manifests]);

  const versionDiffs = useMemo<Map<number, SourceWithDiff[]>>(() => {
    const diffMap = new Map<number, SourceWithDiff[]>();
    const chronological = [...versions].reverse();
    const cumulativeSources = new Set<string>();

    for (const version of chronological) {
      const currentSourceIds = new Set(version.sources.map((s) => s.sourceId));
      const sourcesWithDiff: SourceWithDiff[] = version.sources.map((s) => ({
        ...s,
        diff: cumulativeSources.has(s.sourceId) ? "unchanged" : "added",
      }));

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

  const toggleExpand = (sourceId: string) => {
    setExpandedSourceId((prev) => (prev === sourceId ? null : sourceId));
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
              SOURCES_FETCH_ERROR
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Icon name="database" className="text-tertiary" />
          <h2 className="text-sm font-semibold text-primary tracking-heading">
            Sources ({sources.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ReprocessAction contextId={contextId} onSuccess={handleActionSuccess} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAddSource(true)}
          >
            <span className="flex items-center gap-1">
              <Icon name="folder-plus" />
              Add Source
            </span>
          </Button>
        </div>
      </div>

      {/* Sources List */}
      {sources.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <Icon
                name="database"
                className="mx-auto mb-3 text-3xl text-ghost"
              />
              <p className="text-sm text-tertiary">
                No sources associated with this unit.
              </p>
              <p className="text-xs mt-1 text-ghost">
                Add a source to start building semantic knowledge.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {sources.map((manifest) => {
            const isExpanded = expandedSourceId === manifest.sourceId;

            return (
              <Card key={manifest.sourceId}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Source ID + Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-accent">
                          {manifest.sourceId.length > 20
                            ? `${manifest.sourceId.slice(0, 20)}...`
                            : manifest.sourceId}
                        </span>
                        <StatusBadge status={manifest.status as any} />
                      </div>

                      {/* Source Details Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className="text-tertiary">
                            Resource:{" "}
                          </span>
                          <span className="font-mono text-secondary">
                            {manifest.resourceId.length > 16
                              ? `${manifest.resourceId.slice(0, 16)}...`
                              : manifest.resourceId}
                          </span>
                        </div>
                        <div>
                          <span className="text-tertiary">
                            Projection:{" "}
                          </span>
                          <span className="font-mono text-secondary">
                            {manifest.projectionId.length > 16
                              ? `${manifest.projectionId.slice(0, 16)}...`
                              : manifest.projectionId}
                          </span>
                        </div>
                        <div>
                          <span className="text-tertiary">
                            Chunks:{" "}
                          </span>
                          <span className="text-secondary">
                            {manifest.chunksCount ?? "--"}
                          </span>
                        </div>
                        <div>
                          <span className="text-tertiary">
                            Model:{" "}
                          </span>
                          <span className="text-secondary">
                            {manifest.model ?? "--"}
                          </span>
                        </div>
                      </div>

                      {/* Content Hash */}
                      {manifest.contentHash && (
                        <p className="text-xs font-mono truncate text-ghost">
                          Hash: {manifest.contentHash}
                        </p>
                      )}

                      {/* Created Date */}
                      <p className="text-xs text-ghost">
                        Created:{" "}
                        {new Date(manifest.createdAt).toLocaleString()}
                      </p>

                      {/* Pipeline Steps */}
                      {manifest.completedSteps.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-subtle">
                          <div className="flex items-center gap-2 flex-wrap">
                            {manifest.completedSteps.map((step, idx) => (
                              <div
                                key={step}
                                className="flex items-center gap-1"
                              >
                                {idx > 0 && (
                                  <Icon
                                    name="chevron-right"
                                    className="text-ghost"
                                  />
                                )}
                                <span className="badge-complete text-xs">
                                  {step}
                                </span>
                              </div>
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
                        </div>
                      )}

                      {/* Expandable Manifest Detail */}
                      <div
                        className="grid transition-[grid-template-rows,opacity] duration-fast ease-out-expo"
                        style={{
                          gridTemplateRows: isExpanded ? "1fr" : "0fr",
                          opacity: isExpanded ? 1 : 0,
                        }}
                      >
                        <div className="overflow-hidden">
                          <div className="pt-3 mt-3 border-t border-subtle space-y-2">
                            <p className="text-xs font-medium text-tertiary tracking-caps">
                              MANIFEST DETAIL
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                              <ManifestField label="Manifest ID" value={manifest.id} mono />
                              <ManifestField label="Resource ID" value={manifest.resourceId} mono />
                              <ManifestField label="Extraction Job ID" value={manifest.extractionJobId} mono />
                              <ManifestField label="Projection ID" value={manifest.projectionId} mono />
                              <ManifestField label="Context ID" value={manifest.contextId ?? "—"} mono />
                              <ManifestField label="Content Hash" value={manifest.contentHash ?? "—"} mono />
                              <ManifestField
                                label="Extracted Text Length"
                                value={manifest.extractedTextLength != null
                                  ? manifest.extractedTextLength.toLocaleString()
                                  : "—"}
                              />
                              <ManifestField
                                label="Chunks"
                                value={manifest.chunksCount != null ? String(manifest.chunksCount) : "—"}
                              />
                              <ManifestField
                                label="Dimensions"
                                value={manifest.dimensions != null ? String(manifest.dimensions) : "—"}
                              />
                              <ManifestField label="Model" value={manifest.model ?? "—"} />
                              <ManifestField
                                label="Created At"
                                value={new Date(manifest.createdAt).toLocaleString()}
                              />
                              {manifest.failedStep && (
                                <div>
                                  <span className="text-tertiary">Failed Step: </span>
                                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-danger-muted text-danger">
                                    {manifest.failedStep}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Completed Steps Timeline */}
                            {manifest.completedSteps.length > 0 && (
                              <div className="pt-2">
                                <span className="text-tertiary text-xs">Pipeline: </span>
                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                  {manifest.completedSteps.map((step, idx) => (
                                    <span key={step} className="flex items-center gap-1">
                                      {idx > 0 && (
                                        <Icon name="chevron-right" className="text-ghost" />
                                      )}
                                      <span className="badge-complete text-xs">{step}</span>
                                    </span>
                                  ))}
                                  {manifest.failedStep && (
                                    <>
                                      <Icon name="chevron-right" className="text-ghost" />
                                      <span className="badge-failed text-xs">{manifest.failedStep}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Expand Toggle + Remove */}
                    <div className="ml-3 flex-shrink-0 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleExpand(manifest.sourceId)}
                        className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-surface-3"
                        title={isExpanded ? "Collapse manifest detail" : "Expand manifest detail"}
                      >
                        <Icon
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          className="text-tertiary"
                        />
                      </button>
                      <RemoveSourceAction
                        contextId={contextId}
                        sourceId={manifest.sourceId}
                        onSuccess={handleActionSuccess}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Version History — collapsible section */}
      <div>
        <button
          type="button"
          onClick={() => setShowVersionHistory((prev) => !prev)}
          className="flex items-center gap-2 w-full text-left py-2 group"
        >
          <Icon
            name={showVersionHistory ? "chevron-down" : "chevron-right"}
            className="text-tertiary transition-transform"
          />
          <Icon name="clock" className="text-tertiary" />
          <h3 className="text-sm font-semibold text-primary tracking-heading">
            Version History ({versions.length})
          </h3>
        </button>

        <div
          className="grid transition-[grid-template-rows,opacity] duration-fast ease-out-expo"
          style={{
            gridTemplateRows: showVersionHistory ? "1fr" : "0fr",
            opacity: showVersionHistory ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <div className="pt-4 space-y-4">
              {/* Rollback Action */}
              <div className="flex justify-end">
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
                        {sources.length}
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
          </div>
        </div>
      </div>

      {/* Add Source Overlay */}
      <Overlay open={showAddSource} setOpen={setShowAddSource}>
        <div className="h-full w-[420px] max-w-[90vw] flex flex-col bg-surface-2">
          <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
            <div className="flex items-center gap-2">
              <Icon name="folder-plus" className="text-accent" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                Add Source
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddSource(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Icon name="x" className="text-tertiary" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <AddSourceUploadForm
              contextId={contextId}
              onSuccess={() => {
                refresh();
              }}
            />
          </div>
        </div>
      </Overlay>
    </div>
  );
}

function ManifestField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <span className="text-tertiary">{label}: </span>
      <span
        className={`text-secondary break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
