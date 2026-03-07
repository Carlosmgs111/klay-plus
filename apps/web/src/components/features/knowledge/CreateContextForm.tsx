import { useState, useCallback, useEffect } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import type {
  CreateContextInput,
  CreateContextResult,
} from "@klay/core/lifecycle";

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

  const createAction = useCallback(
    (input: CreateContextInput) => lifecycleService!.createContext(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(createAction);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lifecycleService) return;

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

    const result = await execute(input);
    if (result) {
      addToast(`Context "${contextName}" created`, "success");
      onSuccess?.(result.contextId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="ctx-name" className="text-xs font-medium text-secondary">
          Name
        </label>
        <input
          id="ctx-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Auto-generated if empty"
          className="input mt-1"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="ctx-description" className="text-xs font-medium text-secondary">
          Description
        </label>
        <textarea
          id="ctx-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          rows={3}
          className="input mt-1 resize-none"
        />
      </div>

      {/* Language */}
      <div>
        <label htmlFor="ctx-language" className="text-xs font-medium text-secondary">
          Language
        </label>
        <select
          id="ctx-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input mt-1"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Processing Profile */}
      <div>
        <label htmlFor="ctx-profile" className="text-xs font-medium text-secondary">
          Processing Profile
        </label>
        <select
          id="ctx-profile"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="input mt-1"
        >
          {profiles.length === 0 ? (
            <option value="default">default</option>
          ) : (
            profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))
          )}
        </select>
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
      <button
        type="submit"
        disabled={isLoading || !lifecycleService}
        className="btn-primary w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            Creating...
          </span>
        ) : (
          "Create Context"
        )}
      </button>
    </form>
  );
}
