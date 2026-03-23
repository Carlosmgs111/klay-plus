import { useState, useRef, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { LoadingButton } from "../../shared/LoadingButton";
import type { ReconcileProjectionsInput, ReconcileAllProfilesInput } from "@klay/core";

interface ReconcileProjectionsActionProps {
  contextId: string;
  profileId: string;
  onSuccess?: () => void;
}

export function ReconcileProjectionsAction({ contextId, profileId, onSuccess }: ReconcileProjectionsActionProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setDropdownOpen(false), dropdownOpen);

  const reconcileAction = useCallback(
    (input: ReconcileProjectionsInput) => service!.reconcileProjections(input),
    [service],
  );

  const reconcileAllAction = useCallback(
    (input: ReconcileAllProfilesInput) => service!.reconcileAllProfiles(input),
    [service],
  );

  const { error: reconcileError, isLoading: isReconciling, execute: executeReconcile } = useServiceAction(reconcileAction);
  const { error: reconcileAllError, isLoading: isReconcilingAll, execute: executeReconcileAll } = useServiceAction(reconcileAllAction);

  const isLoading = isReconciling || isReconcilingAll;
  const error = reconcileError || reconcileAllError;

  const handleReconcileRequired = async () => {
    setDropdownOpen(false);
    const result = await executeReconcile({ contextId, profileId });
    if (result) {
      addToast(`Projections reconciled. Processed: ${result.processedCount}, Failed: ${result.failedCount}`, "success");
      onSuccess?.();
    }
  };

  const handleReconcileAll = async () => {
    setDropdownOpen(false);
    const result = await executeReconcileAll({ contextId });
    if (result) {
      const summary = result.profileResults
        .map((r) => `${r.profileId}: ${r.processedCount} processed`)
        .join(", ");
      addToast(
        `All profiles reconciled. Total processed: ${result.totalProcessed}, failed: ${result.totalFailed}. (${summary})`,
        "success",
      );
      onSuccess?.();
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <div className="flex items-stretch">
        <LoadingButton
          variant="secondary"
          size="sm"
          loading={isReconciling}
          loadingText="Reconciling..."
          onClick={handleReconcileRequired}
          className="rounded-r-none border-r-0"
        >
          <span className="flex items-center gap-1">
            <Icon name="refresh" /> Reconcile
          </span>
        </LoadingButton>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center px-1.5 rounded-r-md border border-l-0 border-border bg-surface-2 hover:bg-surface-3 disabled:opacity-50 transition-colors"
          title="More reconcile options"
          aria-expanded={dropdownOpen}
        >
          <Icon name="chevron-down" className="w-3 h-3 text-tertiary" />
        </button>
      </div>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-md border border-border bg-surface-2 shadow-lg py-1">
          <button
            type="button"
            onClick={handleReconcileRequired}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-3 transition-colors"
          >
            Reconcile (required profile)
          </button>
          <button
            type="button"
            onClick={handleReconcileAll}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-3 transition-colors"
          >
            Reconcile all profiles
          </button>
        </div>
      )}

      {error && <ErrorDisplay {...error} />}
    </div>
  );
}
