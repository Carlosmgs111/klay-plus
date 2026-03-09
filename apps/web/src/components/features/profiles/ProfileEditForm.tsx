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
import { CHUNKING_STRATEGIES, getEmbeddingStrategyOptions, getRequirementsForStrategy } from "../../../constants/processingStrategies";
import type { UpdateProfileInput, ListProfilesResult } from "@klay/core";
import type { RuntimeEnvironment } from "@klay/core/config";

type ProfileEntry = ListProfilesResult["profiles"][number];

interface ProfileEditFormProps {
  profile: ProfileEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileEditForm({ profile, onSuccess, onCancel }: ProfileEditFormProps) {
  const { service, mode, configStore } = useRuntimeMode();
  const { addToast } = useToast();
  const runtime: RuntimeEnvironment = mode === "browser" ? "browser" : "server";
  const embeddingStrategies = useMemo(() => getEmbeddingStrategyOptions(runtime), [runtime]);
  const [name, setName] = useState(profile.name);
  const [chunkingStrategyId, setChunkingStrategyId] = useState(profile.chunkingStrategyId);
  const [embeddingStrategyId, setEmbeddingStrategyId] = useState(profile.embeddingStrategyId);
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

  const updateAction = useCallback(
    (input: UpdateProfileInput) => service!.updateProfile(input),
    [service],
  );

  const { error, isLoading, execute } = useServiceAction(updateAction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    const input: UpdateProfileInput = {
      id: profile.id,
      ...(name !== profile.name && { name }),
      ...(chunkingStrategyId !== profile.chunkingStrategyId && { chunkingStrategyId }),
      ...(embeddingStrategyId !== profile.embeddingStrategyId && { embeddingStrategyId }),
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
