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
} from "@klay/core/lifecycle";
import type { IngestAndAddSourceInput } from "@klay/core";

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
  const { lifecycleService, service } = useRuntimeMode();
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

  const createAction = useCallback(
    (input: CreateContextInput) => lifecycleService!.createContext(input),
    [lifecycleService],
  );

  const ingestAction = useCallback(
    (input: IngestAndAddSourceInput) => lifecycleService!.ingestAndAddSource(input),
    [lifecycleService],
  );

  const { error: createError, execute: executeCreate } = useServiceAction(createAction);
  const { error: ingestError, execute: executeIngest } = useServiceAction(ingestAction);

  // Load available processing profiles
  useEffect(() => {
    if (!service) return;
    service.listProfiles().then((result) => {
      if (result.success && result.data.profiles.length > 0) {
        setProfiles(result.data.profiles);
        setProfileId(result.data.profiles[0].id);
      }
    });
  }, [service]);

  // ─── Submit ─────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lifecycleService) return;

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

    // Step 2: Ingest source (if file selected)
    if (file) {
      setSubmitPhase("Ingesting source...");

      const fileBuffer = await file.arrayBuffer();
      const detected = detectFileType(file.name);

      const ingestInput: IngestAndAddSourceInput = {
        contextId,
        sourceId: crypto.randomUUID(),
        sourceName: file.name,
        uri: file.name,
        sourceType: detected?.type ?? "PLAIN_TEXT",
        extractionJobId: crypto.randomUUID(),
        projectionId: crypto.randomUUID(),
        projectionType: "EMBEDDING",
        processingProfileId: profileId,
        content: fileBuffer,
      };

      const ingestResult = await executeIngest(ingestInput);
      if (ingestResult) {
        addToast(
          `Context "${contextName}" created with source — ${ingestResult.chunksCount} chunks`,
          "success",
        );
      } else {
        // Context created but ingestion failed — still navigate to context
        addToast(`Context "${contextName}" created (source ingestion failed)`, "warning");
      }
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
        disabled={!lifecycleService}
        className="w-full"
      >
        {file ? "Create Context & Add Source" : "Create Context"}
      </LoadingButton>
    </form>
  );
}
