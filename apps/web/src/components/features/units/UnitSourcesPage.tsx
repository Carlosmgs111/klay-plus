import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { StatusBadge } from "../../shared/StatusBadge";
import { Button } from "../../shared/Button";
import { SkeletonLine } from "../../shared/Skeleton";
import { AddSourceForm } from "../knowledge/AddSourceForm";
import { RemoveSourceAction } from "../knowledge/RemoveSourceAction";
import { ReprocessAction } from "../knowledge/ReprocessAction";
import { useUnit, getUnitSources } from "../../../contexts/UnitContext";

export default function UnitSourcesPage() {
  const { unitId, manifests, loading, error, refresh } = useUnit();
  const [showAddSource, setShowAddSource] = useState(false);

  const sources = useMemo(() => getUnitSources(manifests), [manifests]);

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
          <Icon name="database" style={{ color: "var(--text-tertiary)" }} />
          <h2
            className="text-sm font-semibold"
            style={{
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Sources ({sources.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ReprocessAction unitId={unitId} onSuccess={handleActionSuccess} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAddSource(!showAddSource)}
          >
            <span className="flex items-center gap-1">
              <Icon name="folder-plus" />
              {showAddSource ? "Cancel" : "Add Source"}
            </span>
          </Button>
        </div>
      </div>

      {/* Add Source Form */}
      {showAddSource && (
        <Card>
          <CardBody>
            <div className="animate-fade-in">
              <AddSourceForm
                unitId={unitId}
                onSuccess={() => {
                  setShowAddSource(false);
                  handleActionSuccess();
                }}
                onCancel={() => setShowAddSource(false)}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Sources List */}
      {sources.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <Icon
                name="database"
                className="mx-auto mb-3 text-3xl"
                style={{ color: "var(--text-ghost)" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                No sources associated with this unit.
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-ghost)" }}
              >
                Add a source to start building semantic knowledge.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {sources.map((manifest) => {
            // Find all manifests for this source to get projection details
            const sourceManifests = manifests.filter(
              (m) => m.sourceId === manifest.sourceId,
            );

            return (
              <Card key={manifest.sourceId}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Source ID + Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-mono text-xs"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          {manifest.sourceId.length > 20
                            ? `${manifest.sourceId.slice(0, 20)}...`
                            : manifest.sourceId}
                        </span>
                        <StatusBadge status={manifest.status as any} />
                      </div>

                      {/* Source Details Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span style={{ color: "var(--text-tertiary)" }}>
                            Resource:{" "}
                          </span>
                          <span
                            className="font-mono"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {manifest.resourceId.length > 16
                              ? `${manifest.resourceId.slice(0, 16)}...`
                              : manifest.resourceId}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-tertiary)" }}>
                            Projection:{" "}
                          </span>
                          <span
                            className="font-mono"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {manifest.projectionId.length > 16
                              ? `${manifest.projectionId.slice(0, 16)}...`
                              : manifest.projectionId}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-tertiary)" }}>
                            Chunks:{" "}
                          </span>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {manifest.chunksCount ?? "--"}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-tertiary)" }}>
                            Model:{" "}
                          </span>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {manifest.model ?? "--"}
                          </span>
                        </div>
                      </div>

                      {/* Content Hash */}
                      {manifest.contentHash && (
                        <p
                          className="text-xs font-mono truncate"
                          style={{ color: "var(--text-ghost)" }}
                        >
                          Hash: {manifest.contentHash}
                        </p>
                      )}

                      {/* Created Date */}
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-ghost)" }}
                      >
                        Created:{" "}
                        {new Date(manifest.createdAt).toLocaleString()}
                      </p>

                      {/* Pipeline Steps */}
                      {manifest.completedSteps.length > 0 && (
                        <div
                          className="pt-2 mt-2"
                          style={{
                            borderTop: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            {manifest.completedSteps.map((step, idx) => (
                              <div
                                key={step}
                                className="flex items-center gap-1"
                              >
                                {idx > 0 && (
                                  <Icon
                                    name="chevron-right"
                                    style={{ color: "var(--text-ghost)" }}
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
                                  style={{ color: "var(--text-ghost)" }}
                                />
                                <span className="badge-failed text-xs">
                                  {manifest.failedStep}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remove Action */}
                    <div className="ml-3 flex-shrink-0">
                      <RemoveSourceAction
                        unitId={unitId}
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
    </div>
  );
}
