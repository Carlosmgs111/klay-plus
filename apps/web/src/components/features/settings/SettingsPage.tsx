import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import type { SearchKnowledgeInput } from "@klay/core";

export function SettingsPage() {
  const { mode, setMode, service, isInitializing } = useRuntimeMode();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  const healthCheck = useCallback(
    (input: SearchKnowledgeInput) => service!.searchKnowledge(input),
    [service],
  );

  const { error, isLoading, execute } = usePipelineAction(healthCheck);

  const runHealthCheck = async () => {
    const result = await execute({ queryText: "health check test", topK: 1 });
    if (result) {
      addToast(`Pipeline is operational. Search returned ${result.totalFound} results.`, "success");
    }
  };

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: "sun" as const },
    { value: "dark" as const, label: "Dark", icon: "moon" as const },
    { value: "system" as const, label: "System", icon: "settings" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="sun" className="text-tertiary" />
            <h2 className="text-sm font-semibold text-primary tracking-heading">
              Appearance
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2
                    transition-all duration-normal ease-out-expo
                    ${isActive
                      ? "border-accent bg-accent-muted shadow-glow"
                      : "border-default bg-surface-2"
                    }`}
                >
                  <Icon
                    name={opt.icon}
                    className={isActive ? "text-accent" : "text-tertiary"}
                  />
                  <span
                    className={`text-sm font-medium ${isActive ? "text-accent" : "text-secondary"}`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Runtime Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="server" className="text-tertiary" />
            <h2 className="text-sm font-semibold text-primary tracking-heading">
              Runtime Mode
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex gap-4">
            <button
              onClick={() => setMode("server")}
              className={`mode-card ${mode === "server" ? "mode-card-active-server" : ""}`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center
                    ${mode === "server" ? "bg-accent-muted" : "bg-surface-3"}`}
                >
                  <Icon
                    name="server"
                    className={mode === "server" ? "text-accent" : "text-tertiary"}
                  />
                </div>
                <h3
                  className={`font-semibold text-sm tracking-heading ${mode === "server" ? "text-accent" : "text-primary"}`}
                >
                  Server Mode (SSR)
                </h3>
              </div>
              <p className="text-xs text-tertiary">
                Astro API routes + NeDB + OpenAI/Hash embeddings
              </p>
            </button>
            <button
              onClick={() => setMode("browser")}
              className={`mode-card ${mode === "browser" ? "mode-card-active-browser" : ""}`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center
                    ${mode === "browser" ? "bg-success-muted" : "bg-surface-3"}`}
                >
                  <Icon
                    name="globe"
                    className={mode === "browser" ? "text-success" : "text-tertiary"}
                  />
                </div>
                <h3
                  className={`font-semibold text-sm tracking-heading ${mode === "browser" ? "text-success" : "text-primary"}`}
                >
                  Browser Mode
                </h3>
              </div>
              <p className="text-xs text-tertiary">
                Direct import + IndexedDB + WebLLM/Hash embeddings
              </p>
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="layers" className="text-tertiary" />
            <h2 className="text-sm font-semibold text-primary tracking-heading">
              Architecture Flow
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div
            className="font-mono text-xs rounded-lg p-5 overflow-x-auto leading-relaxed bg-code text-secondary border border-subtle"
          >
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
          <div className="flex items-center gap-2">
            <Icon name="zap" className="text-tertiary" />
            <h2 className="text-sm font-semibold text-primary tracking-heading">
              Health Check
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <p className="text-sm text-tertiary">
              Run a test search to verify the pipeline is operational in the current mode.
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
                <>
                  <Icon name="zap" />
                  Run Health Check
                </>
              )}
            </Button>

            {error && <ErrorDisplay {...error} />}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
