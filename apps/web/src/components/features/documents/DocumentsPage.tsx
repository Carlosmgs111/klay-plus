import { useEffect, useCallback, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonLine } from "../../shared/Skeleton";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { DocumentUploadForm } from "./DocumentUploadForm";
import { DocumentList } from "./DocumentList";
import type { GetManifestInput } from "@klay/core";

export function DocumentsPage() {
  const { service, isInitializing } = useRuntimeMode();
  const [showOverlay, setShowOverlay] = useState(false);

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
          <SkeletonLine className="w-full" />
        </div>
        <div className="card p-6 space-y-4">
          <SkeletonLine className="w-1/3 h-5" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLine key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="upload" className="text-tertiary" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                Ingest Document
              </h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowOverlay(true)}
            >
              <Icon name="plus" className="text-sm" />
              New Document
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Upload Overlay */}
      <OverlayPanel open={showOverlay} setOpen={setShowOverlay} icon="upload" title="Ingest Document">
        <DocumentUploadForm
          onSuccess={() => {
            execute({});
          }}
        />
      </OverlayPanel>

      {error && <ErrorDisplay {...error} />}

      {/* Document List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="file-text" className="text-tertiary" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                Processed Documents
              </h2>
            </div>
            {isLoading && <div className="skeleton w-4 h-4 rounded-full" />}
          </div>
        </CardHeader>
        <CardBody>
          <DocumentList manifests={data?.manifests ?? []} isLoading={isLoading && !data} />
        </CardBody>
      </Card>
    </div>
  );
}
