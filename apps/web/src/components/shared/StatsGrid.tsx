interface StatItem {
  label: string;
  value: string | number;
  truncate?: boolean;
}

interface StatsGridProps {
  stats: StatItem[];
  className?: string;
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={`grid gap-4 p-4 rounded-lg bg-surface-1 ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className={`text-lg font-semibold text-accent ${stat.truncate ? "truncate" : ""}`}>
            {stat.value}
          </p>
          <p className="text-xs text-tertiary">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
