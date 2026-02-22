import { useEffect, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext.js";
import { usePipelineAction } from "../../../hooks/usePipelineAction.js";
import { MetricCard } from "../../shared/MetricCard.js";
import { Card, CardHeader, CardBody } from "../../shared/Card.js";
import { Spinner } from "../../shared/Spinner.js";
import { ErrorDisplay } from "../../shared/ErrorDisplay.js";
import type { GetManifestInput } from "@klay/core";

export function DashboardPage() {
  const { mode, service, isInitializing } = useRuntimeMode();

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

  const manifests = data?.manifests ?? [];
  const totalDocs = manifests.length;
  const totalChunks = manifests.reduce((sum, m) => sum + (m.chunksCount ?? 0), 0);
  const completed = manifests.filter((m) => m.status === "complete").length;
  const failed = manifests.filter((m) => m.status === "failed").length;

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Documents" value={totalDocs} />
        <MetricCard label="Total Chunks" value={totalChunks} />
        <MetricCard label="Completed" value={completed} variant="success" />
        <MetricCard label="Failed" value={failed} variant="danger" />
      </div>

      {error && <ErrorDisplay {...error} />}

      {/* Architecture Showcase */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            Architecture Showcase
          </h2>
        </CardHeader>
        <CardBody>
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>
              This dashboard demonstrates the <strong>dual-runtime composition</strong>{" "}
              capabilities of klay+. The same domain logic runs in two modes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 not-prose">
              <div className="bg-primary-50 rounded-card p-4 border border-primary-200">
                <h3 className="text-sm font-semibold text-primary-800">
                  Server Mode (SSR)
                </h3>
                <ul className="mt-2 text-xs text-primary-700 space-y-1">
                  <li>Astro API routes + REST adapter</li>
                  <li>NeDB file-based persistence</li>
                  <li>OpenAI / Hash embeddings</li>
                  <li>Requests via <code className="font-mono">fetch()</code></li>
                </ul>
              </div>
              <div className="bg-success-50 rounded-card p-4 border border-success-500/30">
                <h3 className="text-sm font-semibold text-success-700">
                  Browser Mode
                </h3>
                <ul className="mt-2 text-xs text-success-700 space-y-1">
                  <li>Direct import of @klay/core</li>
                  <li>IndexedDB browser persistence</li>
                  <li>WebLLM / Hash embeddings</li>
                  <li>Zero network requests</li>
                </ul>
              </div>
            </div>
            <p className="mt-4">
              Currently running in{" "}
              <strong className={mode === "server" ? "text-primary-700" : "text-success-700"}>
                {mode} mode
              </strong>
              . Use the toggle in the header to switch.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : manifests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No documents processed yet. Go to Documents to ingest your first document.
            </p>
          ) : (
            <div className="space-y-3">
              {manifests.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.sourceId}</p>
                    <p className="text-xs text-gray-500">
                      {m.completedSteps.join(" → ")}
                    </p>
                  </div>
                  <span
                    className={
                      m.status === "complete"
                        ? "badge-complete"
                        : m.status === "failed"
                          ? "badge-failed"
                          : "badge-pending"
                    }
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
