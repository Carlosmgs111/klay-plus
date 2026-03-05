import { useEffect, useCallback, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonLine } from "../../shared/Skeleton";
import { Overlay } from "../../shared/Overlay";
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
      <Overlay open={showOverlay} setOpen={setShowOverlay}>
        <div
          className="h-full w-[420px] max-w-[90vw] flex flex-col bg-surface-0 border-l"
        >
          {/* Overlay Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-subtle"
          >
            <div className="flex items-center gap-2">
              <Icon name="upload" className="text-accent" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                Ingest Document
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowOverlay(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Icon name="x" className="text-tertiary" />
            </button>
          </div>

          {/* Overlay Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <DocumentUploadForm
              onSuccess={() => {
                execute({});
              }}
            />
          </div>
        </div>
      </Overlay>

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
