import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { LoadingButton } from "../../shared/LoadingButton";
import type { RemoveSourceInput } from "@klay/core/lifecycle";

interface RemoveSourceActionProps {
  contextId: string;
  sourceId: string;
  onSuccess?: () => void;
}

export function RemoveSourceAction({ contextId, sourceId, onSuccess }: RemoveSourceActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const removeAction = useCallback(
    (input: RemoveSourceInput) => lifecycleService!.removeSource(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(removeAction);

  const handleRemove = async () => {
    const result = await execute({ contextId, sourceId });
    if (result) {
      addToast(`Source removed. New version: ${result.version}`, "success");
      setShowConfirm(false);
      onSuccess?.();
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(true)}
        title="Remove source"
      >
        <Icon name="trash" />
      </Button>

      <OverlayPanel open={showConfirm} setOpen={setShowConfirm} icon="trash" iconColor="text-danger" title="Remove Source">
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            This will remove the source from the context and create a new version. This action cannot be easily undone.
          </p>
          {error && <ErrorDisplay {...error} />}
          <div className="flex items-center gap-2">
            <LoadingButton
              variant="danger"
              size="sm"
              loading={isLoading}
              loadingText="Removing..."
              onClick={handleRemove}
            >
              Confirm Remove
            </LoadingButton>
            <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </OverlayPanel>
    </>
  );
}
