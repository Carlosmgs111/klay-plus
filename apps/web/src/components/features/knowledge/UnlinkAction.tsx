import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import type { UnlinkUnitsInput } from "@klay/core/lifecycle";

interface UnlinkActionProps {
  sourceUnitId: string;
  targetUnitId: string;
  onSuccess?: () => void;
}

export function UnlinkAction({ sourceUnitId, targetUnitId, onSuccess }: UnlinkActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const unlinkAction = useCallback(
    (input: UnlinkUnitsInput) => lifecycleService!.unlinkUnits(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(unlinkAction);

  const handleUnlink = async () => {
    const result = await execute({ sourceUnitId, targetUnitId });
    if (result) {
      addToast("Units unlinked successfully", "success");
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
          onClick={handleUnlink}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Spinner size="sm" /> Unlinking...
            </span>
          ) : (
            "Confirm Unlink"
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
      title="Unlink units"
    >
      <Icon name="unlink" />
    </Button>
  );
}
