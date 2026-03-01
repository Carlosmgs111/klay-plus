import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Input } from "../../shared/Input";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import type { ReprocessUnitInput } from "@klay/core/lifecycle";

interface ReprocessActionProps {
  unitId: string;
  onSuccess?: () => void;
}

export function ReprocessAction({ unitId, onSuccess }: ReprocessActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [profileId, setProfileId] = useState("default");

  const reprocessAction = useCallback(
    (input: ReprocessUnitInput) => lifecycleService!.reprocessUnit(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(reprocessAction);

  const handleReprocess = async () => {
    if (!profileId.trim()) return;
    const result = await execute({ unitId, profileId });
    if (result) {
      addToast(`Unit reprocessed. New version: ${result.version}`, "success");
      setShowForm(false);
      onSuccess?.();
    }
  };

  if (showForm) {
    return (
      <div className="space-y-3">
        <Input
          label="Processing Profile ID"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          placeholder="default"
          required
        />
        {error && <ErrorDisplay {...error} />}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={isLoading || !profileId.trim()}
            onClick={handleReprocess}
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Spinner size="sm" /> Reprocessing...
              </span>
            ) : (
              "Reprocess"
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setShowForm(true)}
    >
      <span className="flex items-center gap-1">
        <Icon name="refresh" /> Reprocess
      </span>
    </Button>
  );
}
