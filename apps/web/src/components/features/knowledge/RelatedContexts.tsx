import { useState, useCallback, useEffect } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { Input } from "../../shared/Input";
import { Select } from "../../shared/Select";
import { LoadingButton } from "../../shared/LoadingButton";
import type {
  LinkContextsInput,
  UnlinkContextsInput,
  GetContextLineageInput,
  GetContextLineageResult,
} from "@klay/core/lifecycle";

// ─── Constants ────────────────────────────────────────────────────────────────

const RELATIONSHIP_OPTIONS = [
  { value: "related", label: "Related" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "depends-on", label: "Depends On" },
  { value: "derived-from", label: "Derived From" },
] as const;

const RELATIONSHIP_COLORS: Record<string, string> = {
  related: "bg-accent-muted text-accent",
  parent: "bg-success-muted text-success",
  child: "bg-success-muted text-success",
  "depends-on": "bg-warning-muted text-warning",
  "derived-from": "bg-info-muted text-info",
};

function truncateId(id: string, maxLen = 16): string {
  return id.length > maxLen ? `${id.slice(0, maxLen)}...` : id;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RelatedContextsProps {
  contextId: string;
}

export function RelatedContexts({ contextId }: RelatedContextsProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();

  const [lineage, setLineage] = useState<GetContextLineageResult | null>(null);
  const [lineageLoading, setLineageLoading] = useState(true);
  const [lineageError, setLineageError] = useState<string | null>(null);

  const [showLinkForm, setShowLinkForm] = useState(false);
  const [targetContextId, setTargetContextId] = useState("");
  const [relationshipType, setRelationshipType] = useState("related");
  const [unlinkingTarget, setUnlinkingTarget] = useState<string | null>(null);

  // ─── Fetch Lineage ──────────────────────────────────────────────────

  const fetchLineage = useCallback(async () => {
    if (!lifecycleService) return;

    setLineageLoading(true);
    setLineageError(null);

    try {
      const result = await lifecycleService.getContextLineage({ contextId });
      if (result.success) {
        setLineage(result.data);
      } else {
        setLineageError(result.error.message);
      }
    } catch (err) {
      setLineageError(
        err instanceof Error ? err.message : "Failed to fetch lineage",
      );
    } finally {
      setLineageLoading(false);
    }
  }, [lifecycleService, contextId]);

  useEffect(() => {
    fetchLineage();
  }, [fetchLineage]);

  // ─── Link Action ────────────────────────────────────────────────────

  const linkAction = useCallback(
    (input: LinkContextsInput) => lifecycleService!.linkContexts(input),
    [lifecycleService],
  );

  const {
    error: linkError,
    isLoading: linkLoading,
    execute: executeLink,
  } = useServiceAction(linkAction);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetContextId.trim()) return;

    const result = await executeLink({
      sourceContextId: contextId,
      targetContextId: targetContextId.trim(),
      relationshipType,
    });

    if (result) {
      addToast(
        `Linked to ${truncateId(targetContextId.trim())} as "${relationshipType}"`,
        "success",
      );
      setTargetContextId("");
      setRelationshipType("related");
      setShowLinkForm(false);
      fetchLineage();
    }
  };

  const handleCloseLinkForm = () => {
    setShowLinkForm(false);
    setTargetContextId("");
    setRelationshipType("related");
  };

  // ─── Unlink Action ──────────────────────────────────────────────────

  const unlinkAction = useCallback(
    (input: UnlinkContextsInput) => lifecycleService!.unlinkContexts(input),
    [lifecycleService],
  );

  const {
    error: unlinkError,
    isLoading: unlinkLoading,
    execute: executeUnlink,
  } = useServiceAction(unlinkAction);

  const handleUnlink = async (targetId: string) => {
    const result = await executeUnlink({
      sourceContextId: contextId,
      targetContextId: targetId,
    });

    if (result) {
      addToast(`Unlinked from ${truncateId(targetId)}`, "success");
      setUnlinkingTarget(null);
      fetchLineage();
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────

  const traces = lineage?.traces ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Icon name="link" className="text-tertiary" />
            <h3 className="text-sm font-semibold text-primary tracking-heading">
              Related Contexts ({traces.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowLinkForm(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors text-accent hover:bg-accent-muted"
          >
            <Icon name="plus" className="text-sm" />
            Link
          </button>
        </div>
      </CardHeader>

      <CardBody>
        {/* Link Form Overlay */}
        <OverlayPanel open={showLinkForm} setOpen={handleCloseLinkForm} icon="link" title="Link Context">
          <form onSubmit={handleLink} className="space-y-4">
            <Input
              label="Target Context ID"
              value={targetContextId}
              onChange={(e) => setTargetContextId(e.target.value)}
              placeholder="Enter context ID..."
              required
            />
            <Select
              label="Relationship Type"
              options={RELATIONSHIP_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
            />

            {linkError && <ErrorDisplay {...linkError} />}

            <div className="flex items-center gap-2">
              <LoadingButton
                type="submit"
                loading={linkLoading}
                loadingText="Linking..."
                disabled={!targetContextId.trim()}
              >
                Link
              </LoadingButton>
              <button
                type="button"
                onClick={handleCloseLinkForm}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </form>
        </OverlayPanel>

        {/* Loading State */}
        {lineageLoading && (
          <div className="flex items-center justify-center py-6">
            <Spinner size="sm" />
            <span className="ml-2 text-xs text-tertiary">
              Loading lineage...
            </span>
          </div>
        )}

        {/* Error State */}
        {lineageError && !lineageLoading && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-danger-muted text-danger">
            <Icon name="alert-circle" className="text-base flex-shrink-0" />
            {lineageError}
          </div>
        )}

        {/* Empty State */}
        {!lineageLoading && !lineageError && traces.length === 0 && (
          <div className="text-center py-6">
            <Icon
              name="link"
              className="mx-auto mb-2 text-2xl text-ghost"
            />
            <p className="text-sm text-tertiary">
              No related contexts
            </p>
            <button
              type="button"
              onClick={() => setShowLinkForm(true)}
              className="text-xs mt-1 inline-block text-accent"
            >
              Link your first context
            </button>
          </div>
        )}

        {/* Traces List */}
        {!lineageLoading && !lineageError && traces.length > 0 && (
          <div className="space-y-2">
            {unlinkError && <ErrorDisplay {...unlinkError} />}

            {traces.map((trace) => {
              const otherContextId =
                trace.fromContextId === contextId
                  ? trace.toContextId
                  : trace.fromContextId;
              const badgeClass =
                RELATIONSHIP_COLORS[trace.relationship] ??
                "bg-accent-muted text-accent";

              return (
                <div
                  key={`${trace.fromContextId}-${trace.toContextId}-${trace.relationship}`}
                  className="flex items-center justify-between py-2 px-3 -mx-1 rounded-lg bg-surface-0 border border-subtle"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs truncate text-accent">
                      {truncateId(otherContextId)}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${badgeClass}`}
                    >
                      {trace.relationship}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {unlinkingTarget === otherContextId ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-secondary">Unlink?</span>
                        <button
                          type="button"
                          disabled={unlinkLoading}
                          onClick={() => handleUnlink(otherContextId)}
                          className="px-2 py-0.5 rounded-md text-xs font-medium transition-colors bg-danger text-white hover:opacity-90"
                        >
                          {unlinkLoading ? (
                            <span className="flex items-center gap-1">
                              <Spinner size="sm" />
                            </span>
                          ) : (
                            "Confirm"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnlinkingTarget(null)}
                          className="px-2 py-0.5 rounded-md text-xs font-medium transition-colors text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUnlinkingTarget(otherContextId)}
                        title="Unlink context"
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium transition-colors text-danger hover:text-danger hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <Icon name="unlink" className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
