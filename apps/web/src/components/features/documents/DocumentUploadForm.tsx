import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Input } from "../../shared/Input";
import { FileProcessingForm } from "../../shared/FileProcessingForm";
import { detectFileType } from "../../../utils/fileDetection";
import type { ProcessKnowledgeInput, ProcessKnowledgeSuccess } from "@klay/core";

interface DocumentUploadFormProps {
  onSuccess?: () => void;
}

export function DocumentUploadForm({ onSuccess }: DocumentUploadFormProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();

  const [language, setLanguage] = useState("en");
  const [createdBy, setCreatedBy] = useState("dashboard-user");

  const processKnowledge = useCallback(
    (input: ProcessKnowledgeInput) => service!.process(input),
    [service],
  );

  const { error, execute } = usePipelineAction(processKnowledge);

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
      resourceId: crypto.randomUUID(),
      projectionId: crypto.randomUUID(),
      projectionType: "EMBEDDING",
      processingProfileId: "default",
    };

    const result = await execute(input);
    if (result) {
      addToast("Document processed successfully", "success");
      return { result, toastMessage: "Document processed successfully" };
    }
    return null;
  };

  return (
    <FileProcessingForm
      processingLabel="Processing document..."
      successLabel="Document processed successfully"
      submitLabel="Process Document"
      resetLabel="Upload Another"
      serviceReady={!!service}
      onProcess={handleProcess}
      error={error}
      onSuccess={onSuccess}
      advancedOptions={
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="en"
          />
          <Input
            label="Created By"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="dashboard-user"
          />
        </div>
      }
    />
  );
}
