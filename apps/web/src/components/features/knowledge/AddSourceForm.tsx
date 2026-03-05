import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Select } from "../../shared/Select";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { Spinner } from "../../shared/Spinner";
import type { IngestAndAddSourceInput } from "@klay/core/management";

const SOURCE_TYPES = [
  { value: "PLAIN_TEXT", label: "Plain Text" },
  { value: "MARKDOWN", label: "Markdown" },
  { value: "PDF", label: "PDF" },
];

interface AddSourceFormProps {
  unitId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddSourceForm({ unitId, onSuccess, onCancel }: AddSourceFormProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [sourceName, setSourceName] = useState("");
  const [uri, setUri] = useState("");
  const [sourceType, setSourceType] = useState("PLAIN_TEXT");
  const [processingProfileId, setProcessingProfileId] = useState("default");

  const addSourceAction = useCallback(
    (input: IngestAndAddSourceInput) => lifecycleService!.ingestAndAddSource(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(addSourceAction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lifecycleService) return;

    const input: IngestAndAddSourceInput = {
      unitId,
      sourceId: crypto.randomUUID(),
      sourceName,
      uri,
      sourceType,
      extractionJobId: crypto.randomUUID(),
      projectionId: crypto.randomUUID(),
      projectionType: "EMBEDDING",
      processingProfileId,
    };

    const result = await execute(input);
    if (result) {
      addToast(
        `Source added. Chunks: ${result.chunksCount}, Version: ${result.version}`,
        "success",
      );
      setSourceName("");
      setUri("");
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs font-mono text-tertiary">
        Adding source to unit: {unitId.slice(0, 12)}...
      </p>

      <Input
        label="Source Name"
        value={sourceName}
        onChange={(e) => setSourceName(e.target.value)}
        placeholder="e.g. Research Paper v2"
        required
      />
      <Input
        label="URI"
        value={uri}
        onChange={(e) => setUri(e.target.value)}
        placeholder="/path/to/file.txt or https://..."
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Source Type"
          options={SOURCE_TYPES}
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
        />
        <Input
          label="Processing Profile ID"
          value={processingProfileId}
          onChange={(e) => setProcessingProfileId(e.target.value)}
          placeholder="default"
          required
        />
      </div>

      {error && <ErrorDisplay {...error} />}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isLoading || !lifecycleService}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Adding Source...
            </span>
          ) : (
            "Add Source"
          )}
        </Button>
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
