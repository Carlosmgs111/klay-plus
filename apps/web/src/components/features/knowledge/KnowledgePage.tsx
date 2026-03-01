import { useEffect, useCallback, useState, useMemo } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonLine } from "../../shared/Skeleton";
import { SemanticUnitsList } from "./SemanticUnitsList";
import { ManifestDetail } from "./ManifestDetail";
import { SemanticUnitDetail } from "./SemanticUnitDetail";
import type { GetManifestInput, ContentManifestEntry } from "@klay/core";

export function KnowledgePage() {
  const { service, isInitializing } = useRuntimeMode();
  const [selectedManifest, setSelectedManifest] =
    useState<ContentManifestEntry | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const fetchManifests = useCallback(
    (input: GetManifestInput) => service!.getManifest(input),
    [service],
  );

  const { data, error, isLoading, execute } = usePipelineAction(fetchManifests);

  const refresh = useCallback(() => {
    if (service && !isInitializing) {
      execute({});
    }
  }, [service, isInitializing]);

  useEffect(() => {
    refresh();
  }, [service, isInitializing]);

  // Group manifests by semanticUnitId for the unit detail view
  const manifestsByUnit = useMemo(() => {
    const map = new Map<string, ContentManifestEntry[]>();
    for (const manifest of data?.manifests ?? []) {
      const group = map.get(manifest.semanticUnitId) ?? [];
      group.push(manifest);
      map.set(manifest.semanticUnitId, group);
    }
    return map;
  }, [data]);

  const handleSelectManifest = (manifest: ContentManifestEntry) => {
    setSelectedManifest(manifest);
    setSelectedUnitId(null);
  };

  const handleSelectUnit = (manifest: ContentManifestEntry) => {
    setSelectedUnitId(manifest.semanticUnitId);
    setSelectedManifest(null);
  };

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

      {selectedUnitId && (
        <SemanticUnitDetail
          unitId={selectedUnitId}
          manifests={manifestsByUnit.get(selectedUnitId) ?? []}
          onClose={() => setSelectedUnitId(null)}
          onRefresh={refresh}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="brain" style={{ color: "var(--text-tertiary)" }} />
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
            onSelectManifest={handleSelectManifest}
            onSelectUnit={handleSelectUnit}
          />
        </CardBody>
      </Card>
    </div>
  );
}
