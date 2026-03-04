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
  const { service, mode } = useRuntimeMode();
  const { addToast } = useToast();
  const [sourceName, setSourceName] = useState("");
  const [uri, setUri] = useState("");
  const [sourceType, setSourceType] = useState("PLAIN_TEXT");
  const [language, setLanguage] = useState("en");
  const [createdBy, setCreatedBy] = useState("dashboard-user");
  const [file, setFile] = useState<File | null>(null);

  const isBrowser = mode === "browser";

  const executePipeline = useCallback(
    (input: ExecutePipelineInput) => service!.execute(input),
    [service],
  );

  const { error, isLoading, execute } = usePipelineAction(executePipeline);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected) {
      setUri(selected.name);
      // Auto-detect source type from file extension
      const ext = selected.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf") setSourceType("PDF");
      else if (ext === "md") setSourceType("MARKDOWN");
      else setSourceType("PLAIN_TEXT");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    let content: ArrayBuffer | undefined;
    if (isBrowser && file) {
      content = await file.arrayBuffer();
    }

    const input: ExecutePipelineInput = {
      sourceId: crypto.randomUUID(),
      sourceName: sourceName || (file?.name ?? ""),
      uri,
      sourceType,
      extractionJobId: crypto.randomUUID(),
      resourceId: crypto.randomUUID(),
      projectionId: crypto.randomUUID(),
      projectionType: "EMBEDDING",
      processingProfileId: "default",
      contextId: crypto.randomUUID(),
      language,
      createdBy,
      content,
    };

    const result = await execute(input);
    if (result) {
      addToast(
        `Document processed successfully. Chunks: ${result.chunksCount}, Dimensions: ${result.dimensions}`,
        "success",
      );
      setSourceName("");
      setUri("");
      setFile(null);
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
          placeholder={isBrowser ? "My Document (optional if file selected)" : "My Document"}
          required={!isBrowser || !file}
        />
        {isBrowser ? (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              File
            </label>
            <input
              type="file"
              accept=".txt,.md,.csv,.json,.pdf"
              onChange={handleFileChange}
              required
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                file:text-sm file:font-medium file:bg-slate-200 file:text-slate-700
                dark:file:bg-slate-700 dark:file:text-slate-200
                hover:file:bg-slate-300 dark:hover:file:bg-slate-600
                file:cursor-pointer file:transition-colors"
              style={{ color: "var(--text-secondary)" }}
            />
          </div>
        ) : (
          <Input
            label="URI"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder="/path/to/file.txt or https://..."
            required
          />
        )}
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
