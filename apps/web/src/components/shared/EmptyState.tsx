import { Icon } from "./Icon";
import { Button } from "./Button";
import type { IconName } from "./Icon";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

export function EmptyState({ title, description, icon, action, children }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div
        className="mx-auto w-14 h-14 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: "var(--surface-3)" }}
      >
        <Icon
          name={icon ?? "layers"}
          size={28}
          className="opacity-40"
          style={{ color: "var(--text-tertiary)" }}
        />
      </div>
      <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm max-w-sm mx-auto" style={{ color: "var(--text-tertiary)" }}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}
