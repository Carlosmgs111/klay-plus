import { useState, useEffect, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import type { ListProfilesResult } from "@klay/core";

type ProfileEntry = ListProfilesResult["profiles"][number];

interface ContextProfileCardProps {
  contextId: string;
  onProfileChanged?: () => void;
}

export function ContextProfileCard({ contextId, onProfileChanged }: ContextProfileCardProps) {
  const { service, isInitializing } = useRuntimeMode();
  const { addToast } = useToast();

  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    try {
      const [contextsRes, profilesRes] = await Promise.all([
        service.listContextRefs(),
        service.listProfiles(),
      ]);

      if (contextsRes.success) {
        const ctx = contextsRes.data.contexts.find((c) => c.id === contextId);
        if (ctx) setCurrentProfileId(ctx.requiredProfileId);
      }

      if (profilesRes.success) {
        setProfiles(profilesRes.data.profiles.filter((p) => p.status === "ACTIVE"));
      }
    } finally {
      setLoading(false);
    }
  }, [service, contextId]);

  useEffect(() => {
    if (!isInitializing && service) {
      loadData();
    }
  }, [isInitializing, service, loadData]);

  const handleChangeProfile = async (newProfileId: string) => {
    if (!service || newProfileId === currentProfileId) return;
    setSaving(true);
    try {
      const result = await service.updateContextProfile({
        contextId,
        profileId: newProfileId,
      });
      if (result.success) {
        setCurrentProfileId(newProfileId);
        const reconciled = (result.data as any)?.reconciled as { processedCount: number; failedCount: number } | undefined;
        const msg = reconciled != null
          ? `Profile updated. Reconciled ${reconciled.processedCount} sources.`
          : "Processing profile updated";
        addToast(msg, "success");
        onProfileChanged?.();
      } else {
        addToast(result.error?.message ?? "Failed to update profile", "error");
      }
    } catch {
      addToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const currentProfile = profiles.find((p) => p.id === currentProfileId);

  if (isInitializing || loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="settings" className="text-tertiary" />
            <h3 className="text-sm font-semibold text-primary tracking-heading">
              Processing Profile
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Icon name="settings" className="text-tertiary" />
            <h3 className="text-sm font-semibold text-primary tracking-heading">
              Processing Profile
            </h3>
          </div>
          {saving && <Spinner size="sm" />}
        </div>
      </CardHeader>
      <CardBody>
        {/* Profile selector */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Active Profile
          </label>
          <select
            value={currentProfileId ?? ""}
            onChange={(e) => handleChangeProfile(e.target.value)}
            disabled={saving || profiles.length === 0}
            className="w-full px-3 py-2 rounded-lg text-sm bg-surface-3 border border-default text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150 disabled:opacity-50"
          >
            {!currentProfile && currentProfileId && (
              <option value={currentProfileId}>
                {currentProfileId} (not found)
              </option>
            )}
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.id === "default" ? " (Default)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Strategy badges */}
        {currentProfile ? (
          <div className="space-y-2.5">
            <StrategyRow
              label="Preparation"
              icon="file-text"
              strategyId={currentProfile.preparation?.strategyId ?? "none"}
            />
            <StrategyRow
              label="Fragmentation"
              icon="scissors"
              strategyId={currentProfile.fragmentation.strategyId}
            />
            <StrategyRow
              label="Embedding"
              icon="layers"
              strategyId={currentProfile.projection.strategyId}
            />
          </div>
        ) : (
          <p className="text-xs text-tertiary">
            {currentProfileId
              ? `Profile "${currentProfileId}" not found in active profiles.`
              : "No profile assigned."}
          </p>
        )}

        <p className="mt-3 text-xs text-ghost">
          Changing the profile will automatically re-project all existing sources with the new strategy.
        </p>
      </CardBody>
    </Card>
  );
}

function StrategyRow({
  label,
  icon,
  strategyId,
}: {
  label: string;
  icon: string;
  strategyId: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon name={icon as any} className="text-sm text-tertiary" />
        <span className="text-xs text-secondary">{label}</span>
      </div>
      <span className="inline-flex items-center rounded-full bg-secondary/40 px-2 py-0.5 text-xs font-mono text-secondary">
        {strategyId}
      </span>
    </div>
  );
}
