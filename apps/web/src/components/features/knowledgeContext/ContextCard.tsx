import { Card } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { StatusBadge } from "../../shared/StatusBadge";
import type { EnrichedContextSummaryDTO } from "@klay/core";

interface ContextCardProps {
  context: EnrichedContextSummaryDTO;
}

export default function ContextCard({ context }: ContextCardProps) {
  const truncatedId =
    context.id.length > 12 ? `${context.id.slice(0, 12)}...` : context.id;

  return (
    <a
      href={`/contexts/${context.id}/dashboard`}
      className="block group no-underline"
    >
      <Card className="transition-all duration-150 ease-in-out group-hover:border-accent group-hover:shadow-md cursor-pointer p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon
                name="brain"
                className="text-lg text-tertiary"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate text-primary">
                  {context.name || truncatedId}
                </h3>
                {context.name && (
                  <p className="text-xs font-mono text-tertiary truncate">
                    {truncatedId}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Icon
                  name="database"
                  className="text-sm text-tertiary"
                />
                <span
                  className="text-xs text-secondary"
                >
                  {context.sourceCount} source{context.sourceCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Icon
                  name="settings"
                  className="text-sm text-tertiary"
                />
                <span
                  className="text-xs text-secondary font-mono"
                >
                  {context.requiredProfileId}
                </span>
              </div>
            </div>
          </div>

          <StatusBadge status={context.status} />
        </div>
      </Card>
    </a>
  );
}
