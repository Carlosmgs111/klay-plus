import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Input } from "../../shared/Input";
import { Select } from "../../shared/Select";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { LoadingButton } from "../../shared/LoadingButton";
import { CHUNKING_STRATEGIES, EMBEDDING_STRATEGIES } from "../../../constants/processingStrategies";
import type { CreateProcessingProfileInput } from "@klay/core";

interface CreateProfileFormProps {
  onSuccess?: () => void;
}

export function CreateProfileForm({ onSuccess }: CreateProfileFormProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [chunkingStrategyId, setChunkingStrategyId] = useState("recursive");
  const [embeddingStrategyId, setEmbeddingStrategyId] = useState("hash-embedding");

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
          options={EMBEDDING_STRATEGIES}
          value={embeddingStrategyId}
          onChange={(e) => setEmbeddingStrategyId(e.target.value)}
        />
      </div>

      {error && <ErrorDisplay {...error} />}

      <LoadingButton type="submit" loading={isLoading} loadingText="Creating..." disabled={!service}>
        Create Profile
      </LoadingButton>
    </form>
  );
}
