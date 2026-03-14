import { useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { ErrorDisplay } from "./ErrorDisplay";
import { Spinner } from "./Spinner";
import { StatsGrid } from "./StatsGrid";
import { FileDropZone } from "./FileDropZone";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "idle" | "file-selected" | "processing" | "success" | "error";

interface ProcessingResult {
  chunksCount: number;
  dimensions: number;
  model: string;
}

export interface FileProcessingFormProps {
  /** Text shown while processing (e.g. "Processing document...") */
  processingLabel: string;
  /** Text shown on success (e.g. "Document processed successfully") */
  successLabel: string;
  /** Text on the submit button (e.g. "Process Document") */
  submitLabel: string;
  /** Text on the reset button after success (e.g. "Upload Another") */
  resetLabel: string;
  /** Whether the service is ready */
  serviceReady: boolean;
  /** Called when user submits the file. Should return result on success or null on error. */
  onProcess: (file: File) => Promise<{ result: ProcessingResult; toastMessage: string } | null>;
  /** Error from the service action */
  error?: { message: string; code: string; step?: string; completedSteps?: string[] } | null;
  /** Advanced options rendered between file drop and submit button */
  advancedOptions?: React.ReactNode;
  /** Called on successful processing */
  onSuccess?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FileProcessingForm({
  processingLabel,
  successLabel,
  submitLabel,
  resetLabel,
  serviceReady,
  onProcess,
  error,
  advancedOptions,
  onSuccess,
}: FileProcessingFormProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const handleFileSelect = (f: File) => {
    setFile(f);
    setPhase("file-selected");
  };

  const handleFileRemove = () => {
    setFile(null);
    setPhase("idle");
  };

  const handleProcess = async () => {
    if (!file) return;
    setPhase("processing");

    const outcome = await onProcess(file);
    if (outcome) {
      setResult(outcome.result);
      setPhase("success");
      onSuccess?.();
    } else {
      setPhase("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setPhase("idle");
    setShowAdvanced(false);
  };

  // ─── Render: Processing ─────────────────────────────────────────────

  if (phase === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <Spinner size="lg" />
        <p className="mt-4 text-sm font-medium text-primary">{processingLabel}</p>
        <p className="mt-1 text-xs text-tertiary">{file?.name}</p>
      </div>
    );
  }

  // ─── Render: Success ────────────────────────────────────────────────

  if (phase === "success" && result) {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col items-center py-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-success-muted animate-scale-spring">
            <Icon name="check" className="text-xl text-success" />
          </div>
          <p className="text-sm font-medium text-primary">{successLabel}</p>
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

        <Button variant="secondary" className="w-full" onClick={handleReset}>
          {resetLabel}
        </Button>
      </div>
    );
  }

  // ─── Render: Main (idle / file-selected / error) ────────────────────

  return (
    <div className="space-y-4">
      <FileDropZone
        file={file}
        onSelect={handleFileSelect}
        onRemove={handleFileRemove}
        height={200}
      />

      {phase === "error" && error && (
        <div className="space-y-3 animate-fade-in">
          <ErrorDisplay {...error} />
          <Button variant="secondary" size="sm" onClick={() => setPhase("file-selected")}>
            Try Again
          </Button>
        </div>
      )}

      {phase === "file-selected" && advancedOptions && (
        <div className="animate-fade-in">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors text-tertiary"
          >
            <Icon name={showAdvanced ? "chevron-up" : "chevron-down"} className="text-xs" />
            Advanced options
          </button>
          {showAdvanced && (
            <div className="mt-3 animate-fade-in">
              {advancedOptions}
            </div>
          )}
        </div>
      )}

      {phase === "file-selected" && (
        <Button className="w-full" onClick={handleProcess} disabled={!serviceReady}>
          {submitLabel}
        </Button>
      )}
    </div>
  );
}
