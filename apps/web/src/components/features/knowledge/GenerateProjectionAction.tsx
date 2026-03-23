import { useState, useEffect } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Select } from "../../shared/Select";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { LoadingButton } from "../../shared/LoadingButton";

const ALL_PROFILES_VALUE = "__ALL_ACTIVE__";

interface GenerateProjectionActionProps {
  sourceId: string;
  onSuccess?: () => void;
}

export function GenerateProjectionAction({ sourceId, onSuccess }: GenerateProjectionActionProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [profileId, setProfileId] = useState("default");
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

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

  const handleGenerate = async () => {
    if (!service) return;
    setIsLoading(true);
    setError(null);

    if (profileId === ALL_PROFILES_VALUE) {
      const activeProfiles = profiles.filter((p) => (p as any).status === "ACTIVE" || true);
      let totalChunks = 0;
      let failedCount = 0;

      for (const profile of activeProfiles) {
        const result = await service.process({
          sourceId,
          processingProfileId: profile.id,
        });
        if (result.success && result.data) {
          totalChunks += result.data.chunksCount ?? 0;
        } else {
          failedCount++;
        }
      }

      setIsLoading(false);
      if (failedCount === 0) {
        addToast(
          `Generated projections across ${activeProfiles.length} profiles. Total chunks: ${totalChunks}`,
          "success",
        );
        setShowForm(false);
        onSuccess?.();
      } else {
        setError({ message: `${failedCount} of ${activeProfiles.length} profiles failed` });
      }
    } else {
      if (!profileId.trim()) {
        setIsLoading(false);
        return;
      }

      const result = await service.process({
        sourceId,
        processingProfileId: profileId,
      });

      setIsLoading(false);

      if (result.success && result.data) {
        addToast(
          `Projection generated: ${result.data.chunksCount ?? 0} chunks, ${result.data.dimensions ?? 0}d`,
          "success",
        );
        setShowForm(false);
        onSuccess?.();
      } else {
        setError({ message: (result as any).error?.message ?? "Projection generation failed" });
      }
    }
  };

  const selectOptions = [
    ...(profiles.length === 0
      ? [{ value: "default", label: "default" }]
      : profiles.map((p) => ({ value: p.id, label: p.name }))),
    { value: ALL_PROFILES_VALUE, label: "All active profiles" },
  ];

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
            options={selectOptions}
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
