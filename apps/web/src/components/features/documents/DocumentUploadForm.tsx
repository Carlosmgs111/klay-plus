import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext.js";
import { usePipelineAction } from "../../../hooks/usePipelineAction.js";
import { Button } from "../../shared/Button.js";
import { Input } from "../../shared/Input.js";
import { Select } from "../../shared/Select.js";
import { ErrorDisplay } from "../../shared/ErrorDisplay.js";
import { Spinner } from "../../shared/Spinner.js";
import type { ExecutePipelineInput } from "@klay/core";

const SOURCE_TYPES = [
  { value: "PLAIN_TEXT", label: "Plain Text" },
  { value: "MARKDOWN", label: "Markdown" },
  { value: "PDF", label: "PDF" },
];

interface DocumentUploadFormProps {
  onSuccess?: () => void;
}

export function DocumentUploadForm({ onSuccess }: DocumentUploadFormProps) {
  const { service } = useRuntimeMode();
  const [sourceName, setSourceName] = useState("");
  const [uri, setUri] = useState("");
  const [sourceType, setSourceType] = useState("PLAIN_TEXT");
  const [language, setLanguage] = useState("en");
  const [createdBy, setCreatedBy] = useState("dashboard-user");

  const executePipeline = useCallback(
    (input: ExecutePipelineInput) => service!.execute(input),
    [service],
  );

  const { data, error, isLoading, execute } = usePipelineAction(executePipeline);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    const input: ExecutePipelineInput = {
      sourceId: crypto.randomUUID(),
      sourceName,
      uri,
      sourceType,
      extractionJobId: crypto.randomUUID(),
      resourceId: crypto.randomUUID(),
      projectionId: crypto.randomUUID(),
      projectionType: "EMBEDDING",
      processingProfileId: "default",
      semanticUnitId: crypto.randomUUID(),
      language,
      createdBy,
    };

    await execute(input);
    if (data) {
      setSourceName("");
      setUri("");
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Source Name"
        value={sourceName}
        onChange={(e) => setSourceName(e.target.value)}
        placeholder="My Document"
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
          label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="en"
        />
      </div>
      <Input
        label="Created By"
        value={createdBy}
        onChange={(e) => setCreatedBy(e.target.value)}
        placeholder="user name"
      />

      {error && <ErrorDisplay {...error} />}

      {data && (
        <div className="bg-success-50 border border-success-500/30 rounded-card p-3 text-sm text-success-700">
          Document processed successfully. Chunks: {data.chunksCount}, Dimensions:{" "}
          {data.dimensions}
        </div>
      )}

      <Button type="submit" disabled={isLoading || !service}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" /> Processing...
          </span>
        ) : (
          "Execute Pipeline"
        )}
      </Button>
    </form>
  );
}
