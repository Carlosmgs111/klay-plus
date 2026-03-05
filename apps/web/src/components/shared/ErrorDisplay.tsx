import { Icon } from "./Icon";

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
    <div className="bg-danger-muted border border-danger rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Icon name="alert-circle" className="text-danger mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-danger">{message}</p>
          <p className="text-xs mt-1 font-mono text-tertiary">{code}</p>
          {step && (
            <p className="text-xs mt-1 text-tertiary">
              Failed at step: <span className="font-medium text-secondary">{step}</span>
            </p>
          )}
          {completedSteps && completedSteps.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-tertiary">Completed steps:</p>
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
