import { Icon } from "./Icon.js";

interface ErrorDisplayProps {
  message: string;
  code: string;
  step?: string;
  completedSteps?: string[];
}

export function ErrorDisplay({
  message,
  code,
  step,
  completedSteps,
}: ErrorDisplayProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: "var(--semantic-danger-muted)",
        border: "1px solid var(--semantic-danger)",
        borderColor: "rgba(240, 104, 104, 0.2)",
      }}
    >
      <div className="flex items-start gap-3">
        <Icon name="alert-circle" size={18} style={{ color: "var(--semantic-danger)", marginTop: "2px", flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--semantic-danger)" }}>{message}</p>
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-tertiary)" }}>{code}</p>
          {step && (
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Failed at step: <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{step}</span>
            </p>
          )}
          {completedSteps && completedSteps.length > 0 && (
            <div className="mt-2">
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Completed steps:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {completedSteps.map((s) => (
                  <span key={s} className="badge-complete text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
