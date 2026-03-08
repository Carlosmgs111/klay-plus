import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { Spinner } from "../../shared/Spinner";
import { StatsGrid } from "../../shared/StatsGrid";
import { FileDropZone } from "../../shared/FileDropZone";
import { detectFileType, fileToBase64 } from "../../../utils/fileDetection";
import type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "@klay/core/management";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "idle" | "file-selected" | "processing" | "success" | "error";

interface AddSourceUploadFormProps {
  contextId: string;
  onSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddSourceUploadForm({
  contextId,
  onSuccess,
}: AddSourceUploadFormProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [processingProfileId, setProcessingProfileId] = useState("default");
  const [result, setResult] = useState<IngestAndAddSourceSuccess | null>(null);

  const addSourceAction = useCallback(
    (input: IngestAndAddSourceInput) =>
      lifecycleService!.ingestAndAddSource(input),
    [lifecycleService],
  );

  const { error, execute } = useServiceAction(addSourceAction);

  // ─── File Selection ─────────────────────────────────────────────────

  const handleFileSelect = (f: File) => {
    setFile(f);
    setPhase("file-selected");
  };

  const handleFileRemove = () => {
    setFile(null);
    setPhase("idle");
  };

  // ─── Submit ───────────────────────────────────────────────────────────

  const handleProcess = async () => {
    if (!lifecycleService || !file) return;

    setPhase("processing");

    const base64Content = await fileToBase64(file);
    const detected = detectFileType(file.name);

    const input: IngestAndAddSourceInput = {
      contextId,
      sourceId: crypto.randomUUID(),
      sourceName: file.name,
      uri: file.name,
      sourceType: detected?.type ?? "PLAIN_TEXT",
      extractionJobId: crypto.randomUUID(),
      projectionId: crypto.randomUUID(),
      projectionType: "EMBEDDING",
      processingProfileId,
      content: base64Content as unknown as ArrayBuffer,
    };

    const actionResult = await execute(input);
    if (actionResult) {
      setResult(actionResult);
      setPhase("success");
      addToast(
        `Source added — ${actionResult.chunksCount} chunks, v${actionResult.contextId.slice(0, 8)}`,
        "success",
      );
      onSuccess?.();
    } else {
      setPhase("error");
    }
  };

  const handleUploadAnother = () => {
    setFile(null);
    setResult(null);
    setPhase("idle");
    setShowAdvanced(false);
  };

  const handleTryAgain = () => {
    setPhase("file-selected");
  };

  // ─── Render: Processing ───────────────────────────────────────────────

  if (phase === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <Spinner size="lg" />
        <p className="mt-4 text-sm font-medium text-primary">
          Adding source to context...
        </p>
        <p className="mt-1 text-xs text-tertiary">{file?.name}</p>
      </div>
    );
  }

  // ─── Render: Success ──────────────────────────────────────────────────

  if (phase === "success" && result) {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col items-center py-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-success-muted animate-scale-spring">
            <Icon name="check" className="text-xl text-success" />
          </div>
          <p className="text-sm font-medium text-primary">
            Source added successfully
          </p>
          <p className="mt-1 text-xs text-tertiary">{file?.name}</p>
        </div>

        <StatsGrid
          stats={[
            { label: "Chunks", value: result.chunksCount },
            { label: "Dimensions", value: result.dimensions },
            { label: "Model", value: result.model, truncate: true },
          ]}
          className="mb-6"
        />

        <Button
          variant="secondary"
          className="w-full"
          onClick={handleUploadAnother}
        >
          Add Another Source
        </Button>
      </div>
    );
  }

  // ─── Render: Main (idle / file-selected / error) ──────────────────────

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <FileDropZone
        file={file}
        onSelect={handleFileSelect}
        onRemove={handleFileRemove}
        height={200}
      />

      {/* Pipeline Error */}
      {phase === "error" && error && (
        <div className="space-y-3 animate-fade-in">
          <ErrorDisplay {...error} />
          <Button variant="secondary" size="sm" onClick={handleTryAgain}>
            Try Again
          </Button>
        </div>
      )}

      {/* Advanced Options */}
      {phase === "file-selected" && (
        <div className="animate-fade-in">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors text-tertiary"
          >
            <Icon
              name={showAdvanced ? "chevron-up" : "chevron-down"}
              className="text-xs"
            />
            Advanced options
          </button>
          {showAdvanced && (
            <div className="mt-3 animate-fade-in">
              <Input
                label="Processing Profile ID"
                value={processingProfileId}
                onChange={(e) => setProcessingProfileId(e.target.value)}
                placeholder="default"
              />
            </div>
          )}
        </div>
      )}

      {/* Process Button */}
      {phase === "file-selected" && (
        <Button
          className="w-full"
          onClick={handleProcess}
          disabled={!lifecycleService}
        >
          Add Source
        </Button>
      )}
    </div>
  );
}
