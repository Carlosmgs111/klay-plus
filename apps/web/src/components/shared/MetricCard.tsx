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
    "from-blue-300 via-blue-400 to-blue-300 dark:from-blue-500 dark:via-blue-600 dark:to-blue-600 border-2 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-600/80",
  success:
    "from-green-300 via-green-400 to-green-300 dark:from-green-600 dark:via-green-600 dark:to-green-600 border-2 border-green-300 dark:border-green-700 shadow-lg shadow-green-600/80",
  danger:
    "from-red-300 via-red-400 to-red-300 dark:from-red-600 dark:via-red-500 dark:to-red-600 border-2 border-red-300 dark:border-red-700 shadow-lg shadow-red-600/80",
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
          <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
            <Icon name={icon} className="text-3xl" />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
