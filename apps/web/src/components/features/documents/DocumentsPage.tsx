import { useEffect, useCallback, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext.js";
import { usePipelineAction } from "../../../hooks/usePipelineAction.js";
import { Card, CardHeader, CardBody } from "../../shared/Card.js";
import { Spinner } from "../../shared/Spinner.js";
import { ErrorDisplay } from "../../shared/ErrorDisplay.js";
import { DocumentUploadForm } from "./DocumentUploadForm.js";
import { DocumentList } from "./DocumentList.js";
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
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Ingest Document
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              {showForm ? "Hide Form" : "New Document"}
            </button>
          </div>
        </CardHeader>
        {showForm && (
          <CardBody>
            <DocumentUploadForm onSuccess={() => execute({})} />
          </CardBody>
        )}
      </Card>

      {error && <ErrorDisplay {...error} />}

      {/* Document List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Processed Documents
            </h2>
            {isLoading && <Spinner size="sm" />}
          </div>
        </CardHeader>
        <CardBody>
          <DocumentList manifests={data?.manifests ?? []} />
        </CardBody>
      </Card>
    </div>
  );
}
