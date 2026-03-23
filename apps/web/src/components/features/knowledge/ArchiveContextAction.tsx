import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { useToggleAction } from "../../../hooks/useToggleAction";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { LoadingButton } from "../../shared/LoadingButton";
import type { TransitionContextStateInput } from "@klay/core";

interface ArchiveContextActionProps {
  contextId: string;
  onSuccess?: () => void;
  open?: boolean;
  setOpen?: (v: boolean) => void;
}

export function ArchiveContextAction({ contextId, onSuccess, open, setOpen }: ArchiveContextActionProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();
  const { open: isOpen, setOpen: setIsOpen } = useToggleAction(open, setOpen);

  const archiveAction = useCallback(
    (input: TransitionContextStateInput) => service!.transitionContextState(input),
    [service],
  );

  const { error, isLoading, execute } = useServiceAction(archiveAction);

  const handleArchive = async () => {
    const result = await execute({ contextId, targetState: "ARCHIVED" });
    if (result) {
      addToast(`Context archived`, "success");
      setIsOpen(false);
      onSuccess?.();
    }
  };

  return (
    <>
      {!setOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Archive context"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Icon name="archive" className="text-sm" />
          Archive
        </button>
      )}

      <OverlayPanel open={isOpen} setOpen={setIsOpen} icon="archive" iconColor="text-danger" title="Archive Context">
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Archive this context? Archived contexts are hidden from active views and cannot be modified.
          </p>
          {error && <ErrorDisplay {...error} />}
          <div className="flex items-center gap-2">
            <LoadingButton
              variant="danger"
              size="sm"
              loading={isLoading}
              loadingText="Archiving..."
              onClick={handleArchive}
            >
              Archive
            </LoadingButton>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </OverlayPanel>
    </>
  );
}
