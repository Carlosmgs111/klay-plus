import { Icon } from "./Icon";
import { Button } from "./Button";
import type { IconName } from "./Icon";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  action?: { label: string; onClick: () => void };
  link?: { label: string; href: string };
  compact?: boolean;
  children?: ReactNode;
}

export function EmptyState({ title, description, icon, action, link, compact, children }: EmptyStateProps) {
  return (
    <div className={`text-center animate-fade-in ${compact ? "py-6" : "py-12"}`}>
      {!compact && (
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-accent-muted">
          <Icon
            name={icon ?? "layers"}
            className="text-4xl text-accent animate-float"
          />
        </div>
      )}
      {compact && (
        <Icon
          name={icon ?? "layers"}
          className="mx-auto mb-2 text-2xl text-ghost"
        />
      )}
      <h3 className={compact ? "text-sm text-tertiary" : "text-base font-semibold text-primary"}>
        {title}
      </h3>
      {description && (
        <p className={`mt-1 ${compact ? "text-xs text-ghost" : "text-sm max-w-sm mx-auto text-tertiary leading-relaxed mt-1.5"}`}>
          {description}
        </p>
      )}
      {link && (
        <a href={link.href} className="text-xs mt-1 inline-block text-accent hover:underline">
          {link.label}
        </a>
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
