import { useMemo } from "react";
import { Card } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { StatusBadge } from "../../shared/StatusBadge";
import {
  getUnitSources,
  getUnitProjections,
  getOverallStatus,
} from "../../../contexts/UnitContext";
import type { ContentManifestEntry } from "@klay/core";

interface UnitCardProps {
  unitId: string;
  manifests: ContentManifestEntry[];
}

export default function UnitCard({ unitId, manifests }: UnitCardProps) {
  const truncatedId =
    unitId.length > 8 ? `${unitId.slice(0, 8)}...` : unitId;

  const sources = useMemo(() => getUnitSources(manifests), [manifests]);
  const projections = useMemo(() => getUnitProjections(manifests), [manifests]);
  const status = useMemo(() => getOverallStatus(manifests), [manifests]);

  const createdDate = useMemo(() => {
    if (manifests.length === 0) return null;
    const sorted = [...manifests].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return new Date(sorted[0].createdAt);
  }, [manifests]);

  const formattedDate = createdDate
    ? createdDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "--";

  return (
    <a
      href={`/units/${unitId}/dashboard`}
      className="block group"
      style={{ textDecoration: "none" }}
    >
      <Card className="transition-all duration-150 ease-in-out group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:shadow-lg group-hover:shadow-blue-200/30 dark:group-hover:shadow-blue-800/30 cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon
                name="brain"
                className="text-lg"
                style={{ color: "var(--text-tertiary)" }}
              />
              <h3
                className="text-sm font-semibold font-mono truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {truncatedId}
              </h3>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Icon
                  name="database"
                  className="text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {sources.length} source{sources.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Icon
                  name="layers"
                  className="text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {projections.length} projection
                  {projections.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Icon
                  name="clock"
                  className="text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>
      </Card>
    </a>
  );
}
