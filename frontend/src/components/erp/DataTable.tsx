import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  label: string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  label,
  emptyMessage = "No records to show.",
  className,
}: DataTableProps<T>) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`erp-surface max-h-full min-w-0 overflow-auto ${className ?? ""}`}
    >
      <table className="w-full min-w-max border-collapse text-left">
        <thead className="sticky top-0 z-[1] bg-card">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className="border-b border-border last:border-0 [&>td]:px-4 [&>td]:py-3 [&>td]:text-base [&>td]:text-foreground"
              >
                {columns.map((column) => {
                  const value = column.cell(row);
                  return (
                    <td key={column.key} className={column.className}>
                      {value === null || value === undefined || value === "" ? "-" : value}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-base text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
