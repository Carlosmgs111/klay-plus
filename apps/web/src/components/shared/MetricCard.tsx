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
  default:
    "bg-gradient-to-b from-[rgba(37,99,235,0.18)] to-[rgba(37,99,235,0.08)] dark:from-[rgba(59,130,246,0.22)] dark:to-[rgba(59,130,246,0.08)] border-2 border-accent shadow-md",
  success:
    "bg-gradient-to-b from-[rgba(22,163,74,0.18)] to-[rgba(22,163,74,0.08)] dark:from-[rgba(62,207,142,0.22)] dark:to-[rgba(62,207,142,0.08)] border-2 border-success shadow-md",
  danger:
    "bg-gradient-to-b from-[rgba(220,38,38,0.18)] to-[rgba(220,38,38,0.08)] dark:from-[rgba(240,104,104,0.22)] dark:to-[rgba(240,104,104,0.08)] border-2 border-danger shadow-md",
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
