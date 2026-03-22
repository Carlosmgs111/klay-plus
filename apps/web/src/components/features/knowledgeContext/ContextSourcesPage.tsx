import { useState } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { StatusBadge } from "../../shared/StatusBadge";
import { EmptyState } from "../../shared/EmptyState";
import { PageErrorDisplay } from "../../shared/PageErrorDisplay";
import { Button } from "../../shared/Button";
import { SkeletonLine } from "../../shared/Skeleton";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { AddSourceUploadForm } from "../knowledge/AddSourceUploadForm";
import { AddExistingSourcePicker } from "../knowledge/AddExistingSourcePicker";
import { RemoveSourceAction } from "../knowledge/RemoveSourceAction";
import { GenerateProjectionAction } from "../knowledge/GenerateProjectionAction";
import { ProcessAllProfilesAction } from "../knowledge/ProcessAllProfilesAction";
import { ReconcileProjectionsAction } from "../knowledge/ReconcileProjectionsAction";
import { useKnowledgeContext } from "../../../contexts/KnowledgeContextContext";

// --- Component ---

export default function UnitSourcesPage() {
  const { contextId, detail, loading, error, refresh } = useKnowledgeContext();
  const [showAddSource, setShowAddSource] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);

  const sources = detail?.sources ?? [];
  const versions = detail?.versions ?? [];

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
    return <PageErrorDisplay message={error.message} code={error.code} />;
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
          <ReconcileProjectionsAction contextId={contextId} profileId={detail?.requiredProfileId ?? "default"} onSuccess={handleActionSuccess} />
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
        <Card><CardBody>
          <EmptyState
            icon="database"
            title="No sources associated with this unit."
            description="Add a source to start building semantic knowledge."
            compact
          />
        </CardBody></Card>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => {
            const isExpanded = expandedSourceId === source.sourceId;

            return (
              <Card key={source.sourceId}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Source Name + Status + Projection Count */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-primary">
                          {source.sourceName}
                        </span>
                        <StatusBadge status={source.projectionId ? "complete" : "partial"} />
                        {source.projections && source.projections.length > 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-3 text-tertiary">
                            {source.projections.length} proj{source.projections.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-tertiary">
                        {source.sourceId.length > 24
                          ? `${source.sourceId.slice(0, 24)}...`
                          : source.sourceId}
                      </p>

                      {/* Source Details Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className="text-tertiary">Type: </span>
                          <span className="text-secondary">{source.sourceType}</span>
                        </div>
                        <div>
                          <span className="text-tertiary">Projection: </span>
                          <span className="font-mono text-secondary">
                            {source.projectionId
                              ? (source.projectionId.length > 16
                                ? `${source.projectionId.slice(0, 16)}...`
                                : source.projectionId)
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-tertiary">Chunks: </span>
                          <span className="text-secondary">
                            {source.chunksCount ?? "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-tertiary">Model: </span>
                          <span className="text-secondary">
                            {source.model ?? "—"}
                          </span>
                        </div>
                      </div>

                      {/* Added Date */}
                      <p className="text-xs text-ghost">
                        Added: {new Date(source.addedAt).toLocaleString()}
                      </p>

                      {/* Expandable Detail */}
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
                              SOURCE DETAIL
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                              <DetailField label="Source ID" value={source.sourceId} mono />
                              <DetailField label="Source Type" value={source.sourceType} />
                              <DetailField label="Projection ID" value={source.projectionId ?? "—"} mono />
                              <DetailField
                                label="Chunks"
                                value={source.chunksCount != null ? String(source.chunksCount) : "—"}
                              />
                              <DetailField
                                label="Dimensions"
                                value={source.dimensions != null ? String(source.dimensions) : "—"}
                              />
                              <DetailField label="Model" value={source.model ?? "—"} />
                              <DetailField
                                label="Added At"
                                value={new Date(source.addedAt).toLocaleString()}
                              />
                            </div>

                            {/* Multi-projection list */}
                            {source.projections && source.projections.length > 1 && (
                              <div className="mt-3 pt-3 border-t border-subtle">
                                <p className="text-xs font-medium text-tertiary tracking-caps mb-2">
                                  ALL PROJECTIONS ({source.projections.length})
                                </p>
                                <div className="space-y-1.5">
                                  {source.projections.map((proj) => (
                                    <div
                                      key={proj.projectionId}
                                      className="flex items-center gap-3 text-xs py-1 px-2 rounded bg-surface-1"
                                    >
                                      <span className="font-mono text-secondary">
                                        {proj.projectionId.slice(0, 12)}...
                                      </span>
                                      <span className="text-tertiary">{proj.processingProfileId}</span>
                                      <span className="text-ghost">{proj.chunksCount} chunks</span>
                                      <span className="font-mono text-ghost">{proj.model}</span>
                                      {proj.processingProfileId === detail?.requiredProfileId && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-muted text-accent">
                                          required
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Process All Profiles + Generate Projection + Expand Toggle + Remove */}
                    <div className="ml-3 flex-shrink-0 flex items-center gap-1">
                      <ProcessAllProfilesAction
                        sourceId={source.sourceId}
                        onSuccess={handleActionSuccess}
                      />
                      <GenerateProjectionAction
                        sourceId={source.sourceId}
                        onSuccess={handleActionSuccess}
                      />
                      <button
                        type="button"
                        onClick={() => toggleExpand(source.sourceId)}
                        className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-surface-3"
                        title={isExpanded ? "Collapse detail" : "Expand detail"}
                      >
                        <Icon
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          className="text-tertiary"
                        />
                      </button>
                      <RemoveSourceAction
                        contextId={contextId}
                        sourceId={source.sourceId}
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

      {/* Activity Log — collapsible section */}
      {versions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowActivityLog((prev) => !prev)}
            className="flex items-center gap-2 w-full text-left py-2 group"
          >
            <Icon
              name={showActivityLog ? "chevron-down" : "chevron-right"}
              className="text-tertiary transition-transform"
            />
            <Icon name="clock" className="text-tertiary" />
            <h3 className="text-sm font-semibold text-primary tracking-heading">
              Activity ({versions.length})
            </h3>
          </button>

          <div
            className="grid transition-[grid-template-rows,opacity] duration-fast ease-out-expo"
            style={{
              gridTemplateRows: showActivityLog ? "1fr" : "0fr",
              opacity: showActivityLog ? 1 : 0,
            }}
          >
            <div className="overflow-hidden">
              <div className="pt-2 space-y-1">
                {[...versions].sort((a, b) => b.version - a.version).map((version) => (
                  <div key={version.version} className="flex items-center gap-3 py-1.5 text-xs">
                    <span className="text-ghost flex-shrink-0">
                      {new Date(version.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-secondary">{version.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Overlay */}
      <OverlayPanel open={showAddSource} setOpen={setShowAddSource} icon="folder-plus" title="Add Source">
        <AddSourceUploadForm
          contextId={contextId}
          onSuccess={() => {
            refresh();
          }}
        />

        {/* Existing Sources */}
        <div className="mt-6 pt-5 border-t border-primary">
          <h4 className="text-xs font-semibold text-secondary mb-3 flex items-center gap-1.5">
            <Icon name="database" className="text-tertiary" />
            Or add existing sources
          </h4>
          <AddExistingSourcePicker
            contextId={contextId}
            existingSourceIds={sources.map((s) => s.sourceId)}
            onSuccess={() => {
              setShowAddSource(false);
              refresh();
            }}
          />
        </div>
      </OverlayPanel>
    </div>
  );
}

function DetailField({
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
