type BadgeStatus = "complete" | "failed" | "pending" | "processing" | "partial";

const BADGE_CONFIG: Record<
  BadgeStatus,
  { className: string; label: string; dotColor: string }
> = {
  complete: {
    className: "bg-green-600",
    label: "Complete",
    dotColor: "bg-green-300",
  },
  failed: {
    className: "bg-red-500",
    label: "Failed",
    dotColor: "bg-red-500",
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
  const config = BADGE_CONFIG[status] ?? { className: "badge", label: status };

  return (
    <span className={"p-1 px-2 rounded-md flex items-center gap-2 " + config.className}>
      <span className={"w-2 h-2 rounded-full " + config.dotColor} />
      {config.label}
    </span>
  );
}
