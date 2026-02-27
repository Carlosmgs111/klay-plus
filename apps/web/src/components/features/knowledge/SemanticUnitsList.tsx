import { DataTable } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import type { ContentManifestEntry } from "@klay/core";

interface SemanticUnitsListProps {
  manifests: ContentManifestEntry[];
  onSelectManifest: (manifest: ContentManifestEntry) => void;
}

export function SemanticUnitsList({
  manifests,
  onSelectManifest,
}: SemanticUnitsListProps) {
  const columns = [
    {
      key: "semanticUnitId",
      header: "Semantic Unit",
      render: (row: ContentManifestEntry) => (
        <button
          onClick={() => onSelectManifest(row)}
          className="font-mono text-xs hover:underline"
          style={{ color: "var(--accent-primary)", transition: "opacity 150ms" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          {row.semanticUnitId.slice(0, 12)}...
        </button>
      ),
    },
    { key: "sourceId", header: "Source" },
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
      key: "model",
      header: "Model",
      render: (row: ContentManifestEntry) => row.model ?? "—",
    },
    {
      key: "completedSteps",
      header: "Steps",
      render: (row: ContentManifestEntry) =>
        `${row.completedSteps.length} completed`,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={manifests}
      keyExtractor={(row) => row.id}
      emptyMessage="No semantic units cataloged yet"
    />
  );
}
