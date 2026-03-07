import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import type { DeprecateContextInput } from "@klay/core/lifecycle";

interface DeprecateContextActionProps {
  contextId: string;
  onSuccess?: () => void;
}

export function DeprecateContextAction({ contextId, onSuccess }: DeprecateContextActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");

  const deprecateAction = useCallback(
    (input: DeprecateContextInput) => lifecycleService!.deprecateContext(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(deprecateAction);

  const handleDeprecate = async () => {
    const result = await execute({
      contextId,
      reason: reason.trim() || "No reason provided",
    });
    if (result) {
      addToast(`Context deprecated`, "success");
      setShowConfirm(false);
      setReason("");
      onSuccess?.();
    }
  };

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-2">
        {error && <ErrorDisplay {...error} />}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="input text-xs py-1 px-2"
          />
          <button
            type="button"
            disabled={isLoading}
            onClick={handleDeprecate}
            className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors bg-warning text-white hover:opacity-90 whitespace-nowrap"
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Spinner size="sm" /> Deprecating...
              </span>
            ) : (
              "Confirm"
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowConfirm(false);
              setReason("");
            }}
            className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      title="Deprecate context"
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors text-warning hover:bg-warning/10"
    >
      <Icon name="alert-triangle" className="text-sm" />
      Deprecate
    </button>
  );
}
