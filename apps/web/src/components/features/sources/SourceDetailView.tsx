import { useEffect, useCallback, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonCard, SkeletonLine } from "../../shared/Skeleton";
import { ProcessAllProfilesAction } from "../knowledge/ProcessAllProfilesAction";
import { AddToContextDialog } from "./AddToContextDialog";
import type {
  GetSourceInput,
  GetSourceResult,
  GetSourceContextsInput,
  GetSourceContextsResult,
} from "@klay/core";

interface SourceDetailViewProps {
  sourceId: string;
  onAddedToContext: () => void;
}

export function SourceDetailView({ sourceId, onAddedToContext }: SourceDetailViewProps) {
  const { service, isInitializing } = useRuntimeMode();
  const [showAddToContext, setShowAddToContext] = useState(false);

  // Fetch source detail
  const fetchSource = useCallback(
    (input: GetSourceInput) => service!.sources.get(input),
    [service],
  );
  const { data: sourceData, error: sourceError, isLoading: sourceLoading, execute: fetchSourceDetail } =
    usePipelineAction(fetchSource);

  // Fetch source contexts
  const fetchContexts = useCallback(
    (input: GetSourceContextsInput) => service!.sources.getContexts(input),
    [service],
  );
  const { data: contextsData, error: contextsError, isLoading: contextsLoading, execute: fetchSourceContexts } =
    usePipelineAction(fetchContexts);

  useEffect(() => {
    if (service && !isInitializing) {
      fetchSourceDetail({ sourceId });
      fetchSourceContexts({ sourceId });
    }
  }, [service, isInitializing, sourceId]);

  if (isInitializing || (sourceLoading && !sourceData)) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonLine className="w-2/3 h-4" />
        <SkeletonCard />
      </div>
    );
  }

  const source = sourceData?.source;
  const error = sourceError || contextsError;

  if (error) return <ErrorDisplay {...error} />;
  if (!source) return <p className="text-sm text-tertiary">Source not found</p>;

  const formattedDate = new Date(source.registeredAt).toLocaleDateString(
    undefined,
    { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  );

  return (
    <div className="space-y-5">
      {/* Source Info */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-tertiary uppercase tracking-wider">Name</label>
          <p className="text-sm text-primary font-medium mt-0.5">{source.name}</p>
        </div>
        <div>
          <label className="text-xs text-tertiary uppercase tracking-wider">URI</label>
          <p className="text-xs text-secondary font-mono mt-0.5 break-all">{source.uri}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-tertiary uppercase tracking-wider">Type</label>
            <p className="text-sm text-primary mt-0.5">{source.type}</p>
          </div>
          <div>
            <label className="text-xs text-tertiary uppercase tracking-wider">ID</label>
            <p className="text-xs text-secondary font-mono mt-0.5 break-all">{source.id}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-tertiary uppercase tracking-wider">Registered</label>
            <p className="text-sm text-secondary mt-0.5">{formattedDate}</p>
          </div>
          <div>
            <label className="text-xs text-tertiary uppercase tracking-wider">Status</label>
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  source.hasBeenExtracted
                    ? "bg-green-500/10 text-green-500"
                    : "bg-yellow-500/10 text-yellow-500"
                }`}
              >
                {source.hasBeenExtracted ? "Extracted" : "Pending"}
              </span>
              {source.hasBeenExtracted && (
                <ProcessAllProfilesAction sourceId={source.id} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Versions */}
      {source.versions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon name="git-branch" className="text-tertiary" />
              <h3 className="text-xs font-semibold text-primary tracking-heading">
                Versions ({source.versions.length})
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {source.versions.map((v) => (
                <div
                  key={v.version}
                  className="flex items-center justify-between py-1.5 border-b border-subtle last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-accent">v{v.version}</span>
                    <span className="text-xs text-tertiary font-mono">
                      {v.contentHash.slice(0, 12)}...
                    </span>
                  </div>
                  <span className="text-xs text-tertiary">
                    {new Date(v.extractedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Extracted Text Preview */}
      {source.extractedTextPreview && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon name="file-text" className="text-tertiary" />
              <h3 className="text-xs font-semibold text-primary tracking-heading">
                Extracted Text Preview
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-xs text-secondary whitespace-pre-wrap leading-relaxed">
              {source.extractedTextPreview}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Contexts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="brain" className="text-tertiary" />
              <h3 className="text-xs font-semibold text-primary tracking-heading">
                Contexts ({contextsData?.contexts?.length ?? 0})
              </h3>
              {contextsLoading && <div className="skeleton w-3 h-3 rounded-full" />}
            </div>
            <Button
              variant="ghost"
              className="text-xs flex items-center gap-1 text-tertiary"
              onClick={() => setShowAddToContext(true)}
            >
              <Icon name="plus" className="text-sm" />
              Add to Context
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {(contextsData?.contexts?.length ?? 0) === 0 ? (
            <p className="text-xs text-tertiary text-center py-4">
              This source is not associated with any context yet
            </p>
          ) : (
            <div className="space-y-2">
              {contextsData!.contexts.map((ctx) => {
                const truncatedId =
                  ctx.id.length > 12 ? `${ctx.id.slice(0, 12)}...` : ctx.id;
                return (
                  <a
                    key={ctx.id}
                    href={`/contexts/${ctx.id}/dashboard`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-3 transition-colors no-underline"
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="brain" className="text-sm text-tertiary" />
                      <span className="text-xs font-mono text-primary">{truncatedId}</span>
                      {ctx.name && (
                        <span className="text-xs text-secondary">{ctx.name}</span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        ctx.state === "active"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {ctx.state}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add to Context Dialog */}
      {showAddToContext && (
        <AddToContextDialog
          sourceId={sourceId}
          onClose={() => setShowAddToContext(false)}
          onSuccess={() => {
            setShowAddToContext(false);
            fetchSourceContexts({ sourceId });
            onAddedToContext();
          }}
        />
      )}
    </div>
  );
}
