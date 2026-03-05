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
    <div className="text-center py-12 animate-fade-in">
      <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-accent-muted">
        <Icon
          name={icon ?? "layers"}
          className="text-4xl text-accent animate-float"
        />
      </div>
      <h3 className="text-base font-semibold text-primary">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 text-sm max-w-sm mx-auto text-tertiary leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}
