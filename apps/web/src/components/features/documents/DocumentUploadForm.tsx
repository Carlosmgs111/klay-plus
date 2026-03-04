import { useState, useCallback, useRef, useEffect } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { Spinner } from "../../shared/Spinner";
import type {
  ExecutePipelineInput,
  ExecutePipelineSuccess,
} from "@klay/core";

// ─── File Type Detection ──────────────────────────────────────────────────────

const SUPPORTED_EXTENSIONS: Record<string, { type: string; label: string }> = {
  pdf: { type: "PDF", label: "PDF Document" },
  md: { type: "MARKDOWN", label: "Markdown" },
  txt: { type: "PLAIN_TEXT", label: "Plain Text" },
  csv: { type: "CSV", label: "CSV Spreadsheet" },
  json: { type: "JSON", label: "JSON Data" },
};

const ACCEPT_STRING = Object.keys(SUPPORTED_EXTENSIONS)
  .map((e) => `.${e}`)
  .join(",");

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function detectFileType(name: string) {
  const ext = getFileExtension(name);
  return SUPPORTED_EXTENSIONS[ext] ?? null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "idle" | "file-selected" | "processing" | "success" | "error";

interface DocumentUploadFormProps {
  onSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentUploadForm({ onSuccess }: DocumentUploadFormProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingOnPage, setIsDraggingOnPage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [language, setLanguage] = useState("en");
  const [createdBy, setCreatedBy] = useState("dashboard-user");
  const [result, setResult] = useState<ExecutePipelineSuccess | null>(null);

  const dragCounterRef = useRef(0);
  const pageDragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const executePipeline = useCallback(
    (input: ExecutePipelineInput) => service!.execute(input),
    [service],
  );

  const { error, execute } = usePipelineAction(executePipeline);

  // ─── Page-level drag detection ────────────────────────────────────────

  useEffect(() => {
    const onEnter = (e: DragEvent) => {
      e.preventDefault();
      pageDragCounterRef.current++;
      if (pageDragCounterRef.current === 1) setIsDraggingOnPage(true);
    };
    const onLeave = () => {
      pageDragCounterRef.current--;
      if (pageDragCounterRef.current === 0) setIsDraggingOnPage(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      pageDragCounterRef.current = 0;
      setIsDraggingOnPage(false);
    };
    const onOver = (e: DragEvent) => e.preventDefault();

    document.addEventListener("dragenter", onEnter);
    document.addEventListener("dragleave", onLeave);
    document.addEventListener("drop", onDrop);
    document.addEventListener("dragover", onOver);
    return () => {
      document.removeEventListener("dragenter", onEnter);
      document.removeEventListener("dragleave", onLeave);
      document.removeEventListener("drop", onDrop);
      document.removeEventListener("dragover", onOver);
    };
  }, []);

  // ─── File Validation ──────────────────────────────────────────────────

  const validateFile = (f: File): string | null => {
    if (f.size === 0) return "File is empty";
    if (f.size > MAX_FILE_SIZE)
      return `File exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`;
    if (!detectFileType(f.name)) {
      const ext = getFileExtension(f.name);
      return `Unsupported file type${ext ? `: .${ext}` : ""}. Use PDF, Markdown, TXT, CSV, or JSON.`;
    }
    return null;
  };

  const selectFile = (f: File) => {
    setFileError(null);
    const validationError = validateFile(f);
    if (validationError) {
      setFileError(validationError);
      return;
    }
    setFile(f);
    setPhase("file-selected");
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
    setPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Drag & Drop ─────────────────────────────────────────────────────

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) selectFile(selected);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Submit ───────────────────────────────────────────────────────────

  const handleProcess = async () => {
    if (!service || !file) return;

    setPhase("processing");

    const content = await file.arrayBuffer();
    const detected = detectFileType(file.name);

    const input: ExecutePipelineInput = {
      sourceId: crypto.randomUUID(),
      sourceName: file.name,
      uri: file.name,
      sourceType: detected?.type ?? "PLAIN_TEXT",
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

    const pipelineResult = await execute(input);
    if (pipelineResult) {
      setResult(pipelineResult);
      setPhase("success");
      addToast("Document processed successfully", "success");
      onSuccess?.();
    } else {
      setPhase("error");
    }
  };

  const handleUploadAnother = () => {
    setFile(null);
    setFileError(null);
    setResult(null);
    setPhase("idle");
    setShowAdvanced(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTryAgain = () => {
    setPhase("file-selected");
  };

  // ─── Render: Processing ───────────────────────────────────────────────

  if (phase === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <Spinner size="lg" />
        <p
          className="mt-4 text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Processing document...
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
          {file?.name}
        </p>
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
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Document processed successfully
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            {file?.name}
          </p>
        </div>

        <div
          className="grid grid-cols-3 gap-4 p-4 rounded-lg mb-6"
          style={{ backgroundColor: "var(--surface-secondary)" }}
        >
          <div className="text-center">
            <p
              className="text-lg font-semibold"
              style={{ color: "var(--accent-primary)" }}
            >
              {result.chunksCount}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Chunks
            </p>
          </div>
          <div className="text-center">
            <p
              className="text-lg font-semibold"
              style={{ color: "var(--accent-primary)" }}
            >
              {result.dimensions}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Dimensions
            </p>
          </div>
          <div className="text-center">
            <p
              className="text-lg font-semibold truncate"
              style={{ color: "var(--accent-primary)" }}
            >
              {result.model}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Model
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={handleUploadAnother}
        >
          Upload Another
        </Button>
      </div>
    );
  }

  // ─── Render: Main (idle / file-selected / error) ──────────────────────

  const detected = file ? detectFileType(file.name) : null;
  const hasFile = file && detected && (phase === "file-selected" || phase === "error");
  const isDragging = isDraggingOnPage || isDragOver;

  // Drop zone content: drag feedback takes priority over static content
  const renderDropZoneContent = () => {
    // ── State 1: hovering directly over the zone ──
    if (isDragOver) {
      return (
        <div className="flex flex-col items-center gap-3" key="drop">
          <Icon name="arrow-down" className="text-5xl text-accent animate-bounce-drop" />
          <p className="text-base font-bold text-accent animate-scale-spring">
            Drop here
          </p>
        </div>
      );
    }

    // ── State 2: dragging on page, not yet over the zone ──
    if (isDraggingOnPage) {
      return (
        <div className="flex flex-col items-center gap-3" key="drag">
          <Icon name="cloud-fill" className="text-5xl text-accent animate-float" />
          <p className="text-base font-bold text-accent animate-fade-in">
            Drag here
          </p>
        </div>
      );
    }

    // ── State 3: file already selected ──
    if (hasFile) {
      return (
        <div className="flex flex-col items-center gap-3 animate-scale-spring" key="file">
          <Icon name="file-text" className="text-4xl text-accent" />
          <div className="text-center">
            <p className="text-sm font-medium truncate max-w-[280px] text-primary">
              {file.name}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="badge-info text-xs">{detected.label}</span>
              <span className="text-xs text-tertiary">
                {formatFileSize(file.size)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeFile();
            }}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Icon name="x" className="text-xs" />
            Remove
          </button>
          <p className="text-xs text-tertiary">
            Drop another file to replace
          </p>
        </div>
      );
    }

    // ── State 4: idle — default upload prompt ──
    return (
      <div className="flex flex-col items-center" key="idle">
        <Icon name="cloud" className="text-4xl text-tertiary mb-3" />
        <p className="text-sm font-medium text-primary">
          Drag & drop your file here
        </p>
        <p className="text-xs mt-1 text-tertiary">
          or{" "}
          <span className="font-medium text-accent">browse files</span>
        </p>
        <p className="text-xs mt-3 text-tertiary">
          PDF, Markdown, TXT, CSV, JSON — max 50MB
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        role="button"
        tabIndex={0}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            fileInputRef.current?.click();
        }}
        className={`relative rounded-xl border-2 h-[200px] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ease-out-expo ${
          isDragOver
            ? "border-solid border-accent bg-accent-muted animate-pulse-ring"
            : isDragging
              ? "border-dashed border-accent bg-accent-muted"
              : hasFile
                ? "border-solid border-accent bg-accent-muted"
                : "border-dashed border-subtle bg-transparent"
        }`}
        style={{
          boxShadow: isDragOver
            ? "0 0 0 4px var(--accent-primary-glow), 0 0 30px var(--accent-primary-glow)"
            : "none",
        }}
      >
        {renderDropZoneContent()}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleFileInput}
          className="hidden"
          aria-label="Upload file"
        />
      </div>

      {/* Validation Error */}
      {fileError && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--semantic-danger-muted)",
            color: "var(--semantic-danger)",
          }}
        >
          <Icon name="alert-circle" className="text-base flex-shrink-0" />
          {fileError}
        </div>
      )}

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
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Icon
              name={showAdvanced ? "chevron-up" : "chevron-down"}
              className="text-xs"
            />
            Advanced options
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
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
          )}
        </div>
      )}

      {/* Process Button */}
      {phase === "file-selected" && (
        <Button className="w-full" onClick={handleProcess} disabled={!service}>
          Process Document
        </Button>
      )}
    </div>
  );
}
