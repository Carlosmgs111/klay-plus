import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { LoadingButton } from "../../shared/LoadingButton";
import type { ReprocessContextInput } from "@klay/core/lifecycle";

interface ReprocessActionProps {
  contextId: string;
  onSuccess?: () => void;
}

export function ReprocessAction({ contextId, onSuccess }: ReprocessActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [profileId, setProfileId] = useState("default");

  const reprocessAction = useCallback(
    (input: ReprocessContextInput) => lifecycleService!.reprocessContext(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(reprocessAction);

  const handleReprocess = async () => {
    if (!profileId.trim()) return;
    const result = await execute({ contextId, profileId });
    if (result) {
      addToast(`Context reprocessed. New version: ${result.version}`, "success");
      setShowForm(false);
      onSuccess?.();
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowForm(true)}
      >
        <span className="flex items-center gap-1">
          <Icon name="refresh" /> Reprocess
        </span>
      </Button>

      <OverlayPanel open={showForm} setOpen={setShowForm} icon="refresh" title="Reprocess Context">
        <div className="space-y-4">
          <Input
            label="Processing Profile ID"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            placeholder="default"
            required
          />
          {error && <ErrorDisplay {...error} />}
          <div className="flex items-center gap-2">
            <LoadingButton
              size="sm"
              loading={isLoading}
              loadingText="Reprocessing..."
              disabled={!profileId.trim()}
              onClick={handleReprocess}
            >
              Reprocess
            </LoadingButton>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </OverlayPanel>
    </>
  );
}
