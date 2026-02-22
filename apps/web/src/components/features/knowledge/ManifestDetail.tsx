import { StatusBadge } from "../../shared/StatusBadge.js";
import type { ContentManifestEntry } from "@klay/core";

interface ManifestDetailProps {
  manifest: ContentManifestEntry;
  onClose: () => void;
}

export function ManifestDetail({ manifest, onClose }: ManifestDetailProps) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Manifest Detail</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Manifest ID</p>
          <p className="font-mono text-xs">{manifest.id}</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <StatusBadge status={manifest.status as any} />
        </div>
        <div>
          <p className="text-gray-500">Source ID</p>
          <p className="font-mono text-xs">{manifest.sourceId}</p>
        </div>
        <div>
          <p className="text-gray-500">Resource ID</p>
          <p className="font-mono text-xs">{manifest.resourceId}</p>
        </div>
        <div>
          <p className="text-gray-500">Semantic Unit ID</p>
          <p className="font-mono text-xs">{manifest.semanticUnitId}</p>
        </div>
        <div>
          <p className="text-gray-500">Projection ID</p>
          <p className="font-mono text-xs">{manifest.projectionId}</p>
        </div>
        <div>
          <p className="text-gray-500">Chunks</p>
          <p>{manifest.chunksCount ?? "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Dimensions</p>
          <p>{manifest.dimensions ?? "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Model</p>
          <p>{manifest.model ?? "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Content Hash</p>
          <p className="font-mono text-xs truncate">{manifest.contentHash ?? "—"}</p>
        </div>
      </div>

      {/* Steps visualization */}
      <div>
        <p className="text-sm text-gray-500 mb-2">Pipeline Steps</p>
        <div className="flex items-center gap-2 flex-wrap">
          {manifest.completedSteps.map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              {idx > 0 && (
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              <span className="badge-complete">{step}</span>
            </div>
          ))}
          {manifest.failedStep && (
            <>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="badge-failed">{manifest.failedStep}</span>
            </>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-400">
        Created: {new Date(manifest.createdAt).toLocaleString()}
        {manifest.completedAt &&
          ` | Completed: ${new Date(manifest.completedAt).toLocaleString()}`}
      </div>
    </div>
  );
}
