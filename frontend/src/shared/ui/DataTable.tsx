import type { ReactNode } from "react";
import { Form, Table } from "react-bootstrap";

export interface TableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
}

interface DataTableProps<Row extends { id: string }> {
  rows: Row[];
  columns: TableColumn<Row>[];
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  emptyMessage?: string;
}

export function DataTable<Row extends { id: string }>({
  rows,
  columns,
  selectedIds,
  onSelectionChange,
  emptyMessage = "No data",
}: DataTableProps<Row>) {
  const selectable = Boolean(selectedIds && onSelectionChange);

  const toggleRow = (id: string) => {
    if (!selectedIds || !onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  return (
    <div className="border rounded bg-body table-responsive">
      <Table bordered hover className="mb-0 align-middle" aria-label="Data table">
        <thead>
          <tr>
            {selectable ? <th className="selection-column" scope="col" /> : null}
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={selectedIds?.has(row.id) ? "table-success" : ""}>
              {selectable ? (
                <td className="text-center">
                  <Form.Check
                    checked={selectedIds?.has(row.id) ?? false}
                    onChange={() => toggleRow(row.id)}
                    aria-label="Select row"
                  />
                </td>
              ) : null}
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="py-5 text-center text-secondary"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </Table>
    </div>
  );
}
