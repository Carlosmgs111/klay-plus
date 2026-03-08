import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { LoadingButton } from "../../shared/LoadingButton";
import type { RollbackContextInput } from "@klay/core/lifecycle";

interface RollbackActionProps {
  contextId: string;
  currentVersion: number;
  onSuccess?: () => void;
}

export function RollbackAction({ contextId, currentVersion, onSuccess }: RollbackActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [targetVersion, setTargetVersion] = useState(
    Math.max(1, currentVersion - 1),
  );

  const rollbackAction = useCallback(
    (input: RollbackContextInput) => lifecycleService!.rollbackContext(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(rollbackAction);

  const handleRollback = async () => {
    if (targetVersion < 1 || targetVersion >= currentVersion) return;
    const result = await execute({ contextId, targetVersion });
    if (result) {
      addToast(`Rolled back to version ${result.currentVersion}`, "success");
      setShowForm(false);
      onSuccess?.();
    }
  };

  if (currentVersion <= 1) {
    return null;
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowForm(true)}
      >
        <span className="flex items-center gap-1">
          <Icon name="undo" /> Rollback
        </span>
      </Button>

      <OverlayPanel open={showForm} setOpen={setShowForm} icon="undo" title="Rollback Context">
        <div className="space-y-4">
          <Input
            label={`Target Version (1 - ${currentVersion - 1})`}
            type="number"
            min={1}
            max={currentVersion - 1}
            value={targetVersion}
            onChange={(e) => setTargetVersion(Number(e.target.value))}
            required
          />
          <p className="text-xs text-tertiary">
            Current version: {currentVersion}. Rollback is non-destructive (pointer move).
          </p>
          {error && <ErrorDisplay {...error} />}
          <div className="flex items-center gap-2">
            <LoadingButton
              variant="danger"
              size="sm"
              loading={isLoading}
              loadingText="Rolling back..."
              disabled={targetVersion < 1 || targetVersion >= currentVersion}
              onClick={handleRollback}
            >
              Rollback
            </LoadingButton>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </OverlayPanel>
    </>
  );
}
