import { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon";
import {
  ACCEPT_STRING,
  detectFileType,
  formatFileSize,
  validateFile,
} from "../../utils/fileDetection";

interface FileDropZoneProps {
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string | null;
  disabled?: boolean;
  height?: number;
}

export function FileDropZone({
  file,
  onSelect,
  onRemove,
  error,
  disabled,
  height = 200,
}: FileDropZoneProps) {
  const [isDraggingOnPage, setIsDraggingOnPage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const dragCounterRef = useRef(0);
  const pageDragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Page-level drag detection ────────────────────────────────────────

  useEffect(() => {
    if (disabled) return;
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
  }, [disabled]);

  // ─── File selection ───────────────────────────────────────────────────

  const selectFile = (f: File) => {
    setValidationError(null);
    const err = validateFile(f);
    if (err) {
      setValidationError(err);
      return;
    }
    onSelect(f);
  };

  const handleRemove = () => {
    setValidationError(null);
    onRemove();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Zone drag handlers ───────────────────────────────────────────────

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  };

  // ─── Render ───────────────────────────────────────────────────────────

  const detected = file ? detectFileType(file.name) : null;
  const isDragging = isDraggingOnPage || isDragOver;
  const displayError = error ?? validationError;

  const renderContent = () => {
    if (isDragOver) {
      return (
        <div className="flex flex-col items-center gap-3" key="drop">
          <Icon name="arrow-down" className="text-5xl text-accent animate-bounce-drop" />
          <p className="text-base font-bold text-accent animate-scale-spring">Drop here</p>
        </div>
      );
    }

    if (isDraggingOnPage) {
      return (
        <div className="flex flex-col items-center gap-3" key="drag">
          <Icon name="cloud-fill" className="text-5xl text-accent animate-float" />
          <p className="text-base font-bold text-accent animate-fade-in">Drag here</p>
        </div>
      );
    }

    if (file && detected) {
      return (
        <div className="flex flex-col items-center gap-2 animate-scale-spring" key="file">
          <Icon name="file-text" className="text-3xl text-accent" />
          <p className="text-xs font-medium truncate max-w-[280px] text-primary">{file.name}</p>
          <div className="flex items-center gap-2">
            <span className="badge-info text-xs">{detected.label}</span>
            <span className="text-xs text-tertiary">{formatFileSize(file.size)}</span>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Icon name="x" className="text-xs" /> Remove
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center" key="idle">
        <Icon name="cloud" className="text-3xl text-tertiary mb-2" />
        <p className="text-xs font-medium text-primary">
          Drag & drop a file or <span className="text-accent">browse</span>
        </p>
        <p className="text-xs mt-1 text-tertiary">PDF, Markdown, TXT, CSV, JSON</p>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        style={{ height }}
        className={`relative rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ease-out-expo ${
          disabled
            ? "pointer-events-none opacity-60 border-dashed border-subtle"
            : isDragOver
              ? "border-solid border-accent bg-accent-muted shadow-[0_0_0_4px_var(--accent-primary-glow)]"
              : file
                ? "border-solid border-accent bg-accent-muted"
                : isDragging
                  ? "border-dashed border-accent bg-accent-muted"
                  : "border-dashed border-subtle bg-transparent hover:border-accent/50"
        }`}
      >
        {renderContent()}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) selectFile(f);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="hidden"
          aria-label="Upload file"
        />
      </div>

      {displayError && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-danger-muted text-danger">
          <Icon name="alert-circle" className="text-base flex-shrink-0" />
          {displayError}
        </div>
      )}
    </div>
  );
}
