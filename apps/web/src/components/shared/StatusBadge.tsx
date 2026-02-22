type BadgeStatus = "complete" | "failed" | "pending" | "processing" | "partial";

const BADGE_CLASS: Record<BadgeStatus, string> = {
  complete: "badge-complete",
  failed: "badge-failed",
  pending: "badge-pending",
  processing: "badge-processing",
  partial: "badge-pending",
};

const BADGE_LABEL: Record<BadgeStatus, string> = {
  complete: "Complete",
  failed: "Failed",
  pending: "Pending",
  processing: "Processing",
  partial: "Partial",
};

interface StatusBadgeProps {
  status: BadgeStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={BADGE_CLASS[status] ?? "badge"}>
      {BADGE_LABEL[status] ?? status}
    </span>
  );
}
