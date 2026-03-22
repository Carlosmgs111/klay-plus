import { useState, useEffect } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../shared/Icon";
import { LoadingButton } from "../../shared/LoadingButton";
import type { SourceSummaryDTO } from "@klay/core";

interface AddExistingSourcePickerProps {
  contextId: string;
  /** Source IDs already in this context — used to filter out duplicates */
  existingSourceIds?: string[];
  onSuccess?: () => void;
}

export function AddExistingSourcePicker({
  contextId,
  existingSourceIds = [],
  onSuccess,
}: AddExistingSourcePickerProps) {
  const { service } = useRuntimeMode();
  const { addToast } = useToast();

  const [sources, setSources] = useState<SourceSummaryDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!service) return;
    service.sources.list().then((result) => {
      if (result.success) {
        const existing = new Set(existingSourceIds);
        setSources(
          result.data.sources.filter(
            (s) => s.hasBeenExtracted && !existing.has(s.id),
          ),
        );
      }
      setLoading(false);
    });
  }, [service, existingSourceIds]);

  const handleSubmit = async () => {
    if (!service || selectedIds.size === 0) return;

    setSubmitting(true);
    const ids = Array.from(selectedIds);
    let added = 0;

    for (const sourceId of ids) {
      try {
        const res = await service.process({ sourceId, contextId });
        if (res.success) added++;
      } catch {
        // continue
      }
    }

    setSubmitting(false);

    if (added === ids.length) {
      addToast(`${added} source(s) added`, "success");
    } else if (added > 0) {
      addToast(`${added}/${ids.length} source(s) added`, "warning");
    } else {
      addToast("Failed to add sources", "error");
    }

    if (added > 0) {
      setSelectedIds(new Set());
      onSuccess?.();
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <span className="text-xs text-tertiary">Loading sources...</span>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <p className="text-xs text-tertiary text-center py-3">
        No available sources to add.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="max-h-48 overflow-y-auto border border-primary rounded-lg divide-y divide-primary">
        {sources.map((s) => (
          <label
            key={s.id}
            className="flex items-center gap-3 px-3 py-2 hover:bg-hover cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(s.id)}
              onChange={(e) => {
                const next = new Set(selectedIds);
                if (e.target.checked) next.add(s.id);
                else next.delete(s.id);
                setSelectedIds(next);
              }}
              disabled={submitting}
              className="rounded border-primary"
            />
            <span className="flex-1 min-w-0">
              <span className="text-sm text-primary truncate block">{s.name}</span>
              <span className="text-xs text-tertiary truncate block">
                {s.id.slice(0, 12)}...
              </span>
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-surface-alt text-secondary shrink-0">
              {s.type}
            </span>
          </label>
        ))}
      </div>

      <LoadingButton
        type="button"
        loading={submitting}
        loadingText="Adding sources..."
        disabled={selectedIds.size === 0}
        onClick={handleSubmit}
        className="w-full"
      >
        <span className="flex items-center justify-center gap-1.5">
          <Icon name="plus" className="text-sm" />
          Add {selectedIds.size || ""} Existing Source{selectedIds.size !== 1 ? "s" : ""}
        </span>
      </LoadingButton>
    </div>
  );
}
