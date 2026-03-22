import { useState, useRef, useCallback } from "react";
import { Icon } from "../../shared/Icon";
import { StatusBadge } from "../../shared/StatusBadge";
import { ArchiveContextAction } from "./ArchiveContextAction";
import { DeprecateContextAction } from "./DeprecateContextAction";
import { ActivateContextAction } from "./ActivateContextAction";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { useKnowledgeContext } from "../../../contexts/KnowledgeContextContext";

interface ContextActionsMenuProps {
  contextId: string;
}

export function ContextActionsMenu({ contextId }: ContextActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showArchiveOverlay, setShowArchiveOverlay] = useState(false);
  const [showDeprecateOverlay, setShowDeprecateOverlay] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { detail, refresh } = useKnowledgeContext();
  const overallStatus = detail?.status ?? "empty";

  useClickOutside(menuRef, useCallback(() => setOpen(false), []), open);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-surface-3 text-tertiary hover:text-primary"
        aria-label="Context actions"
      >
        <Icon name="dots-vertical" className="text-lg" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[200px] bg-surface-2 border border-default shadow-lg rounded-lg py-2 px-1">
          <div className="flex items-center gap-2 px-3 py-1.5 mb-1 border-b border-subtle">
            <span className="text-xs text-tertiary">Status:</span>
            <StatusBadge status={overallStatus} />
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => { setShowArchiveOverlay(true); setOpen(false); }}
              className="flex items-center gap-1 w-full px-2 py-1 rounded-md text-xs font-medium transition-colors text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Icon name="archive" className="text-sm" />
              Archive
            </button>
            <button
              type="button"
              onClick={() => { setShowDeprecateOverlay(true); setOpen(false); }}
              className="flex items-center gap-1 w-full px-2 py-1 rounded-md text-xs font-medium transition-colors text-warning hover:bg-warning/10"
            >
              <Icon name="alert-triangle" className="text-sm" />
              Deprecate
            </button>
            <ActivateContextAction contextId={contextId} onSuccess={refresh} />
          </div>
        </div>
      )}

      <ArchiveContextAction contextId={contextId} onSuccess={refresh} open={showArchiveOverlay} setOpen={setShowArchiveOverlay} />
      <DeprecateContextAction contextId={contextId} onSuccess={refresh} open={showDeprecateOverlay} setOpen={setShowDeprecateOverlay} />
    </div>
  );
}
