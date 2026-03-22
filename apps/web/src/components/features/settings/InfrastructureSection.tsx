import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { LoadingButton } from "../../shared/LoadingButton";
import { useToast } from "../../../contexts/ToastContext";
import { ProviderForm } from "./ProviderForm";
import { RetrievalSection } from "./RetrievalSection";
import { normalizeProfile, setNestedValue } from "./infrastructure-helpers";
import {
  PRESET_PROFILES,
  getProvidersForAxis,
  getProvider,
  getProfileRequirements,
  getModelsForProvider,
  getDefaultModel,
  validateProfile,
} from "@klay/core/config";
import type {
  InfrastructureAxis,
  InfrastructureProfile,
  RetrievalConfig,
  RuntimeEnvironment,
} from "@klay/core/config";
import type { ConfigStore } from "@klay/core/config";
import type { SecretStore } from "@klay/core/secrets";
import type { BatchConfigStore } from "../../../services/server-config-service";

function isBatchConfigStore(store: ConfigStore): store is BatchConfigStore {
  return "saveAndReinitialize" in store;
}

const PRESET_ICONS: Record<string, string> = {
  "in-memory": "zap",
  browser: "globe",
  server: "server",
};

const AXIS_META: { axis: InfrastructureAxis; label: string; icon: string }[] = [
  { axis: "persistence", label: "Persistence", icon: "database" },
  { axis: "vectorStore", label: "Vector Store", icon: "layers" },
  { axis: "documentStorage", label: "Document Storage", icon: "archive" },
  { axis: "embedding", label: "Embedding", icon: "brain" },
];

const selectClass =
  "w-full rounded-lg border border-default bg-surface-2 px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none";

function runtimeFromMode(mode: string): RuntimeEnvironment {
  return mode === "browser" ? "browser" : "server";
}

interface InfrastructureSectionProps {
  localProfile: InfrastructureProfile;
  setLocalProfile: (profile: InfrastructureProfile) => void;
  mode: string;
  configStore: ConfigStore | null;
  secretStore: SecretStore | null;
  reinitialize: () => void;
  setInfrastructureProfile: (profile: InfrastructureProfile) => Promise<void>;
}

export function InfrastructureSection({
  localProfile: rawProfile,
  setLocalProfile,
  mode,
  configStore,
  secretStore,
  reinitialize,
  setInfrastructureProfile,
}: InfrastructureSectionProps) {
  const localProfile = useMemo(() => normalizeProfile(rawProfile), [rawProfile]);
  const { addToast } = useToast();
  const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({});
  const [configuredKeys, setConfiguredKeys] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const isServerMode = mode === "server";
  const runtime = runtimeFromMode(mode);
  const allRequirements = getProfileRequirements(localProfile);

  const validationErrors = useMemo(() => validateProfile(localProfile), [localProfile]);
  const hasBlockingErrors = validationErrors.some(
    (e) => e.code === "RUNTIME_MISMATCH" || e.code === "DIMENSION_MISMATCH",
  );

  const activePresetId = useMemo(() => {
    return (
      Object.entries(PRESET_PROFILES).find(
        ([, preset]) =>
          preset.persistence.type === localProfile.persistence.type &&
          preset.vectorStore.type === localProfile.vectorStore.type &&
          preset.embedding.type === localProfile.embedding.type &&
          preset.documentStorage.type === localProfile.documentStorage.type,
      )?.[0] ?? null
    );
  }, [localProfile]);

  // Load credential status from SecretStore
  useEffect(() => {
    if (!secretStore) return;
    secretStore.list().then((summaries) => {
      setConfiguredKeys(new Set(summaries.map((s) => s.key)));
    });
  }, [secretStore]);

  // One-time migration: seed SecretStore from ConfigStore
  useEffect(() => {
    if (!configStore || !secretStore) return;
    let cancelled = false;

    (async () => {
      const [summaries, values] = await Promise.all([
        secretStore.list(),
        configStore.loadAll(),
      ]);
      if (cancelled || summaries.length > 0) return;

      const entries = Object.entries(values).filter(([, v]) => v.length > 0);
      if (entries.length === 0) return;

      for (const [key, value] of entries) {
        await secretStore.set(key, value, { category: "api-key" });
      }
      setConfiguredKeys(new Set(entries.map(([k]) => k)));
    })();

    return () => { cancelled = true; };
  }, [configStore, secretStore]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESET_PROFILES[presetId];
    if (preset) setLocalProfile({ ...preset });
  };

  const updateAxisField = (axis: InfrastructureAxis, fieldKey: string, value: unknown) => {
    const current = localProfile[axis] as Record<string, unknown>;
    const updated = setNestedValue(current, fieldKey, value);
    setLocalProfile({ ...localProfile, [axis]: updated as any });
  };

  const handleProfileChange = (axis: InfrastructureAxis, value: string) => {
    let axisConfig: any;

    if (axis === "persistence") {
      axisConfig = { type: value };
    } else if (axis === "vectorStore") {
      const currentDims =
        "dimensions" in localProfile.vectorStore
          ? (localProfile.vectorStore as any).dimensions
          : 128;
      axisConfig = { type: value, dimensions: currentDims };
    } else if (axis === "embedding") {
      const defaultModel = getDefaultModel(value);
      if (defaultModel) {
        axisConfig = { type: value, model: defaultModel.id, dimensions: defaultModel.dimensions };
        setLocalProfile({
          ...localProfile,
          [axis]: axisConfig,
          vectorStore: { ...localProfile.vectorStore, dimensions: defaultModel.dimensions },
        });
        return;
      }
      axisConfig = { type: value };
    } else if (axis === "documentStorage") {
      axisConfig = value === "local" ? { type: value, basePath: "./data/uploads" } : { type: value };
    } else {
      axisConfig = { type: value };
    }

    setLocalProfile({ ...localProfile, [axis]: axisConfig });
  };

  const handleModelChange = (modelId: string) => {
    const embeddingModels = getModelsForProvider(localProfile.embedding.type);
    const model = embeddingModels.find((m) => m.id === modelId);
    if (!model) return;
    setLocalProfile({
      ...localProfile,
      embedding: { ...localProfile.embedding, model: modelId, dimensions: model.dimensions } as any,
      vectorStore: { ...localProfile.vectorStore, dimensions: model.dimensions },
    });
  };

  const handleApiKeyChange = (key: string, value: string) => {
    setApiKeyValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleRetrievalChange = (retrieval: RetrievalConfig) => {
    setLocalProfile({ ...localProfile, retrieval });
  };

  const handleSave = async () => {
    if (!configStore) return;
    setIsSaving(true);

    try {
      await setInfrastructureProfile(localProfile);

      const entries: Record<string, string> = {};
      for (const req of allRequirements) {
        entries[req.key] = apiKeyValues[req.key] ?? "";
      }

      if (secretStore) {
        for (const req of allRequirements) {
          const value = entries[req.key];
          if (value) {
            await secretStore.set(req.key, value, { category: "api-key" });
          }
        }
      }

      if (isServerMode && isBatchConfigStore(configStore)) {
        await configStore.saveAndReinitialize(entries);
      } else {
        for (const [key, value] of Object.entries(entries)) {
          if (value) {
            await configStore.set(key, value);
          } else {
            await configStore.remove(key);
          }
        }
      }

      const newConfigured = new Set(configuredKeys);
      for (const req of allRequirements) {
        if (entries[req.key]) newConfigured.add(req.key);
      }
      setConfiguredKeys(newConfigured);
      setApiKeyValues({});

      reinitialize();
      addToast("Settings saved. Services reinitializing...", "success");
    } catch (err) {
      addToast(`Failed to save settings: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="layers" className="text-tertiary" />
          <h2 className="text-sm font-semibold text-primary tracking-heading">Infrastructure</h2>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-2">Quick Start Presets</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(PRESET_PROFILES).map(([id, preset]) => {
                const isActive = activePresetId === id;
                return (
                  <button
                    key={id}
                    onClick={() => handlePresetSelect(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                      transition-all duration-normal ease-out-expo border
                      ${isActive
                        ? "border-accent bg-accent-muted text-accent"
                        : "border-default bg-surface-2 text-secondary hover:border-accent/50"
                      }`}
                  >
                    <Icon name={PRESET_ICONS[id] ?? "settings"} />
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Banner */}
          {validationErrors.length > 0 && (
            <div className="p-3 rounded-lg border border-warning/30 bg-warning-muted">
              <div className="flex items-start gap-2">
                <Icon name="alert-triangle" className="text-warning mt-0.5" />
                <div className="space-y-1">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-xs text-warning">{err.message}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-tertiary">
            Configure each infrastructure axis independently. Only providers
            compatible with the current runtime are shown.
          </p>

          {/* Per-axis sections */}
          {AXIS_META.map(({ axis, label, icon }) => {
            const providers = getProvidersForAxis(axis, runtime);
            const currentType = (localProfile[axis] as { type: string }).type;
            const currentProvider = getProvider(axis, currentType);
            const embeddingModels = axis === "embedding" ? getModelsForProvider(currentType) : [];
            const currentModelId =
              axis === "embedding" && "model" in localProfile.embedding
                ? (localProfile.embedding as { model?: string }).model
                : undefined;

            return (
              <div key={axis} className="rounded-lg border border-subtle bg-surface-2/50 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={icon} className="text-tertiary" />
                  <label className="text-xs font-semibold text-secondary tracking-heading uppercase">
                    {label}
                  </label>
                </div>
                <select
                  value={currentType}
                  onChange={(e) => handleProfileChange(axis, e.target.value)}
                  className={selectClass}
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.description}</option>
                  ))}
                </select>
                {currentProvider && (
                  <ProviderForm
                    axis={axis}
                    provider={currentProvider}
                    config={localProfile[axis] as Record<string, unknown>}
                    embeddingModels={embeddingModels}
                    currentModelId={currentModelId}
                    apiKeyValues={apiKeyValues}
                    configuredKeys={configuredKeys}
                    onFieldChange={updateAxisField}
                    onModelChange={handleModelChange}
                    onApiKeyChange={handleApiKeyChange}
                  />
                )}
              </div>
            );
          })}

          {/* Retrieval */}
          <RetrievalSection
            value={localProfile.retrieval ?? {}}
            onChange={handleRetrievalChange}
            runtimeMode={mode as "browser" | "server" | "uninitialized"}
          />

          {/* Save */}
          <div className="flex items-center gap-3 pt-2 border-t border-subtle">
            <LoadingButton
              onClick={handleSave}
              loading={isSaving}
              loadingText="Saving..."
              variant="primary"
              size="sm"
              disabled={hasBlockingErrors}
            >
              <Icon name="check" />
              Save & Reinitialize
            </LoadingButton>
            {hasBlockingErrors && (
              <p className="text-xs text-warning">Fix validation errors above before saving.</p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
