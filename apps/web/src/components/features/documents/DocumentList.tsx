import { DataTable } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { SkeletonTableRow } from "../../shared/Skeleton";
import type { ContentManifestEntry } from "@klay/core";

interface DocumentListProps {
  manifests: ContentManifestEntry[];
  isLoading?: boolean;
}

export function DocumentList({ manifests, isLoading }: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Source ID</th>
              <th>Status</th>
              <th>Chunks</th>
              <th>Dimensions</th>
              <th>Created</th>
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
    { key: "sourceId", header: "Source ID" },
    {
      key: "status",
      header: "Status",
      render: (row: ContentManifestEntry) => (
        <StatusBadge status={row.status as any} />
      ),
    },
    {
      key: "chunksCount",
      header: "Chunks",
      render: (row: ContentManifestEntry) => String(row.chunksCount ?? "—"),
    },
    {
      key: "dimensions",
      header: "Dimensions",
      render: (row: ContentManifestEntry) => String(row.dimensions ?? "—"),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row: ContentManifestEntry) =>
        new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={manifests}
      keyExtractor={(row) => row.id}
      emptyMessage="No documents ingested yet"
    />
  );
}
