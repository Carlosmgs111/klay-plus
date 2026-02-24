import { StatusBadge } from "../../shared/StatusBadge.js";
import { Icon } from "../../shared/Icon.js";
import { Button } from "../../shared/Button.js";
import type { ContentManifestEntry } from "@klay/core";

interface ManifestDetailProps {
  manifest: ContentManifestEntry;
  onClose: () => void;
}

export function ManifestDetail({ manifest, onClose }: ManifestDetailProps) {
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
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto animate-slide-in-right"
        style={{
          backgroundColor: "var(--surface-1)",
          borderLeft: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
            >
              Manifest Detail
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon name="x" size={18} />
            </Button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Manifest ID</p>
              <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-primary)" }}>
                {manifest.id}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Status</p>
              <div className="mt-0.5">
                <StatusBadge status={manifest.status as any} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Source ID</p>
              <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-primary)" }}>
                {manifest.sourceId}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Resource ID</p>
              <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-primary)" }}>
                {manifest.resourceId}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Semantic Unit ID</p>
              <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-primary)" }}>
                {manifest.semanticUnitId}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Projection ID</p>
              <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-primary)" }}>
                {manifest.projectionId}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Chunks</p>
              <p className="font-mono" style={{ color: "var(--text-primary)" }}>{manifest.chunksCount ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Dimensions</p>
              <p className="font-mono" style={{ color: "var(--text-primary)" }}>{manifest.dimensions ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Model</p>
              <p style={{ color: "var(--text-primary)" }}>{manifest.model ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Content Hash</p>
              <p className="font-mono text-xs truncate mt-0.5" style={{ color: "var(--text-primary)" }}>
                {manifest.contentHash ?? "—"}
              </p>
            </div>
          </div>

          {/* Steps visualization */}
          <div
            className="pt-4"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <p
              className="text-xs font-medium mb-3"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
            >
              PIPELINE STEPS
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {manifest.completedSteps.map((step, idx) => (
                <div key={step} className="flex items-center gap-2">
                  {idx > 0 && (
                    <Icon name="chevron-right" size={14} style={{ color: "var(--text-ghost)" }} />
                  )}
                  <span className="badge-complete">{step}</span>
                </div>
              ))}
              {manifest.failedStep && (
                <>
                  <Icon name="chevron-right" size={14} style={{ color: "var(--text-ghost)" }} />
                  <span className="badge-failed">{manifest.failedStep}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            Created: {new Date(manifest.createdAt).toLocaleString()}
            {manifest.completedAt &&
              ` | Completed: ${new Date(manifest.completedAt).toLocaleString()}`}
          </div>
        </div>
      </div>
    </>
  );
}
