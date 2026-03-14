import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Input } from "../../shared/Input";
import { FileProcessingForm } from "../../shared/FileProcessingForm";
import { detectFileType } from "../../../utils/fileDetection";
import type { IngestAndAddSourceInput, IngestAndAddSourceSuccess } from "@klay/core";

interface AddSourceUploadFormProps {
  contextId: string;
  onSuccess?: () => void;
}

export function AddSourceUploadForm({ contextId, onSuccess }: AddSourceUploadFormProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();

  const [processingProfileId, setProcessingProfileId] = useState("default");

  const addSourceAction = useCallback(
    (input: IngestAndAddSourceInput) => lifecycleService!.ingestAndAddSource(input),
    [lifecycleService],
  );

  const { error, execute } = useServiceAction(addSourceAction);

  const handleProcess = async (file: File) => {
    if (!lifecycleService) return null;

    const fileBuffer = await file.arrayBuffer();
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
      content: fileBuffer,
    };

    const result = await execute(input);
    if (result) {
      addToast(
        `Source added — ${result.chunksCount} chunks, v${result.contextId.slice(0, 8)}`,
        "success",
      );
      return { result, toastMessage: "Source added" };
    }
    return null;
  };

  return (
    <FileProcessingForm
      processingLabel="Adding source to context..."
      successLabel="Source added successfully"
      submitLabel="Add Source"
      resetLabel="Add Another Source"
      serviceReady={!!lifecycleService}
      onProcess={handleProcess}
      error={error}
      onSuccess={onSuccess}
      advancedOptions={
        <Input
          label="Processing Profile ID"
          value={processingProfileId}
          onChange={(e) => setProcessingProfileId(e.target.value)}
          placeholder="default"
        />
      }
    />
  );
}
