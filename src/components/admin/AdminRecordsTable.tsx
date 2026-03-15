import { StatusPill } from "@/components/dashboard-kit";
import {
  AdminTableColumn,
  AdminTableRow,
} from "@/lib/data/admin-data";
import { cn } from "@/lib/utils";

interface AdminRecordsTableProps {
  title: string;
  description: string;
  columns: AdminTableColumn[];
  rows: AdminTableRow[];
}

function getCellClass(kind: AdminTableColumn["kind"]) {
  if (kind === "mono") {
    return "font-mono text-xs text-muted-foreground";
  }

  if (kind === "muted") {
    return "text-muted-foreground";
  }

  return "";
}

export function AdminRecordsTable({
  title,
  description,
  columns,
  rows,
}: AdminRecordsTableProps) {
  return (
    <section className="rounded-xl border border-app-border bg-app-content-bg">
      <header className="border-b border-app-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="overflow-x-auto px-5 py-3">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((column) => (
                <th key={column.key} className="px-2 py-2 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-app-border/60 align-top">
                {columns.map((column) => {
                  const value = row[column.key] || "-";

                  return (
                    <td
                      key={`${row.id}-${column.key}`}
                      className={cn("px-2 py-3", getCellClass(column.kind))}
                    >
                      {column.kind === "status" ? (
                        <StatusPill status={value} />
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
