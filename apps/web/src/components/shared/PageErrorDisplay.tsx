import { Icon } from "./Icon";

interface PageErrorDisplayProps {
  message: string;
  code?: string;
}

export function PageErrorDisplay({ message, code }: PageErrorDisplayProps) {
  return (
    <div className="rounded-lg p-4 bg-danger-muted border border-danger">
      <div className="flex items-start gap-3">
        <Icon name="alert-circle" className="text-danger mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-danger">{message}</p>
          {code && (
            <p className="text-xs mt-1 font-mono text-tertiary">{code}</p>
          )}
        </div>
      </div>
    </div>
  );
}
