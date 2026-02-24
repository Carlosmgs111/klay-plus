type BadgeStatus = "complete" | "failed" | "pending" | "processing" | "partial";

const BADGE_CONFIG: Record<BadgeStatus, { className: string; label: string; dotColor: string }> = {
  complete: {
    className: "badge-complete",
    label: "Complete",
    dotColor: "var(--semantic-success)",
  },
  failed: {
    className: "badge-failed",
    label: "Failed",
    dotColor: "var(--semantic-danger)",
  },
  pending: {
    className: "badge-pending",
    label: "Pending",
    dotColor: "var(--semantic-warning)",
  },
  processing: {
    className: "badge-processing",
    label: "Processing",
    dotColor: "var(--accent-primary)",
  },
  partial: {
    className: "badge-pending",
    label: "Partial",
    dotColor: "var(--semantic-warning)",
  },
};

interface StatusBadgeProps {
  status: BadgeStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = BADGE_CONFIG[status] ?? { className: "badge", label: status, dotColor: "var(--text-tertiary)" };

  return (
    <span className={config.className}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.dotColor }}
      />
      {config.label}
    </span>
  );
}
