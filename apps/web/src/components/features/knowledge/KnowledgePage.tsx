import { useEffect, useCallback, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext.js";
import { usePipelineAction } from "../../../hooks/usePipelineAction.js";
import { Card, CardHeader, CardBody } from "../../shared/Card.js";
import { Spinner } from "../../shared/Spinner.js";
import { ErrorDisplay } from "../../shared/ErrorDisplay.js";
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
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
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
            <h2 className="text-base font-semibold text-gray-900">
              Semantic Units
            </h2>
            {isLoading && <Spinner size="sm" />}
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
