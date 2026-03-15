import { DashboardRecord } from "./types";
import { StatusPill } from "./StatusPill";

interface DashboardRecordsTableProps {
  title: string;
  records: DashboardRecord[];
}

export function DashboardRecordsTable({ title, records }: DashboardRecordsTableProps) {
  return (
    <section className="rounded-xl border border-app-border bg-app-content-bg">
      <header className="border-b border-app-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Replace this schema with your own model and backend fields.
        </p>
      </header>

      <div className="overflow-x-auto px-5 py-3">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-2 py-2 font-medium">ID</th>
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium">Owner</th>
              <th className="px-2 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-app-border/60">
                <td className="px-2 py-3 font-mono text-xs text-muted-foreground">{record.id}</td>
                <td className="px-2 py-3 font-medium">{record.name}</td>
                <td className="px-2 py-3">
                  <StatusPill status={record.status} />
                </td>
                <td className="px-2 py-3 text-muted-foreground">{record.owner}</td>
                <td className="px-2 py-3 text-muted-foreground">{record.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
