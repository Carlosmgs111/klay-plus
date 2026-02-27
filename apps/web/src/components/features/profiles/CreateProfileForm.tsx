import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Select } from "../../shared/Select";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { Spinner } from "../../shared/Spinner";
import type { CreateProcessingProfileInput } from "@klay/core";

const CHUNKING_STRATEGIES = [
  { value: "recursive", label: "Recursive" },
  { value: "sentence", label: "Sentence" },
  { value: "fixed-size", label: "Fixed Size" },
];

const EMBEDDING_STRATEGIES = [
  { value: "hash", label: "Hash (no API)" },
  { value: "openai", label: "OpenAI" },
];

interface CreateProfileFormProps {
  onSuccess?: () => void;
}

export function CreateProfileForm({ onSuccess }: CreateProfileFormProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [chunkingStrategyId, setChunkingStrategyId] = useState("recursive");
  const [embeddingStrategyId, setEmbeddingStrategyId] = useState("hash");

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

      <Button type="submit" disabled={isLoading || !service}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" /> Creating...
          </span>
        ) : (
          "Create Profile"
        )}
      </Button>
    </form>
  );
}
