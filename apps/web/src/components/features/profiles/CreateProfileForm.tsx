import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { ProfileFormFields } from "./ProfileFormFields";
import type { ProfileFormValues } from "./ProfileFormFields";
import type { CreateProcessingProfileInput } from "@klay/core";

interface CreateProfileFormProps {
  onSuccess?: () => void;
}

export function CreateProfileForm({ onSuccess }: CreateProfileFormProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();

  const createProfile = useCallback(
    (input: CreateProcessingProfileInput) => service!.createProcessingProfile(input),
    [service],
  );

  const { error, isLoading, execute } = usePipelineAction(createProfile);

  const handleSubmit = async (values: ProfileFormValues) => {
    if (!service) return;

    const result = await execute({
      id: crypto.randomUUID(),
      name: values.name,
      preparation: values.preparation,
      fragmentation: values.fragmentation,
      projection: values.projection,
    });

    if (result) {
      addToast(`Profile created. ID: ${result.profileId}, Version: ${result.version}`, "success");
      onSuccess?.();
    }
  };

  return (
    <ProfileFormFields
      onSubmit={handleSubmit}
      submitLabel="Create Profile"
      loadingLabel="Creating..."
      error={error}
      isLoading={isLoading}
      disabled={!service}
    />
  );
}
