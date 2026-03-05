import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  variant?: "default" | "success" | "danger";
  icon?: IconName;
  trend?: { direction: "up" | "down" | "neutral"; value: string };
  children?: ReactNode;
}

const VARIANT_STYLES = {
  default: "bg-accent-muted border border-accent text-accent",
  success: "bg-success-muted border border-success text-success",
  danger: "bg-danger-muted border border-danger text-danger",
};

const TREND_CONFIG = {
  up: { icon: "arrow-up" as IconName },
  down: { icon: "arrow-down" as IconName },
  neutral: { icon: "chevron-right" as IconName },
};

export function MetricCard({
  label,
  value,
  variant = "default",
  icon,
  trend,
  children,
}: MetricCardProps) {
  const variantClass = VARIANT_STYLES[variant];

  return (
    <div className={`rounded-lg p-4 ${variantClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.1em]">
            {label}
          </p>
          <p className="text-2xl font-semibold mt-2 font-mono">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              <Icon name={TREND_CONFIG[trend.direction].icon} />
              <span className={`text-xs font-medium ${""}`}>{trend.value}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
            <Icon name={icon} className="text-3xl" />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
