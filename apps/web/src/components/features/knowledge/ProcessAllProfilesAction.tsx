import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Icon } from "../../shared/Icon";
import type { ProcessSourceAllProfilesInput } from "@klay/core";

interface ProcessAllProfilesActionProps {
  sourceId: string;
  onSuccess?: () => void;
}

export function ProcessAllProfilesAction({ sourceId, onSuccess }: ProcessAllProfilesActionProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();

  const action = useCallback(
    (input: ProcessSourceAllProfilesInput) => service!.sources.processAllProfiles(input),
    [service],
  );

  const { isLoading, execute } = useServiceAction(action);

  const handleProcess = async () => {
    const result = await execute({ sourceId });
    if (result) {
      addToast(
        `Processed across ${result.profileResults.length} profiles — ${result.totalProcessed} ok, ${result.totalFailed} failed`,
        result.totalFailed === 0 ? "success" : "error",
      );
      onSuccess?.();
    }
  };

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={handleProcess}
      className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-surface-3 disabled:opacity-50"
      title="Process for all active profiles"
    >
      <Icon
        name={isLoading ? "loader" : "zap"}
        className={`text-tertiary${isLoading ? " animate-spin" : ""}`}
      />
    </button>
  );
}
