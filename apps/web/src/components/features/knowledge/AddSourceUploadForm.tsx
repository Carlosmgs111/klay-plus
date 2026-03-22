import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Input } from "../../shared/Input";
import { FileProcessingForm } from "../../shared/FileProcessingForm";
import { detectFileType } from "../../../utils/fileDetection";
import type { ProcessKnowledgeInput, ProcessKnowledgeSuccess } from "@klay/core";

interface AddSourceUploadFormProps {
  contextId: string;
  onSuccess?: () => void;
}

export function AddSourceUploadForm({ contextId, onSuccess }: AddSourceUploadFormProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();

  const [processingProfileId, setProcessingProfileId] = useState("default");

  const processAction = useCallback(
    (input: ProcessKnowledgeInput) => service!.process(input),
    [service],
  );

  const { error, execute } = useServiceAction(processAction);

  const handleProcess = async (file: File) => {
    if (!service) return null;

    const fileBuffer = await file.arrayBuffer();
    const detected = detectFileType(file.name);

    const input: ProcessKnowledgeInput = {
      sourceId: crypto.randomUUID(),
      sourceName: file.name,
      uri: file.name,
      sourceType: detected?.type ?? "PLAIN_TEXT",
      extractionJobId: crypto.randomUUID(),
      projectionId: crypto.randomUUID(),
      projectionType: "EMBEDDING",
      processingProfileId,
      contextId,
      content: fileBuffer,
    };

    const result = await execute(input);
    if (result) {
      addToast(
        `Source added — ${result.chunksCount ?? 0} chunks`,
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
      serviceReady={!!service}
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
