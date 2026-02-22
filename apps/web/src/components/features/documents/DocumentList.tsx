import { DataTable } from "../../shared/DataTable.js";
import { StatusBadge } from "../../shared/StatusBadge.js";
import type { ContentManifestEntry } from "@klay/core";

interface DocumentListProps {
  manifests: ContentManifestEntry[];
}

export function DocumentList({ manifests }: DocumentListProps) {
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
