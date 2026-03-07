import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import type { ArchiveContextInput } from "@klay/core/lifecycle";

interface ArchiveContextActionProps {
  contextId: string;
  onSuccess?: () => void;
}

export function ArchiveContextAction({ contextId, onSuccess }: ArchiveContextActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const archiveAction = useCallback(
    (input: ArchiveContextInput) => lifecycleService!.archiveContext(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(archiveAction);

  const handleArchive = async () => {
    const result = await execute({ contextId });
    if (result) {
      addToast(`Context archived`, "success");
      setShowConfirm(false);
      onSuccess?.();
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        {error && <ErrorDisplay {...error} />}
        <span className="text-xs text-secondary">Archive this context?</span>
        <button
          type="button"
          disabled={isLoading}
          onClick={handleArchive}
          className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors bg-danger text-white hover:opacity-90"
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Spinner size="sm" /> Archiving...
            </span>
          ) : (
            "Confirm"
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      title="Archive context"
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
    >
      <Icon name="archive" className="text-sm" />
      Archive
    </button>
  );
}
