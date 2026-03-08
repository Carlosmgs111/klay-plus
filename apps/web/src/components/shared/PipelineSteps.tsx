import { Icon } from "./Icon";

interface PipelineStepsProps {
  completedSteps: string[];
  failedStep?: string | null;
  className?: string;
}

export function PipelineSteps({ completedSteps, failedStep, className }: PipelineStepsProps) {
  if (completedSteps.length === 0 && !failedStep) return null;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className ?? ""}`}>
      {completedSteps.map((step, idx) => (
        <span key={step} className="flex items-center gap-1">
          {idx > 0 && <Icon name="chevron-right" className="text-ghost" />}
          <span className="badge-complete text-xs">{step}</span>
        </span>
      ))}
      {failedStep && (
        <>
          <Icon name="chevron-right" className="text-ghost" />
          <span className="badge-failed text-xs">{failedStep}</span>
        </>
      )}
    </div>
  );
}
