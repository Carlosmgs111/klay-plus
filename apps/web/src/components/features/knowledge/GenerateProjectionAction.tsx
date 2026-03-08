import { useState, useEffect, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
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

  if (showForm) {
    return (
      <div className="space-y-2 pt-2 mt-2 border-t border-subtle">
        <div className="flex items-center gap-2">
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            className="flex-1 text-xs px-2 py-1.5 rounded-md border border-default bg-surface-0 text-primary"
          >
            {profiles.length === 0 && (
              <option value="default">default</option>
            )}
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            size="sm"
            disabled={isLoading}
            onClick={handleGenerate}
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Spinner size="sm" /> Generating...
              </span>
            ) : (
              "Generate"
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
        {error && <ErrorDisplay {...error} />}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowForm(true)}
      className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-surface-3"
      title="Generate projection"
    >
      <Icon name="layers" className="text-tertiary" />
    </button>
  );
}
