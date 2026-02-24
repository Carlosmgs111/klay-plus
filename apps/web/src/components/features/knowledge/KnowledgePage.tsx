import { useEffect, useCallback, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext.js";
import { usePipelineAction } from "../../../hooks/usePipelineAction.js";
import { Card, CardHeader, CardBody } from "../../shared/Card.js";
import { Icon } from "../../shared/Icon.js";
import { ErrorDisplay } from "../../shared/ErrorDisplay.js";
import { SkeletonLine } from "../../shared/Skeleton.js";
import { SemanticUnitsList } from "./SemanticUnitsList.js";
import { ManifestDetail } from "./ManifestDetail.js";
import type { GetManifestInput, ContentManifestEntry } from "@klay/core";

export function KnowledgePage() {
  const { service, isInitializing } = useRuntimeMode();
  const [selectedManifest, setSelectedManifest] =
    useState<ContentManifestEntry | null>(null);

  const fetchManifests = useCallback(
    (input: GetManifestInput) => service!.getManifest(input),
    [service],
  );

  const { data, error, isLoading, execute } = usePipelineAction(fetchManifests);

  useEffect(() => {
    if (service && !isInitializing) {
      execute({});
    }
  }, [service, isInitializing]);

  if (isInitializing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card p-6 space-y-4">
          <SkeletonLine className="w-1/4 h-5" />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <ErrorDisplay {...error} />}

      {selectedManifest && (
        <ManifestDetail
          manifest={selectedManifest}
          onClose={() => setSelectedManifest(null)}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="brain" size={16} style={{ color: "var(--text-tertiary)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Semantic Units
              </h2>
            </div>
            {isLoading && <div className="skeleton w-4 h-4 rounded-full" />}
          </div>
        </CardHeader>
        <CardBody>
          <SemanticUnitsList
            manifests={data?.manifests ?? []}
            onSelectManifest={setSelectedManifest}
          />
        </CardBody>
      </Card>
    </div>
  );
}
