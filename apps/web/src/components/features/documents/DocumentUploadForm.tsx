import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Select } from "../../shared/Select";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { Spinner } from "../../shared/Spinner";
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
  const { addToast } = useToast();
  const [sourceName, setSourceName] = useState("");
  const [uri, setUri] = useState("");
  const [sourceType, setSourceType] = useState("PLAIN_TEXT");
  const [language, setLanguage] = useState("en");
  const [createdBy, setCreatedBy] = useState("dashboard-user");

  const executePipeline = useCallback(
    (input: ExecutePipelineInput) => service!.execute(input),
    [service],
  );

  const { error, isLoading, execute } = usePipelineAction(executePipeline);

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

    const result = await execute(input);
    if (result) {
      addToast(
        `Document processed successfully. Chunks: ${result.chunksCount}, Dimensions: ${result.dimensions}`,
        "success",
      );
      setSourceName("");
      setUri("");
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
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
      </div>

      <div
        className="pt-4"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
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
      </div>

      <div
        className="pt-4"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <Input
          label="Created By"
          value={createdBy}
          onChange={(e) => setCreatedBy(e.target.value)}
          placeholder="user name"
        />
      </div>

      {error && <ErrorDisplay {...error} />}

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
