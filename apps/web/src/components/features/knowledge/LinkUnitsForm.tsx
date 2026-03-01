import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import type { LinkUnitsInput } from "@klay/core/lifecycle";

const RELATIONSHIP_TYPES = [
  "related",
  "parent",
  "child",
  "references",
  "referenced-by",
  "supersedes",
  "superseded-by",
];

interface LinkUnitsFormProps {
  sourceUnitId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LinkUnitsForm({ sourceUnitId, onSuccess, onCancel }: LinkUnitsFormProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [targetUnitId, setTargetUnitId] = useState("");
  const [relationshipType, setRelationshipType] = useState("related");

  const linkAction = useCallback(
    (input: LinkUnitsInput) => lifecycleService!.linkUnits(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(linkAction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUnitId.trim()) return;

    const result = await execute({
      sourceUnitId,
      targetUnitId,
      relationshipType,
    });

    if (result) {
      addToast("Units linked successfully", "success");
      setTargetUnitId("");
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
        Linking from: {sourceUnitId.slice(0, 12)}...
      </p>

      <Input
        label="Target Unit ID"
        value={targetUnitId}
        onChange={(e) => setTargetUnitId(e.target.value)}
        placeholder="Enter target semantic unit ID"
        required
      />

      <div>
        <label className="label">Relationship Type</label>
        <select
          className="input"
          value={relationshipType}
          onChange={(e) => setRelationshipType(e.target.value)}
        >
          {RELATIONSHIP_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorDisplay {...error} />}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isLoading || !targetUnitId.trim()}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Linking...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Icon name="link" /> Link Units
            </span>
          )}
        </Button>
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
