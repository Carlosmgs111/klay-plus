import { useState, useRef, useEffect } from "react";
import { Icon } from "../../shared/Icon";
import { StatusBadge } from "../../shared/StatusBadge";
import { ArchiveContextAction } from "./ArchiveContextAction";
import { DeprecateContextAction } from "./DeprecateContextAction";
import { ActivateContextAction } from "./ActivateContextAction";
import {
  useKnowledgeContext,
  getOverallStatus,
} from "../../../contexts/KnowledgeContextContext";

interface ContextActionsMenuProps {
  contextId: string;
}

export function ContextActionsMenu({ contextId }: ContextActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { manifests, refresh } = useKnowledgeContext();
  const overallStatus = getOverallStatus(manifests);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

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
            <ArchiveContextAction contextId={contextId} onSuccess={refresh} />
            <DeprecateContextAction contextId={contextId} onSuccess={refresh} />
            <ActivateContextAction contextId={contextId} onSuccess={refresh} />
          </div>
        </div>
      )}
    </div>
  );
}
