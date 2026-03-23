import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import type { TransitionContextStateInput } from "@klay/core";

interface ActivateContextActionProps {
  contextId: string;
  onSuccess?: () => void;
}

export function ActivateContextAction({ contextId, onSuccess }: ActivateContextActionProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();

  const activateAction = useCallback(
    (input: TransitionContextStateInput) => service!.transitionContextState(input),
    [service],
  );

  const { isLoading, execute } = useServiceAction(activateAction);

  const handleActivate = async () => {
    const result = await execute({ contextId, targetState: "ACTIVE" });
    if (result) {
      addToast(`Context activated`, "success");
      onSuccess?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleActivate}
      disabled={isLoading}
      title="Activate context"
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors text-success hover:bg-success/10"
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <Icon name="check-circle" className="text-sm" />
      )}
      Activate
    </button>
  );
}
