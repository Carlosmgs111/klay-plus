interface MetricCardProps {
  label: string;
  value: number | string;
  variant?: "default" | "success" | "danger";
}

const VARIANT_STYLES = {
  default: "text-gray-900",
  success: "text-success-600",
  danger: "text-danger-600",
};

export function MetricCard({ label, value, variant = "default" }: MetricCardProps) {
  return (
    <div className="metric-card">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${VARIANT_STYLES[variant]}`}>{value}</p>
    </div>
  );
}
