import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Select } from "../../shared/Select";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { LoadingButton } from "../../shared/LoadingButton";
import { CHUNKING_STRATEGIES, EMBEDDING_STRATEGIES } from "../../../constants/processingStrategies";
import type { UpdateProfileInput, ListProfilesResult } from "@klay/core";

type ProfileEntry = ListProfilesResult["profiles"][number];

interface ProfileEditFormProps {
  profile: ProfileEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileEditForm({ profile, onSuccess, onCancel }: ProfileEditFormProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();
  const [name, setName] = useState(profile.name);
  const [chunkingStrategyId, setChunkingStrategyId] = useState(profile.chunkingStrategyId);
  const [embeddingStrategyId, setEmbeddingStrategyId] = useState(profile.embeddingStrategyId);

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
          options={EMBEDDING_STRATEGIES}
          value={embeddingStrategyId}
          onChange={(e) => setEmbeddingStrategyId(e.target.value)}
        />
      </div>

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
