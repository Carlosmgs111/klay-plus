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
            <Icon name="sun" size={16} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
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
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2"
                  style={{
                    borderColor: isActive ? "var(--accent-primary)" : "var(--border-default)",
                    backgroundColor: isActive ? "var(--accent-primary-muted)" : "var(--surface-2)",
                    boxShadow: isActive ? "var(--shadow-glow)" : undefined,
                    transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <Icon
                    name={opt.icon}
                    size={20}
                    style={{ color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)" }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: isActive ? "var(--accent-primary)" : "var(--text-secondary)" }}
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
            <Icon name="server" size={16} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
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
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: mode === "server" ? "var(--accent-primary-muted)" : "var(--surface-3)",
                  }}
                >
                  <Icon
                    name="server"
                    size={16}
                    style={{ color: mode === "server" ? "var(--accent-primary)" : "var(--text-tertiary)" }}
                  />
                </div>
                <h3
                  className="font-semibold text-sm"
                  style={{
                    color: mode === "server" ? "var(--accent-primary)" : "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Server Mode (SSR)
                </h3>
              </div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Astro API routes + NeDB + OpenAI/Hash embeddings
              </p>
            </button>
            <button
              onClick={() => setMode("browser")}
              className={`mode-card ${mode === "browser" ? "mode-card-active-browser" : ""}`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: mode === "browser" ? "var(--semantic-success-muted)" : "var(--surface-3)",
                  }}
                >
                  <Icon
                    name="globe"
                    size={16}
                    style={{ color: mode === "browser" ? "var(--semantic-success)" : "var(--text-tertiary)" }}
                  />
                </div>
                <h3
                  className="font-semibold text-sm"
                  style={{
                    color: mode === "browser" ? "var(--semantic-success)" : "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Browser Mode
                </h3>
              </div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
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
            <Icon name="layers" size={16} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Architecture Flow
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div
            className="font-mono text-xs rounded-lg p-5 overflow-x-auto leading-relaxed"
            style={{
              backgroundColor: "var(--code-bg)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
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
            <Icon name="zap" size={16} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Health Check
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
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
                  <Icon name="zap" size={16} />
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
