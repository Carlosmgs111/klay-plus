import { useState } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { StatusBadge } from "../../shared/StatusBadge";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { RemoveSourceAction } from "./RemoveSourceAction";
import { ReprocessAction } from "./ReprocessAction";
import { RollbackAction } from "./RollbackAction";
import { AddSourceForm } from "./AddSourceForm";
import { LinkUnitsForm } from "./LinkUnitsForm";
import type { ContentManifestEntry } from "@klay/core";

interface SemanticUnitDetailProps {
  /** All manifests for this semantic unit */
  manifests: ContentManifestEntry[];
  unitId: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export function SemanticUnitDetail({
  manifests,
  unitId,
  onClose,
  onRefresh,
}: SemanticUnitDetailProps) {
  const [showAddSource, setShowAddSource] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  // Derive unit-level info from manifests
  const latestManifest = manifests.length > 0
    ? manifests.reduce((a, b) =>
        new Date(b.createdAt) > new Date(a.createdAt) ? b : a,
      )
    : null;

  const overallStatus = manifests.some((m) => m.status === "failed")
    ? "failed"
    : manifests.every((m) => m.status === "complete")
      ? "complete"
      : "partial";

  // Estimate current version from number of manifests (sources)
  const estimatedVersion = manifests.length;

  const handleActionSuccess = () => {
    onRefresh?.();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto animate-slide-in-right"
        style={{
          backgroundColor: "var(--surface-1)",
          borderLeft: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <Icon name="chevron-left" />
              </Button>
              <div>
                <h3
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
                >
                  Semantic Unit Detail
                </h3>
                <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {unitId}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon name="x" />
            </Button>
          </div>

          {/* Unit Summary */}
          <div
            className="grid grid-cols-3 gap-4 p-4 rounded-lg"
            style={{
              backgroundColor: "var(--surface-0)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
              >
                STATUS
              </p>
              <div className="mt-1">
                <StatusBadge status={overallStatus as any} />
              </div>
            </div>
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
              >
                SOURCES
              </p>
              <p className="font-mono mt-1" style={{ color: "var(--text-primary)" }}>
                {manifests.length}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
              >
                EST. VERSION
              </p>
              <p className="font-mono mt-1" style={{ color: "var(--text-primary)" }}>
                {estimatedVersion}
              </p>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAddSource(!showAddSource);
                setShowLinkForm(false);
              }}
            >
              <span className="flex items-center gap-1">
                <Icon name="folder-plus" />
                {showAddSource ? "Cancel Add Source" : "Add Source"}
              </span>
            </Button>
            <ReprocessAction unitId={unitId} onSuccess={handleActionSuccess} />
            <RollbackAction
              unitId={unitId}
              currentVersion={estimatedVersion}
              onSuccess={handleActionSuccess}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowLinkForm(!showLinkForm);
                setShowAddSource(false);
              }}
            >
              <span className="flex items-center gap-1">
                <Icon name="link" />
                {showLinkForm ? "Cancel Link" : "Link Unit"}
              </span>
            </Button>
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

          {/* Link Form */}
          {showLinkForm && (
            <Card>
              <CardBody>
                <div className="animate-fade-in">
                  <LinkUnitsForm
                    sourceUnitId={unitId}
                    onSuccess={() => {
                      setShowLinkForm(false);
                      handleActionSuccess();
                    }}
                    onCancel={() => setShowLinkForm(false)}
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Sources List */}
          <div>
            <p
              className="text-xs font-medium mb-3"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
            >
              SOURCES ({manifests.length})
            </p>
            <div className="space-y-3">
              {manifests.length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  No sources associated with this unit.
                </p>
              )}
              {manifests.map((manifest) => (
                <div
                  key={manifest.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: "var(--surface-0)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-xs"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          {manifest.sourceId.slice(0, 12)}...
                        </span>
                        <StatusBadge status={manifest.status as any} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span style={{ color: "var(--text-tertiary)" }}>Resource: </span>
                          <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                            {manifest.resourceId.slice(0, 12)}...
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-tertiary)" }}>Projection: </span>
                          <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                            {manifest.projectionId.slice(0, 12)}...
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-tertiary)" }}>Chunks: </span>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {manifest.chunksCount ?? "—"}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-tertiary)" }}>Model: </span>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {manifest.model ?? "—"}
                          </span>
                        </div>
                      </div>
                      {manifest.contentHash && (
                        <p className="text-xs font-mono truncate" style={{ color: "var(--text-ghost)" }}>
                          Hash: {manifest.contentHash}
                        </p>
                      )}
                      <p className="text-xs" style={{ color: "var(--text-ghost)" }}>
                        Created: {new Date(manifest.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <RemoveSourceAction
                        unitId={unitId}
                        sourceId={manifest.sourceId}
                        onSuccess={handleActionSuccess}
                      />
                    </div>
                  </div>

                  {/* Pipeline Steps */}
                  {manifest.completedSteps.length > 0 && (
                    <div
                      className="mt-3 pt-3"
                      style={{ borderTop: "1px solid var(--border-subtle)" }}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {manifest.completedSteps.map((step, idx) => (
                          <div key={step} className="flex items-center gap-1">
                            {idx > 0 && (
                              <Icon
                                name="chevron-right"
                                style={{ color: "var(--text-ghost)" }}
                              />
                            )}
                            <span className="badge-complete text-xs">{step}</span>
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
