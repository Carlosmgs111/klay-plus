import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { useToggleAction } from "../../../hooks/useToggleAction";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Input } from "../../shared/Input";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { LoadingButton } from "../../shared/LoadingButton";
import type { DeprecateContextInput } from "@klay/core/lifecycle";

interface DeprecateContextActionProps {
  contextId: string;
  onSuccess?: () => void;
  open?: boolean;
  setOpen?: (v: boolean) => void;
}

export function DeprecateContextAction({ contextId, onSuccess, open, setOpen }: DeprecateContextActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const { open: isOpen, setOpen: setIsOpen } = useToggleAction(open, setOpen);
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
      setIsOpen(false);
      setReason("");
      onSuccess?.();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setReason("");
  };

  return (
    <>
      {!setOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Deprecate context"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors text-warning hover:bg-warning/10"
        >
          <Icon name="alert-triangle" className="text-sm" />
          Deprecate
        </button>
      )}

      <OverlayPanel open={isOpen} setOpen={handleClose} icon="alert-triangle" iconColor="text-warning" title="Deprecate Context">
        <div className="space-y-4">
          <Input
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this context being deprecated?"
          />
          {error && <ErrorDisplay {...error} />}
          <div className="flex items-center gap-2">
            <LoadingButton
              size="sm"
              loading={isLoading}
              loadingText="Deprecating..."
              onClick={handleDeprecate}
            >
              Confirm
            </LoadingButton>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </OverlayPanel>
    </>
  );
}
