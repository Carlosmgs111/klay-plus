import { useState, useCallback, useEffect, useMemo } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Select } from "../../shared/Select";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { LoadingButton } from "../../shared/LoadingButton";
import {
  PREPARATION_STRATEGIES,
  FRAGMENTATION_STRATEGIES,
  getEmbeddingStrategyOptions,
  getRequirementsForStrategy,
} from "../../../constants/processingStrategies";
import type { UpdateProfileInput, ListProfilesResult } from "@klay/core";
import type { RuntimeEnvironment } from "@klay/core/config";

type ProfileEntry = ListProfilesResult["profiles"][number];

interface ProfileEditFormProps {
  profile: ProfileEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function SectionHeader({
  title,
  subtitle,
  open,
  onToggle,
}: {
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg border border-primary/10 bg-secondary/30 px-3 py-2 text-left transition-colors hover:bg-secondary/50"
    >
      <div>
        <span className="text-sm font-medium text-primary">{title}</span>
        <span className="ml-2 text-xs text-tertiary">{subtitle}</span>
      </div>
      <Icon name={open ? "chevron-up" : "chevron-down"} className="h-4 w-4 text-tertiary" />
    </button>
  );
}

export function ProfileEditForm({ profile, onSuccess, onCancel }: ProfileEditFormProps) {
  const { service, mode, configStore } = useRuntimeMode();
  const { addToast } = useToast();
  const runtime: RuntimeEnvironment = mode === "browser" ? "browser" : "server";
  const embeddingStrategies = useMemo(() => getEmbeddingStrategyOptions(runtime), [runtime]);

  // --- Name ---
  const [name, setName] = useState(profile.name);

  // --- Preparation layer ---
  const [prepOpen, setPrepOpen] = useState(false);
  const [preparationStrategy, setPreparationStrategy] = useState(profile.preparation?.strategyId ?? "none");
  const prepConfig = profile.preparation?.config ?? {};
  const [prepNormalizeWhitespace, setPrepNormalizeWhitespace] = useState((prepConfig as any).normalizeWhitespace ?? true);
  const [prepNormalizeEncoding, setPrepNormalizeEncoding] = useState((prepConfig as any).normalizeEncoding ?? true);
  const [prepTrimContent, setPrepTrimContent] = useState((prepConfig as any).trimContent ?? true);

  // --- Fragmentation layer ---
  const [fragOpen, setFragOpen] = useState(true);
  const [fragmentationStrategy, setFragmentationStrategy] = useState(profile.fragmentation.strategyId);
  const fragConfig = profile.fragmentation.config ?? {};
  const [fragChunkSize, setFragChunkSize] = useState((fragConfig as any).chunkSize ?? 1000);
  const [fragOverlap, setFragOverlap] = useState((fragConfig as any).overlap ?? 100);
  const [fragMaxChunkSize, setFragMaxChunkSize] = useState((fragConfig as any).maxChunkSize ?? 1000);
  const [fragMinChunkSize, setFragMinChunkSize] = useState((fragConfig as any).minChunkSize ?? 100);

  // --- Projection layer ---
  const [projOpen, setProjOpen] = useState(true);
  const [projectionStrategy, setProjectionStrategy] = useState(profile.projection.strategyId);
  const projConfig = profile.projection.config ?? {};
  const [projDimensions, setProjDimensions] = useState((projConfig as any).dimensions ?? 128);
  const [projBatchSize, setProjBatchSize] = useState((projConfig as any).batchSize ?? 100);

  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  const handleFragmentationChange = (value: string) => {
    setFragmentationStrategy(value);
    const selected = FRAGMENTATION_STRATEGIES.find((s) => s.value === value);
    if (selected) {
      const cfg = selected.defaultConfig;
      if ("chunkSize" in cfg) setFragChunkSize(cfg.chunkSize);
      if ("overlap" in cfg) setFragOverlap(cfg.overlap);
      if ("maxChunkSize" in cfg) setFragMaxChunkSize(cfg.maxChunkSize);
      if ("minChunkSize" in cfg) setFragMinChunkSize(cfg.minChunkSize);
    }
  };

  const handleProjectionChange = (value: string) => {
    setProjectionStrategy(value);
    const selected = embeddingStrategies.find((s) => s.value === value);
    if (selected?.defaultConfig) {
      if (selected.defaultConfig.dimensions) setProjDimensions(selected.defaultConfig.dimensions);
      setProjBatchSize(selected.defaultConfig.batchSize ?? 100);
    }
  };

  useEffect(() => {
    const requirements = getRequirementsForStrategy(projectionStrategy);
    if (requirements.length === 0 || !configStore) {
      setMissingKeys([]);
      return;
    }
    Promise.all(
      requirements.map(async (req) => {
        const has = await configStore.has(req.key);
        return has ? null : req.label;
      }),
    ).then((results) => setMissingKeys(results.filter((r): r is string => r !== null)));
  }, [projectionStrategy, configStore]);

  const updateAction = useCallback(
    (input: UpdateProfileInput) => service!.updateProfile(input),
    [service],
  );

  const { error, isLoading, execute } = useServiceAction(updateAction);

  const buildPreparationConfig = () => {
    if (preparationStrategy === "none") return {};
    return { normalizeWhitespace: prepNormalizeWhitespace, normalizeEncoding: prepNormalizeEncoding, trimContent: prepTrimContent };
  };

  const buildFragmentationConfig = () => {
    if (fragmentationStrategy === "recursive") {
      return { strategy: "recursive" as const, chunkSize: fragChunkSize, overlap: fragOverlap };
    }
    if (fragmentationStrategy === "sentence") {
      return { strategy: "sentence" as const, maxChunkSize: fragMaxChunkSize, minChunkSize: fragMinChunkSize };
    }
    return { strategy: "fixed-size" as const, chunkSize: fragChunkSize, overlap: fragOverlap };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    const input: UpdateProfileInput = {
      id: profile.id,
      ...(name !== profile.name && { name }),
      preparation: { strategyId: preparationStrategy, config: buildPreparationConfig() },
      fragmentation: { strategyId: fragmentationStrategy, config: buildFragmentationConfig() },
      projection: { strategyId: projectionStrategy, config: { dimensions: projDimensions, batchSize: projBatchSize } },
    };

    const result = await execute(input);
    if (result) {
      addToast(`Profile updated. Version: ${result.version}`, "success");
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Profile Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Default Processing"
        required
      />

      {/* ─── Preparation Layer ─── */}
      <SectionHeader
        title="Preparation"
        subtitle={PREPARATION_STRATEGIES.find((s) => s.value === preparationStrategy)?.label ?? preparationStrategy}
        open={prepOpen}
        onToggle={() => setPrepOpen(!prepOpen)}
      />
      {prepOpen && (
        <div className="space-y-3 rounded-lg border border-primary/5 bg-secondary/10 p-3">
          <Select
            label="Preparation Strategy"
            options={[...PREPARATION_STRATEGIES]}
            value={preparationStrategy}
            onChange={(e) => setPreparationStrategy(e.target.value)}
          />
          {preparationStrategy === "basic" && (
            <div className="space-y-2 pl-1">
              <label className="flex items-center gap-2 text-sm text-secondary">
                <input type="checkbox" checked={prepNormalizeWhitespace} onChange={(e) => setPrepNormalizeWhitespace(e.target.checked)} className="rounded" />
                Normalize whitespace
              </label>
              <label className="flex items-center gap-2 text-sm text-secondary">
                <input type="checkbox" checked={prepNormalizeEncoding} onChange={(e) => setPrepNormalizeEncoding(e.target.checked)} className="rounded" />
                Normalize encoding (NFC, CRLF → LF)
              </label>
              <label className="flex items-center gap-2 text-sm text-secondary">
                <input type="checkbox" checked={prepTrimContent} onChange={(e) => setPrepTrimContent(e.target.checked)} className="rounded" />
                Trim content
              </label>
            </div>
          )}
        </div>
      )}

      {/* ─── Fragmentation Layer ─── */}
      <SectionHeader
        title="Fragmentation"
        subtitle={FRAGMENTATION_STRATEGIES.find((s) => s.value === fragmentationStrategy)?.label ?? fragmentationStrategy}
        open={fragOpen}
        onToggle={() => setFragOpen(!fragOpen)}
      />
      {fragOpen && (
        <div className="space-y-3 rounded-lg border border-primary/5 bg-secondary/10 p-3">
          <Select
            label="Fragmentation Strategy"
            options={[...FRAGMENTATION_STRATEGIES]}
            value={fragmentationStrategy}
            onChange={(e) => handleFragmentationChange(e.target.value)}
          />
          {(fragmentationStrategy === "recursive" || fragmentationStrategy === "fixed-size") && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Chunk Size"
                type="number"
                min={50}
                value={fragChunkSize}
                onChange={(e) => setFragChunkSize(Number(e.target.value))}
              />
              <Input
                label="Overlap"
                type="number"
                min={0}
                value={fragOverlap}
                onChange={(e) => setFragOverlap(Number(e.target.value))}
              />
            </div>
          )}
          {fragmentationStrategy === "sentence" && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Max Chunk Size"
                type="number"
                min={50}
                value={fragMaxChunkSize}
                onChange={(e) => setFragMaxChunkSize(Number(e.target.value))}
              />
              <Input
                label="Min Chunk Size"
                type="number"
                min={1}
                value={fragMinChunkSize}
                onChange={(e) => setFragMinChunkSize(Number(e.target.value))}
              />
            </div>
          )}
        </div>
      )}

      {/* ─── Projection Layer ─── */}
      <SectionHeader
        title="Projection"
        subtitle={embeddingStrategies.find((s) => s.value === projectionStrategy)?.label ?? projectionStrategy}
        open={projOpen}
        onToggle={() => setProjOpen(!projOpen)}
      />
      {projOpen && (
        <div className="space-y-3 rounded-lg border border-primary/5 bg-secondary/10 p-3">
          <Select
            label="Embedding Strategy"
            options={embeddingStrategies}
            value={projectionStrategy}
            onChange={(e) => handleProjectionChange(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Dimensions"
              type="number"
              min={1}
              value={projDimensions}
              onChange={(e) => setProjDimensions(Number(e.target.value))}
            />
            <Input
              label="Batch Size"
              type="number"
              min={1}
              value={projBatchSize}
              onChange={(e) => setProjBatchSize(Number(e.target.value))}
            />
          </div>

          {missingKeys.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <Icon name="alert-triangle" />
              Missing API key{missingKeys.length > 1 ? "s" : ""}: {missingKeys.join(", ")}. Configure in Settings before using this strategy.
            </p>
          )}
        </div>
      )}

      <p className="text-xs font-mono text-tertiary">
        ID: {profile.id} | Version: {profile.version}
      </p>

      {error && <ErrorDisplay {...error} />}

      <div className="flex items-center gap-2">
        <LoadingButton type="submit" loading={isLoading} loadingText="Saving..." disabled={!service}>
          Save Changes
        </LoadingButton>
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
