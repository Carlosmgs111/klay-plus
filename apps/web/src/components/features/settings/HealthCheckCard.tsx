import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import type { SearchKnowledgeInput } from "@klay/core";

export function HealthCheckCard() {
  const { service, isInitializing } = useRuntimeMode();
  const { addToast } = useToast();

  const healthCheck = useCallback(
    (input: SearchKnowledgeInput) => service!.search(input),
    [service],
  );

  const { error, isLoading, execute } = usePipelineAction(healthCheck);

  const runHealthCheck = async () => {
    const result = await execute({ queryText: "health check test", topK: 1 });
    if (result) {
      addToast(`Pipeline is operational. Search returned ${result.totalFound} results.`, "success");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="zap" className="text-tertiary" />
          <h2 className="text-sm font-semibold text-primary tracking-heading">Health Check</h2>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <p className="text-sm text-tertiary">
            Run a test search to verify the pipeline is operational in the current mode.
          </p>
          <Button
            onClick={runHealthCheck}
            disabled={isLoading || isInitializing || !service}
            variant="secondary"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" /> Running...
              </span>
            ) : (
              <>
                <Icon name="zap" />
                Run Health Check
              </>
            )}
          </Button>
          {error && <ErrorDisplay {...error} />}
        </div>
      </CardBody>
    </Card>
  );
}
