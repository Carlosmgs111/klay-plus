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
    <div className="bg-danger-50 border border-danger-200 rounded-card p-4">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-danger-500 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-danger-800">{message}</p>
          <p className="text-xs text-danger-600 mt-1 font-mono">{code}</p>
          {step && (
            <p className="text-xs text-danger-600 mt-1">
              Failed at step: <span className="font-medium">{step}</span>
            </p>
          )}
          {completedSteps && completedSteps.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">Completed steps:</p>
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
