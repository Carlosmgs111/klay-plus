import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext.js";
import { usePipelineAction } from "../../../hooks/usePipelineAction.js";
import { Card, CardHeader, CardBody } from "../../shared/Card.js";
import { Button } from "../../shared/Button.js";
import { Spinner } from "../../shared/Spinner.js";
import { ErrorDisplay } from "../../shared/ErrorDisplay.js";
import type { SearchKnowledgeInput } from "@klay/core";

export function SettingsPage() {
  const { mode, setMode, service, isInitializing } = useRuntimeMode();

  const healthCheck = useCallback(
    (input: SearchKnowledgeInput) => service!.searchKnowledge(input),
    [service],
  );

  const { data, error, isLoading, execute } = usePipelineAction(healthCheck);

  const runHealthCheck = () => {
    execute({ queryText: "health check test", topK: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Runtime Mode */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Runtime Mode</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={() => setMode("server")}
                className={`flex-1 p-4 rounded-card border-2 transition-colors ${
                  mode === "server"
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <h3
                  className={`font-semibold ${
                    mode === "server" ? "text-primary-700" : "text-gray-900"
                  }`}
                >
                  Server Mode (SSR)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Astro API routes + NeDB + OpenAI/Hash embeddings
                </p>
              </button>
              <button
                onClick={() => setMode("browser")}
                className={`flex-1 p-4 rounded-card border-2 transition-colors ${
                  mode === "browser"
                    ? "border-success-500 bg-success-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <h3
                  className={`font-semibold ${
                    mode === "browser" ? "text-success-700" : "text-gray-900"
                  }`}
                >
                  Browser Mode
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Direct import + IndexedDB + WebLLM/Hash embeddings
                </p>
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            Architecture Flow
          </h2>
        </CardHeader>
        <CardBody>
          <div className="font-mono text-xs text-gray-600 bg-gray-50 rounded-lg p-4 overflow-x-auto">
            {mode === "server" ? (
              <pre>{`React Component
  → usePipelineService()
  → ServerPipelineService.method(input)
  → fetch('/api/pipeline/...')
  → Astro API Route
  → KnowledgePipelineRESTAdapter
  → KnowledgePipelineOrchestrator
  → (NeDB + Hash/OpenAI embeddings)
  → Response JSON`}</pre>
            ) : (
              <pre>{`React Component
  → usePipelineService()
  → BrowserPipelineService.method(input)
  → dynamic import("@klay/core")
  → createKnowledgePipeline({ provider: "browser" })
  → KnowledgePipelineUIAdapter
  → KnowledgePipelineOrchestrator
  → (IndexedDB + Hash/WebLLM embeddings)
  → UIResult<T>`}</pre>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Health Check */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Health Check</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Run a test search to verify the pipeline is operational in the current
              mode.
            </p>
            <Button
              onClick={runHealthCheck}
              disabled={isLoading || isInitializing || !service}
              variant="secondary"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Running...
                </span>
              ) : (
                "Run Health Check"
              )}
            </Button>

            {error && <ErrorDisplay {...error} />}

            {data && (
              <div className="bg-success-50 border border-success-500/30 rounded-card p-3 text-sm text-success-700">
                Pipeline is operational. Search returned {data.totalFound} results.
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
