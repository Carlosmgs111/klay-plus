import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { ProfileFormFields } from "./ProfileFormFields";
import type { ProfileFormValues } from "./ProfileFormFields";
import type { UpdateProfileInput, ListProfilesResult } from "@klay/core";

type ProfileEntry = ListProfilesResult["profiles"][number];

interface ProfileEditFormProps {
  profile: ProfileEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileEditForm({ profile, onSuccess, onCancel }: ProfileEditFormProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();

  const updateAction = useCallback(
    (input: UpdateProfileInput) => service!.profiles.update(input),
    [service],
  );

  const { error, isLoading, execute } = useServiceAction(updateAction);

  const handleSubmit = async (values: ProfileFormValues) => {
    if (!service) return;

    const input: UpdateProfileInput = {
      id: profile.id,
      ...(values.name !== profile.name && { name: values.name }),
      preparation: values.preparation,
      fragmentation: values.fragmentation,
      projection: values.projection,
    };

    const result = await execute(input);
    if (result) {
      addToast(`Profile updated. Version: ${result.version}`, "success");
      onSuccess?.();
    }
  };

  const prepConfig = profile.preparation?.config ?? {};
  const fragConfig = profile.fragmentation.config ?? {};
  const projConfig = profile.projection.config ?? {};

  return (
    <ProfileFormFields
      initialValues={{
        name: profile.name,
        preparationStrategy: profile.preparation?.strategyId ?? "none",
        preparationConfig: prepConfig as Record<string, any>,
        fragmentationStrategy: profile.fragmentation.strategyId,
        fragmentationConfig: fragConfig as Record<string, any>,
        projectionStrategy: profile.projection.strategyId,
        projectionConfig: projConfig as Record<string, any>,
      }}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      loadingLabel="Saving..."
      error={error}
      isLoading={isLoading}
      disabled={!service}
      footer={
        onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )
      }
    >
      <p className="text-xs font-mono text-tertiary">
        ID: {profile.id} | Version: {profile.version}
      </p>
    </ProfileFormFields>
  );
}
