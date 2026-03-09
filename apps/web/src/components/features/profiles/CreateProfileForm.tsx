import { useState, useCallback, useEffect, useMemo } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Input } from "../../shared/Input";
import { Select } from "../../shared/Select";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { LoadingButton } from "../../shared/LoadingButton";
import { CHUNKING_STRATEGIES, getEmbeddingStrategyOptions, getRequirementsForStrategy } from "../../../constants/processingStrategies";
import type { CreateProcessingProfileInput } from "@klay/core";
import type { RuntimeEnvironment } from "@klay/core/config";

interface CreateProfileFormProps {
  onSuccess?: () => void;
}

export function CreateProfileForm({ onSuccess }: CreateProfileFormProps) {
  const { service, mode, configStore } = useRuntimeMode();
  const { addToast } = useToast();
  const runtime: RuntimeEnvironment = mode === "browser" ? "browser" : "server";
  const embeddingStrategies = useMemo(() => getEmbeddingStrategyOptions(runtime), [runtime]);
  const [name, setName] = useState("");
  const [chunkingStrategyId, setChunkingStrategyId] = useState("recursive");
  const [embeddingStrategyId, setEmbeddingStrategyId] = useState("hash-embedding");
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  useEffect(() => {
    const requirements = getRequirementsForStrategy(embeddingStrategyId);
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
  }, [embeddingStrategyId, configStore]);

  const createProfile = useCallback(
    (input: CreateProcessingProfileInput) => service!.createProcessingProfile(input),
    [service],
  );

  const { error, isLoading, execute } = usePipelineAction(createProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    const result = await execute({
      id: crypto.randomUUID(),
      name,
      chunkingStrategyId,
      embeddingStrategyId,
    });

    if (result) {
      addToast(`Profile created. ID: ${result.profileId}, Version: ${result.version}`, "success");
      setName("");
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
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Chunking Strategy"
          options={CHUNKING_STRATEGIES}
          value={chunkingStrategyId}
          onChange={(e) => setChunkingStrategyId(e.target.value)}
        />
        <Select
          label="Embedding Strategy"
          options={embeddingStrategies}
          value={embeddingStrategyId}
          onChange={(e) => setEmbeddingStrategyId(e.target.value)}
        />
      </div>

      {missingKeys.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-warning">
          <Icon name="alert-triangle" />
          Missing API key{missingKeys.length > 1 ? "s" : ""}: {missingKeys.join(", ")}. Configure in Settings before using this strategy.
        </p>
      )}

      {error && <ErrorDisplay {...error} />}

      <LoadingButton type="submit" loading={isLoading} loadingText="Creating..." disabled={!service}>
        Create Profile
      </LoadingButton>
    </form>
  );
}
