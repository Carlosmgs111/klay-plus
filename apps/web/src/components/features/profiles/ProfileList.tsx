import { useEffect, useCallback, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { DataTable } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
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
    () => service!.listProfiles(),
    [service],
  );

  const deprecateAction = useCallback(
    (input: DeprecateProfileInput) => service!.deprecateProfile(input),
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

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row: ProfileEntry) => (
        <span className="font-medium text-sm text-primary">
          {row.name}
        </span>
      ),
    },
    {
      key: "chunkingStrategyId",
      header: "Chunking",
      render: (row: ProfileEntry) => (
        <span className="text-xs font-mono text-secondary">
          {row.chunkingStrategyId}
        </span>
      ),
    },
    {
      key: "embeddingStrategyId",
      header: "Embedding",
      render: (row: ProfileEntry) => (
        <span className="text-xs font-mono text-secondary">
          {row.embeddingStrategyId}
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

      {confirmDeprecateId && (
        <div className="rounded-lg p-4 bg-surface-1 border border-default">
          <p className="text-sm font-medium mb-2 text-primary">
            Deprecate Profile
          </p>
          <p className="text-xs mb-3 text-tertiary">
            This will mark the profile as deprecated. It can no longer be used for new processing.
          </p>
          <input
            className="input mb-3"
            placeholder="Reason for deprecation..."
            value={deprecateReason}
            onChange={(e) => setDeprecateReason(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={!deprecateReason.trim() || deprecatingId === confirmDeprecateId}
              onClick={() => handleDeprecate(confirmDeprecateId)}
            >
              {deprecatingId === confirmDeprecateId ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Deprecating...
                </span>
              ) : (
                "Confirm Deprecate"
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConfirmDeprecateId(null);
                setDeprecateReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

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
    </div>
  );
}
