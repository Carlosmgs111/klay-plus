import { useState, useCallback, useEffect } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Icon } from "../../shared/Icon";
import { Input } from "../../shared/Input";
import { Textarea } from "../../shared/Textarea";
import { Select } from "../../shared/Select";
import { LoadingButton } from "../../shared/LoadingButton";
import { FileDropZone } from "../../shared/FileDropZone";
import { detectFileType } from "../../../utils/fileDetection";
import type {
  CreateContextInput,
  CreateContextResult,
  ProcessKnowledgeInput,
  ProcessKnowledgeSuccess,
  SourceSummaryDTO,
} from "@klay/core";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateContextFormProps {
  onSuccess?: (contextId: string) => void;
}

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateContextForm({ onSuccess }: CreateContextFormProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("en");
  const [profileId, setProfileId] = useState("default");
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string }>>([]);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState("");

  // Existing sources state
  const [sources, setSources] = useState<SourceSummaryDTO[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  const createAction = useCallback(
    (input: CreateContextInput) => service!.contexts.create(input),
    [service],
  );

  const processAction = useCallback(
    (input: ProcessKnowledgeInput) => service!.process(input),
    [service],
  );

  const { error: createError, execute: executeCreate } = useServiceAction(createAction);
  const { error: ingestError, execute: executeProcess } = useServiceAction(processAction);

  // Load available processing profiles and existing sources
  useEffect(() => {
    if (!service) return;
    service.profiles.list().then((result) => {
      if (result.success && result.data.profiles.length > 0) {
        setProfiles(result.data.profiles);
        setProfileId(result.data.profiles[0].id);
      }
    });
    service.sources.list().then((result) => {
      if (result.success) {
        setSources(result.data.sources.filter((s) => s.hasBeenExtracted));
      }
    });
  }, [service]);

  // ─── Submit ─────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    setSubmitting(true);

    // Step 1: Create context
    setSubmitPhase("Creating context...");
    const now = new Date();
    const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

    const contextId = crypto.randomUUID();
    const contextName = name.trim() || `Context-${datePart}-${randomPart}`;

    const input: CreateContextInput = {
      id: contextId,
      name: contextName,
      description: description.trim(),
      language,
      requiredProfileId: profileId,
      createdBy: "dashboard-user",
    };

    const contextResult = await executeCreate(input);
    if (!contextResult) {
      setSubmitting(false);
      setSubmitPhase("");
      return;
    }

    // Step 2: Add existing sources (if any selected)
    const selectedIds = Array.from(selectedSourceIds);
    let addedCount = 0;
    if (selectedIds.length > 0) {
      setSubmitPhase(`Adding ${selectedIds.length} existing source(s)...`);
      for (const sourceId of selectedIds) {
        try {
          const res = await service!.process({ sourceId, contextId });
          if (res.success) addedCount++;
        } catch {
          // continue with remaining sources
        }
      }
    }

    // Step 3: Ingest source (if file selected)
    if (file) {
      setSubmitPhase("Ingesting source...");

      const fileBuffer = await file.arrayBuffer();
      const detected = detectFileType(file.name);

      const processInput: ProcessKnowledgeInput = {
        sourceId: crypto.randomUUID(),
        sourceName: file.name,
        uri: file.name,
        sourceType: detected?.type ?? "PLAIN_TEXT",
        extractionJobId: crypto.randomUUID(),
        projectionId: crypto.randomUUID(),
        projectionType: "EMBEDDING",
        processingProfileId: profileId,
        contextId,
        content: fileBuffer,
      };

      const processResult = await executeProcess(processInput);
      if (processResult) {
        addToast(
          `Context "${contextName}" created with source — ${processResult.chunksCount ?? 0} chunks`,
          "success",
        );
      } else {
        addToast(`Context "${contextName}" created (source ingestion failed)`, "warning");
      }
    } else if (addedCount > 0) {
      const msg = addedCount === selectedIds.length
        ? `Context "${contextName}" created — ${addedCount} existing source(s) added`
        : `Context "${contextName}" created — ${addedCount}/${selectedIds.length} source(s) added`;
      addToast(msg, addedCount === selectedIds.length ? "success" : "warning");
    } else {
      addToast(`Context "${contextName}" created`, "success");
    }

    setSubmitting(false);
    setSubmitPhase("");
    onSuccess?.(contextResult.contextId);
  };

  const error = createError || ingestError;

  const profileOptions = profiles.length === 0
    ? [{ value: "default", label: "default" }]
    : profiles.map((p) => ({ value: p.id, label: p.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Auto-generated if empty"
        disabled={submitting}
      />

      {/* Description */}
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional"
        rows={2}
        disabled={submitting}
      />

      {/* Language + Profile row */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Language"
          options={LANGUAGE_OPTIONS}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={submitting}
        />
        <Select
          label="Processing Profile"
          options={profileOptions}
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          disabled={submitting}
        />
      </div>

      {/* Initial Source (optional DnD) */}
      <div>
        <label className="text-xs font-medium text-secondary">
          Initial Source <span className="text-tertiary">(optional)</span>
        </label>
        <div className="mt-1">
          <FileDropZone
            file={file}
            onSelect={setFile}
            onRemove={() => setFile(null)}
            disabled={submitting}
            height={180}
          />
        </div>
      </div>

      {/* Existing Sources Picker */}
      {sources.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors"
            disabled={submitting}
          >
            <Icon
              name="chevron-right"
              className={`w-3.5 h-3.5 transition-transform ${sourcesExpanded ? "rotate-90" : ""}`}
            />
            Existing Sources
            {selectedSourceIds.size > 0 && (
              <span className="text-accent">({selectedSourceIds.size} selected)</span>
            )}
          </button>

          {sourcesExpanded && (
            <div className="mt-2 max-h-48 overflow-y-auto border border-primary rounded-lg divide-y divide-primary">
              {sources.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSourceIds.has(s.id)}
                    onChange={(e) => {
                      const next = new Set(selectedSourceIds);
                      if (e.target.checked) next.add(s.id);
                      else next.delete(s.id);
                      setSelectedSourceIds(next);
                    }}
                    disabled={submitting}
                    className="rounded border-primary"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="text-sm text-primary truncate block">{s.name}</span>
                    <span className="text-xs text-tertiary truncate block">{s.id.slice(0, 12)}...</span>
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-surface-alt text-secondary shrink-0">
                    {s.type}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-danger-muted border border-danger rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Icon name="alert-circle" className="text-danger mt-0.5 flex-shrink-0" />
            <p className="text-sm text-danger">{error.message}</p>
          </div>
        </div>
      )}

      {/* Submit */}
      <LoadingButton
        type="submit"
        loading={submitting}
        loadingText={submitPhase}
        disabled={!service}
        className="w-full"
      >
        {file || selectedSourceIds.size > 0 ? "Create Context & Add Sources" : "Create Context"}
      </LoadingButton>
    </form>
  );
}
