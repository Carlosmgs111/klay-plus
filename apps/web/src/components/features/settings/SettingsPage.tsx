import { useEffect, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { Card, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ThemeCard } from "./ThemeCard";
import { RuntimeModeCard } from "./RuntimeModeCard";
import { InfrastructureSection } from "./InfrastructureSection";
import { ArchitectureFlowCard } from "./ArchitectureFlowCard";
import { HealthCheckCard } from "./HealthCheckCard";
import type { InfrastructureProfile } from "@klay/core/config";

export function SettingsPage() {
  const {
    mode,
    setMode,
    isInitializing,
    reinitialize,
    configStore,
    secretStore,
    infrastructureProfile,
    setInfrastructureProfile,
    isModeLocked,
  } = useRuntimeMode();

  const [localProfile, setLocalProfile] = useState<InfrastructureProfile | null>(null);

  useEffect(() => {
    if (infrastructureProfile) {
      setLocalProfile({ ...infrastructureProfile });
    }
  }, [infrastructureProfile]);

  return (
    <div className="space-y-6">
      <ThemeCard />
      <RuntimeModeCard mode={mode} setMode={setMode} isModeLocked={isModeLocked} />

      {localProfile ? (
        <InfrastructureSection
          localProfile={localProfile}
          setLocalProfile={setLocalProfile}
          mode={mode}
          configStore={configStore}
          secretStore={secretStore}
          reinitialize={reinitialize}
          setInfrastructureProfile={setInfrastructureProfile}
        />
      ) : (
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-tertiary">
              {isInitializing ? (
                <>
                  <Spinner size="sm" />
                  <p className="text-sm">Loading infrastructure configuration...</p>
                </>
              ) : (
                <>
                  <Icon name="alert-triangle" className="text-warning" />
                  <p className="text-sm">
                    Infrastructure profile could not be loaded.{" "}
                    <button onClick={reinitialize} className="text-accent underline">Retry</button>
                  </p>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <ArchitectureFlowCard mode={mode} />
      <HealthCheckCard />
    </div>
  );
}
