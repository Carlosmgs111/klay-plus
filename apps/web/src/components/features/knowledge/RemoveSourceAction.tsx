import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import type { RemoveSourceInput } from "@klay/core/lifecycle";

interface RemoveSourceActionProps {
  unitId: string;
  sourceId: string;
  onSuccess?: () => void;
}

export function RemoveSourceAction({ unitId, sourceId, onSuccess }: RemoveSourceActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const removeAction = useCallback(
    (input: RemoveSourceInput) => lifecycleService!.removeSource(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(removeAction);

  const handleRemove = async () => {
    const result = await execute({ unitId, sourceId });
    if (result) {
      addToast(`Source removed. New version: ${result.version}`, "success");
      setShowConfirm(false);
      onSuccess?.();
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        {error && <ErrorDisplay {...error} />}
        <Button
          variant="danger"
          size="sm"
          disabled={isLoading}
          onClick={handleRemove}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Spinner size="sm" /> Removing...
            </span>
          ) : (
            "Confirm Remove"
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowConfirm(true)}
      title="Remove source"
    >
      <Icon name="trash" />
    </Button>
  );
}
