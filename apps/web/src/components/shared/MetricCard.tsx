import { Icon } from "./Icon.js";
import type { IconName } from "./Icon.js";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  variant?: "default" | "success" | "danger";
  icon?: IconName;
  trend?: { direction: "up" | "down" | "neutral"; value: string };
  children?: ReactNode;
}

const VARIANT_ACCENT = {
  default:
    "from-blue-200 via-blue-400 to-blue-200 dark:from-blue-500 dark:via-blue-600 dark:to-blue-500 border-2 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-600/80",
  success:
    "from-green-200 via-green-400 to-green-200 dark:from-green-500 dark:via-green-600 dark:to-green-500 border-2 border-green-300 dark:border-green-600 shadow-lg shadow-green-600/80",
  danger:
    "from-red-200 via-red-400 to-red-200 dark:from-red-500 dark:via-red-600 dark:to-red-500 border-2 border-red-300 dark:border-red-600 shadow-lg shadow-red-600/80",
};

const VARIANT_ICON_BG = {
  default: "var(--accent-primary-muted)",
  success: "var(--semantic-success-muted)",
  danger: "var(--semantic-danger-muted)",
};

const TREND_CONFIG = {
  up: { icon: "arrow-up" as IconName, color: "var(--semantic-success)" },
  down: { icon: "arrow-down" as IconName, color: "var(--semantic-danger)" },
  neutral: { icon: "chevron-right" as IconName, color: "var(--text-tertiary)" },
};

export function MetricCard({
  label,
  value,
  variant = "default",
  icon,
  trend,
  children,
}: MetricCardProps) {
  const accent = VARIANT_ACCENT[variant];

  return (
    <div className={`rounded-lg p-4 bg-gradient-to-b ${accent}`}>
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
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: VARIANT_ICON_BG[variant] }}
          >
            <Icon name={icon} className="text-3xl" />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
