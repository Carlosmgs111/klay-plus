import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  keyExtractor,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: "var(--text-tertiary)" }}>{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th className="p-4 w-full" key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="w-full" key={keyExtractor(row)}>
              {columns.map((col) => (
                <td className="p-4" key={col.key}>
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
