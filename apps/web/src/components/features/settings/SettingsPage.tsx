import { useCallback, useEffect, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Input } from "../../shared/Input";
import { LoadingButton } from "../../shared/LoadingButton";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import {
  API_KEY_DEFINITIONS,
  getProvidersForAxis,
  getProfileRequirements,
  getModelsForProvider,
  getDefaultModel,
} from "@klay/core/config";
import type {
  InfrastructureAxis,
  InfrastructureProfile,
  RuntimeEnvironment,
} from "@klay/core/config";
import type { SearchKnowledgeInput } from "@klay/core";

const INFRA_AXES: { axis: InfrastructureAxis; label: string }[] = [
  { axis: "persistence", label: "Persistence" },
  { axis: "vectorStore", label: "Vector Store" },
  { axis: "documentStorage", label: "Document Storage" },
  { axis: "embedding", label: "Embedding" },
];

function runtimeFromMode(mode: string): RuntimeEnvironment {
  return mode === "browser" ? "browser" : "server";
}

export function SettingsPage() {
  const {
    mode,
    setMode,
    service,
    isInitializing,
    reinitialize,
    configStore,
    infrastructureProfile,
    setInfrastructureProfile,
  } = useRuntimeMode();
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

  const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({});
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [localProfile, setLocalProfile] = useState<InfrastructureProfile | null>(null);

  useEffect(() => {
    if (configStore) {
      configStore.loadAll().then(setApiKeyValues);
    }
  }, [configStore]);

  useEffect(() => {
    if (infrastructureProfile) {
      setLocalProfile({ ...infrastructureProfile });
    }
  }, [infrastructureProfile]);

  const activeRequirements = localProfile
    ? getProfileRequirements(localProfile)
    : API_KEY_DEFINITIONS;

  const runtime = runtimeFromMode(mode);

  const handleProfileChange = (axis: InfrastructureAxis, value: string) => {
    if (!localProfile) return;
    const updated = { ...localProfile, [axis]: value };

    // When embedding provider changes, auto-select default model + dimensions
    if (axis === "embedding") {
      const defaultModel = getDefaultModel(value);
      if (defaultModel) {
        updated.embeddingModel = defaultModel.id;
        updated.embeddingDimensions = defaultModel.dimensions;
      } else {
        updated.embeddingModel = undefined;
        updated.embeddingDimensions = undefined;
      }
    }

    setLocalProfile(updated);
  };

  const handleModelChange = (modelId: string) => {
    if (!localProfile) return;
    const models = getModelsForProvider(localProfile.embedding);
    const model = models.find((m) => m.id === modelId);
    if (model) {
      setLocalProfile({
        ...localProfile,
        embeddingModel: model.id,
        embeddingDimensions: model.dimensions,
      });
    }
  };

  const handleSaveKeys = async () => {
    if (!configStore) return;
    setIsSavingKeys(true);
    try {
      // Save profile if changed
      if (localProfile) {
        await setInfrastructureProfile(localProfile);
      }

      // Save API key values
      for (const req of activeRequirements) {
        const value = apiKeyValues[req.key] ?? "";
        if (value) {
          await configStore.set(req.key, value);
        } else {
          await configStore.remove(req.key);
        }
      }
      reinitialize();
      addToast("Settings saved. Services reinitializing...", "success");
    } finally {
      setIsSavingKeys(false);
    }
  };

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: "sun" as const },
    { value: "dark" as const, label: "Dark", icon: "moon" as const },
    { value: "system" as const, label: "System", icon: "settings" as const },
  ];

  const embeddingModels = localProfile
    ? getModelsForProvider(localProfile.embedding)
    : [];

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

      {/* Infrastructure Profile — visible in both modes */}
      {localProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon name="layers" className="text-tertiary" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                Infrastructure
              </h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p className="text-xs text-tertiary">
                Configure each infrastructure axis independently. Only providers compatible with the current runtime are shown.
              </p>
              {INFRA_AXES.map(({ axis, label }) => {
                const providers = getProvidersForAxis(axis, runtime);
                return (
                  <div key={axis}>
                    <label className="block text-xs font-medium text-secondary mb-1">
                      {label}
                    </label>
                    <select
                      value={localProfile[axis]}
                      onChange={(e) => handleProfileChange(axis, e.target.value)}
                      className="w-full rounded-lg border border-default bg-surface-2 px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
                    >
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.description}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

              {/* Embedding model selector */}
              {embeddingModels.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">
                    Embedding Model
                  </label>
                  <select
                    value={localProfile.embeddingModel ?? ""}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full rounded-lg border border-default bg-surface-2 px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
                  >
                    {embeddingModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.dimensions}d
                      </option>
                    ))}
                  </select>
                  {localProfile.embeddingDimensions && (
                    <p className="mt-1 text-xs text-tertiary">
                      Dimensions: {localProfile.embeddingDimensions}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="settings" className="text-tertiary" />
            <h2 className="text-sm font-semibold text-primary tracking-heading">
              API Keys
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <p className="text-xs text-tertiary">
              {activeRequirements.length > 0
                ? "Configure API keys required by the current embedding provider. Keys are stored in IndexedDB and never sent to any server."
                : "No API keys required for the current configuration."}
            </p>
            {activeRequirements.map((def) => {
              const value = apiKeyValues[def.key] ?? "";
              const isConfigured = value.length > 0;
              return (
                <div key={def.key} className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      type="password"
                      label={def.label}
                      placeholder={`Enter ${def.label}`}
                      value={value}
                      onChange={(e) =>
                        setApiKeyValues((prev) => ({
                          ...prev,
                          [def.key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div
                    className={`mb-2 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      isConfigured ? "bg-success" : "bg-surface-3"
                    }`}
                    title={isConfigured ? "Configured" : "Not configured"}
                  />
                </div>
              );
            })}
            <LoadingButton
              onClick={handleSaveKeys}
              loading={isSavingKeys}
              loadingText="Saving..."
              variant="primary"
              size="sm"
            >
              <Icon name="check" />
              Save & Reinitialize
            </LoadingButton>
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
