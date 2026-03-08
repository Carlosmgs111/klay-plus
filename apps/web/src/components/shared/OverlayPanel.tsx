import { Overlay } from "./Overlay";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface OverlayPanelProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  icon: IconName;
  iconColor?: string;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function OverlayPanel({
  open,
  setOpen,
  icon,
  iconColor = "text-accent",
  title,
  children,
  width = "w-[420px]",
}: OverlayPanelProps) {
  return (
    <Overlay open={open} setOpen={setOpen}>
      <div className={`h-full ${width} max-w-[90vw] flex flex-col bg-surface-2`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <div className="flex items-center gap-2">
            <Icon name={icon} className={iconColor} />
            <h2 className="text-sm font-semibold text-primary tracking-heading">{title}</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Icon name="x" className="text-tertiary" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </Overlay>
  );
}
