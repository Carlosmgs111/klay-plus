import { useEffect, useCallback, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonLine } from "../../shared/Skeleton";
import { DocumentUploadForm } from "./DocumentUploadForm";
import { DocumentList } from "./DocumentList";
import type { GetManifestInput } from "@klay/core";

export function DocumentsPage() {
  const { service, isInitializing } = useRuntimeMode();
  const [showForm, setShowForm] = useState(false);

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
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="upload" size={16} style={{ color: "var(--text-tertiary)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Ingest Document
              </h2>
            </div>
            <Button
              variant={showForm ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Icon name={showForm ? "x" : "plus"} size={14} />
              {showForm ? "Close" : "New Document"}
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardBody>
            <div className="animate-fade-in">
              <DocumentUploadForm
                onSuccess={() => {
                  execute({});
                  setShowForm(false);
                }}
              />
            </div>
          </CardBody>
        )}
      </Card>

      {error && <ErrorDisplay {...error} />}

      {/* Document List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="file-text" size={16} style={{ color: "var(--text-tertiary)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
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
