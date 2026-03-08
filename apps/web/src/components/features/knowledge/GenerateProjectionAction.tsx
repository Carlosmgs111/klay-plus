import { useState, useEffect, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Select } from "../../shared/Select";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { LoadingButton } from "../../shared/LoadingButton";
import type { GenerateProjectionInput } from "@klay/core/lifecycle";

interface GenerateProjectionActionProps {
  sourceId: string;
  onSuccess?: () => void;
}

export function GenerateProjectionAction({ sourceId, onSuccess }: GenerateProjectionActionProps) {
  const { lifecycleService, service } = useRuntimeMode();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [profileId, setProfileId] = useState("default");
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!showForm || !service) return;
    service.listProfiles().then((result) => {
      if (result.success && result.data) {
        const loaded = result.data.profiles ?? [];
        setProfiles(loaded);
        if (loaded.length > 0) setProfileId(loaded[0].id);
      }
    });
  }, [showForm, service]);

  const generateAction = useCallback(
    (input: GenerateProjectionInput) => lifecycleService!.generateProjection(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(generateAction);

  const handleGenerate = async () => {
    if (!profileId.trim()) return;
    const result = await execute({ sourceId, processingProfileId: profileId });
    if (result) {
      addToast(
        `Projection generated: ${result.chunksCount} chunks, ${result.dimensions}d`,
        "success",
      );
      setShowForm(false);
      onSuccess?.();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-surface-3"
        title="Generate projection"
      >
        <Icon name="layers" className="text-tertiary" />
      </button>

      <OverlayPanel open={showForm} setOpen={setShowForm} icon="layers" title="Generate Projection">
        <div className="space-y-4">
          <Select
            label="Processing Profile"
            options={profiles.length === 0
              ? [{ value: "default", label: "default" }]
              : profiles.map((p) => ({ value: p.id, label: p.name }))}
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          />
          {error && <ErrorDisplay {...error} />}
          <div className="flex items-center gap-2">
            <LoadingButton
              variant="primary"
              size="sm"
              loading={isLoading}
              loadingText="Generating..."
              onClick={handleGenerate}
            >
              Generate
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
