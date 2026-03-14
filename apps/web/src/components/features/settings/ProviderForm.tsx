import { Input } from "../../shared/Input";
import { getNestedValue } from "./infrastructure-helpers";
import type {
  InfrastructureAxis,
  ProviderFieldSpec,
  ProviderMetadata,
} from "@klay/core/config";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProviderFormProps {
  axis: InfrastructureAxis;
  provider: ProviderMetadata;
  config: Record<string, unknown>;
  embeddingModels: { id: string; name: string; dimensions: number }[];
  currentModelId?: string;
  apiKeyValues: Record<string, string>;
  configuredKeys: Set<string>;
  onFieldChange: (axis: InfrastructureAxis, fieldKey: string, value: unknown) => void;
  onModelChange: (modelId: string) => void;
  onApiKeyChange: (key: string, value: string) => void;
}

const selectClass =
  "w-full rounded-lg border border-default bg-surface-2 px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none";

// ─── Field Renderer ──────────────────────────────────────────────────────────

function renderField(
  axis: InfrastructureAxis,
  field: ProviderFieldSpec,
  config: Record<string, unknown>,
  onFieldChange: (axis: InfrastructureAxis, key: string, value: unknown) => void,
) {
  const rawValue = getNestedValue(config, field.key);

  if (field.readOnly) {
    return (
      <div key={field.key}>
        <label className="block text-xs font-medium text-tertiary mb-1">{field.label}</label>
        <div className="rounded-lg border border-default bg-surface-3 px-3 py-2 text-sm text-tertiary">
          {String(rawValue ?? field.defaultValue ?? "—")}
          {field.helpText && <span className="text-xs ml-1">({field.helpText})</span>}
        </div>
      </div>
    );
  }

  switch (field.inputType) {
    case "text":
      return (
        <Input
          key={field.key}
          label={field.label}
          placeholder={field.placeholder}
          value={String(rawValue ?? "")}
          onChange={(e) => onFieldChange(axis, field.key, e.target.value || undefined)}
        />
      );

    case "number":
      return (
        <Input
          key={field.key}
          type="number"
          label={field.label}
          placeholder={field.placeholder}
          value={String(rawValue ?? field.defaultValue ?? "")}
          onChange={(e) =>
            onFieldChange(axis, field.key, e.target.value ? Number(e.target.value) : undefined)
          }
        />
      );

    case "select":
      return (
        <div key={field.key}>
          <label className="block text-xs font-medium text-secondary mb-1">{field.label}</label>
          <select
            value={String(rawValue ?? field.defaultValue ?? "")}
            onChange={(e) => onFieldChange(axis, field.key, e.target.value)}
            className={selectClass}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {field.helpText && <p className="text-xs text-tertiary mt-1">{field.helpText}</p>}
        </div>
      );

    case "boolean":
      return (
        <label key={field.key} className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(rawValue ?? field.defaultValue ?? false)}
            onChange={(e) => onFieldChange(axis, field.key, e.target.checked || undefined)}
            className="rounded border-default"
          />
          {field.label}
          {field.helpText && <span className="text-xs text-tertiary">({field.helpText})</span>}
        </label>
      );
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProviderForm({
  axis,
  provider,
  config,
  embeddingModels,
  currentModelId,
  apiKeyValues,
  configuredKeys,
  onFieldChange,
  onModelChange,
  onApiKeyChange,
}: ProviderFormProps) {
  const fields = provider.fields ?? [];
  const requirements = provider.requirements;

  const hasContent = fields.length > 0 || requirements.length > 0 || embeddingModels.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3 pt-1">
      {/* Model selector */}
      {embeddingModels.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Model</label>
          <select
            value={currentModelId ?? embeddingModels[0]?.id}
            onChange={(e) => onModelChange(e.target.value)}
            className={selectClass}
          >
            {embeddingModels.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.dimensions}d)</option>
            ))}
          </select>
        </div>
      )}

      {/* API key inputs */}
      {requirements.map((req) => {
        const value = apiKeyValues[req.key] ?? "";
        const isConfigured = configuredKeys.has(req.key);
        return (
          <div key={req.key} className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                type="password"
                label={req.label}
                placeholder={isConfigured ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022  (configured)" : `Enter ${req.label}`}
                value={value}
                onChange={(e) => onApiKeyChange(req.key, e.target.value)}
              />
            </div>
            <div
              className={`mb-2 w-2.5 h-2.5 rounded-full flex-shrink-0 ${isConfigured ? "bg-success" : "bg-surface-3"}`}
              title={isConfigured ? "Configured" : "Not configured"}
            />
          </div>
        );
      })}

      {/* Config fields */}
      {fields.map((field) => renderField(axis, field, config, onFieldChange))}
    </div>
  );
}
