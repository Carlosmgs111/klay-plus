import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext.js";
import { usePipelineAction } from "../../../hooks/usePipelineAction.js";
import { Button } from "../../shared/Button.js";
import { Input } from "../../shared/Input.js";
import { Select } from "../../shared/Select.js";
import { ErrorDisplay } from "../../shared/ErrorDisplay.js";
import { Spinner } from "../../shared/Spinner.js";
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
  const [name, setName] = useState("");
  const [chunkingStrategyId, setChunkingStrategyId] = useState("recursive");
  const [embeddingStrategyId, setEmbeddingStrategyId] = useState("hash");

  const createProfile = useCallback(
    (input: CreateProcessingProfileInput) => service!.createProcessingProfile(input),
    [service],
  );

  const { data, error, isLoading, execute } = usePipelineAction(createProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    await execute({
      id: crypto.randomUUID(),
      name,
      chunkingStrategyId,
      embeddingStrategyId,
    });

    if (data) {
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

      {data && (
        <div className="bg-success-50 border border-success-500/30 rounded-card p-3 text-sm text-success-700">
          Profile created. ID: {data.profileId}, Version: {data.version}
        </div>
      )}

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
