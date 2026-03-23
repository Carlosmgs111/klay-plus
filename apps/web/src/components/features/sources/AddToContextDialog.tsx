import { useState, useEffect, useCallback, useMemo } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { useToast } from "../../../contexts/ToastContext";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonLine } from "../../shared/Skeleton";
import type {
  ProcessKnowledgeInput,
  ContextRefDTO,
} from "@klay/core";

interface AddToContextDialogProps {
  sourceId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddToContextDialog({ sourceId, onClose, onSuccess }: AddToContextDialogProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [contexts, setContexts] = useState<ContextRefDTO[]>([]);
  const [loadingContexts, setLoadingContexts] = useState(true);

  // Fetch all contexts
  useEffect(() => {
    if (!service) return;
    setLoadingContexts(true);
    service.listContextRefs().then((result) => {
      if (result.success) {
        setContexts(result.data.contexts);
      }
      setLoadingContexts(false);
    });
  }, [service]);

  // Add source to context action
  const addAction = useCallback(
    (input: ProcessKnowledgeInput) => service!.process(input),
    [service],
  );
  const { error: addError, isLoading: adding, execute: executeAdd } =
    useServiceAction(addAction);

  const handleSubmit = async () => {
    if (!selectedContextId) return;

    const result = await executeAdd({
      sourceId,
      contextId: selectedContextId,
    });

    if (result) {
      addToast({
        type: "success",
        title: "Source added",
        message: `Source added to context successfully (${result.chunksCount ?? 0} chunks)`,
      });
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-2 rounded-xl shadow-xl w-[400px] max-w-[90vw] border border-subtle">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
          <div className="flex items-center gap-2">
            <Icon name="folder-plus" className="text-accent" />
            <h3 className="text-sm font-semibold text-primary">Add to Context</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Icon name="x" className="text-tertiary text-sm" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {addError && <ErrorDisplay {...addError} />}

          {loadingContexts ? (
            <div className="space-y-2">
              <SkeletonLine className="w-full h-10" />
              <SkeletonLine className="w-full h-10" />
            </div>
          ) : contexts.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-4">
              No contexts available. Create a context first.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contexts.map((ctx) => {
                const truncatedId =
                  ctx.id.length > 16 ? `${ctx.id.slice(0, 16)}...` : ctx.id;
                const isSelected = selectedContextId === ctx.id;
                return (
                  <button
                    key={ctx.id}
                    type="button"
                    onClick={() => setSelectedContextId(ctx.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "border-subtle hover:border-accent/50 hover:bg-surface-3"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="brain" className="text-sm text-tertiary" />
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-primary block">
                          {ctx.name || truncatedId}
                        </span>
                        {ctx.name && (
                          <span className="text-xs font-mono text-tertiary">{truncatedId}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-tertiary capitalize">{ctx.state}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-subtle">
          <Button variant="ghost" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedContextId || adding}
            className="text-xs flex items-center gap-1.5"
          >
            {adding ? (
              <>
                <div className="skeleton w-3 h-3 rounded-full" />
                Adding...
              </>
            ) : (
              <>
                <Icon name="plus" className="text-sm" />
                Add Source
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
