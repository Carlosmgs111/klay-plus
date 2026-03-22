import { useEffect, useCallback, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { DataTable } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Input } from "../../shared/Input";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { LoadingButton } from "../../shared/LoadingButton";
import type {
  ListProfilesResult,
  DeprecateProfileInput,
} from "@klay/core";

type ProfileEntry = ListProfilesResult["profiles"][number];

interface ProfileListProps {
  onEditProfile: (profile: ProfileEntry) => void;
  refreshKey?: number;
}

export function ProfileList({ onEditProfile, refreshKey }: ProfileListProps) {
  const { service, isInitializing } = useRuntimeMode();
  const { addToast } = useToast();
  const [deprecatingId, setDeprecatingId] = useState<string | null>(null);
  const [confirmDeprecateId, setConfirmDeprecateId] = useState<string | null>(null);
  const [deprecateReason, setDeprecateReason] = useState("");

  const listAction = useCallback(
    () => service!.profiles.list(),
    [service],
  );

  const deprecateAction = useCallback(
    (input: DeprecateProfileInput) => service!.profiles.deprecate(input),
    [service],
  );

  const { data, error, isLoading, execute } = useServiceAction(listAction);
  const {
    error: deprecateError,
    execute: executeDeprecate,
  } = useServiceAction(deprecateAction);

  useEffect(() => {
    if (service && !isInitializing) {
      execute(undefined as any);
    }
  }, [service, isInitializing, refreshKey]);

  const handleDeprecate = async (profileId: string) => {
    if (!deprecateReason.trim()) return;
    setDeprecatingId(profileId);
    const result = await executeDeprecate({ id: profileId, reason: deprecateReason });
    if (result) {
      addToast(`Profile deprecated successfully`, "success");
      setConfirmDeprecateId(null);
      setDeprecateReason("");
      execute(undefined as any);
    }
    setDeprecatingId(null);
  };

  const handleCloseDeprecate = () => {
    setConfirmDeprecateId(null);
    setDeprecateReason("");
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row: ProfileEntry) => (
        <span className="font-medium text-sm text-primary">
          {row.name}
          {row.id === "default" && (
            <span className="ml-2 text-xs font-normal text-tertiary">(Default)</span>
          )}
        </span>
      ),
    },
    {
      key: "preparation",
      header: "Preparation",
      render: (row: ProfileEntry) => (
        <span className="inline-flex items-center rounded-full bg-secondary/40 px-2 py-0.5 text-xs font-mono text-secondary">
          {row.preparation?.strategyId ?? "none"}
        </span>
      ),
    },
    {
      key: "fragmentation",
      header: "Fragmentation",
      render: (row: ProfileEntry) => (
        <span className="inline-flex items-center rounded-full bg-secondary/40 px-2 py-0.5 text-xs font-mono text-secondary">
          {row.fragmentation.strategyId}
        </span>
      ),
    },
    {
      key: "projection",
      header: "Embedding",
      render: (row: ProfileEntry) => (
        <span className="inline-flex items-center rounded-full bg-secondary/40 px-2 py-0.5 text-xs font-mono text-secondary">
          {row.projection.strategyId}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: ProfileEntry) => (
        <StatusBadge status={row.status === "Active" ? "complete" : "failed"} />
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row: ProfileEntry) =>
        new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: ProfileEntry) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditProfile(row)}
            title="Edit profile"
          >
            <Icon name="edit" />
          </Button>
          {row.status === "Active" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConfirmDeprecateId(row.id);
                setDeprecateReason("");
              }}
              title="Deprecate profile"
            >
              <Icon name="x" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isInitializing) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <ErrorDisplay {...error} />}
      {deprecateError && <ErrorDisplay {...deprecateError} />}

      <DataTable
        columns={columns}
        rows={data?.profiles ?? []}
        keyExtractor={(row) => row.id}
        emptyMessage="No processing profiles created yet"
      />

      {isLoading && (
        <div className="flex justify-center py-2">
          <Spinner size="sm" />
        </div>
      )}

      {/* Deprecate Profile Overlay */}
      <OverlayPanel
        open={confirmDeprecateId !== null}
        setOpen={(v) => { if (!v) handleCloseDeprecate(); }}
        icon="alert-triangle"
        iconColor="text-warning"
        title="Deprecate Profile"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            This will mark the profile as deprecated. It can no longer be used for new processing.
          </p>
          <Input
            label="Reason for deprecation"
            placeholder="Why is this profile being deprecated?"
            value={deprecateReason}
            onChange={(e) => setDeprecateReason(e.target.value)}
          />
          {deprecateError && <ErrorDisplay {...deprecateError} />}
          <div className="flex items-center gap-2">
            <LoadingButton
              variant="danger"
              size="sm"
              loading={deprecatingId === confirmDeprecateId}
              loadingText="Deprecating..."
              disabled={!deprecateReason.trim()}
              onClick={() => confirmDeprecateId && handleDeprecate(confirmDeprecateId)}
            >
              Confirm Deprecate
            </LoadingButton>
            <Button variant="ghost" size="sm" onClick={handleCloseDeprecate}>
              Cancel
            </Button>
          </div>
        </div>
      </OverlayPanel>
    </div>
  );
}
