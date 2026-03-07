type BadgeStatus = "complete" | "failed" | "pending" | "processing" | "partial" | "empty";

const BADGE_CONFIG: Record<
  BadgeStatus,
  { className: string; label: string; dotClassName: string }
> = {
  complete: {
    className: "badge-complete",
    label: "Complete",
    dotClassName: "bg-success",
  },
  failed: {
    className: "badge-failed",
    label: "Failed",
    dotClassName: "bg-danger",
  },
  pending: {
    className: "badge-pending",
    label: "Pending",
    dotClassName: "bg-warning",
  },
  processing: {
    className: "badge-processing",
    label: "Processing",
    dotClassName: "bg-accent",
  },
  partial: {
    className: "badge-pending",
    label: "Partial",
    dotClassName: "bg-warning",
  },
  empty: {
    className: "badge-pending",
    label: "Empty",
    dotClassName: "bg-tertiary",
  },
};

interface StatusBadgeProps {
  status: BadgeStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = BADGE_CONFIG[status] ?? {
    className: "badge",
    label: status,
    dotClassName: "bg-tertiary",
  };

  return (
    <span className={config.className}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClassName}`} />
      {config.label}
    </span>
  );
}
