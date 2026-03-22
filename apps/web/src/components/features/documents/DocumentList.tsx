import { DataTable } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { SkeletonTableRow } from "../../shared/Skeleton";
import type { SourceSummaryDTO } from "@klay/core";

interface DocumentListProps {
  sources: SourceSummaryDTO[];
  isLoading?: boolean;
}

export function DocumentList({ sources, isLoading }: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Extracted</th>
              <th>Version</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonTableRow key={i} columns={5} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row: SourceSummaryDTO) => (
        <span className="font-mono text-xs">
          {row.name.length > 30 ? `${row.name.slice(0, 30)}...` : row.name}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row: SourceSummaryDTO) => (
        <span className="text-xs text-secondary">{row.type}</span>
      ),
    },
    {
      key: "hasBeenExtracted",
      header: "Extracted",
      render: (row: SourceSummaryDTO) => (
        <StatusBadge status={row.hasBeenExtracted ? "complete" : "partial"} />
      ),
    },
    {
      key: "currentVersion",
      header: "Version",
      render: (row: SourceSummaryDTO) => String(row.currentVersion ?? "—"),
    },
    {
      key: "registeredAt",
      header: "Registered",
      render: (row: SourceSummaryDTO) =>
        new Date(row.registeredAt).toLocaleDateString(),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sources}
      keyExtractor={(row) => row.id}
      emptyMessage="No documents ingested yet"
    />
  );
}
