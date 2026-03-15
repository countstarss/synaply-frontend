import { Badge } from "@/components/ui/badge";
import { AdminFieldGroup } from "@/lib/data/admin-data";

interface AdminFieldCoverageProps {
  title: string;
  description: string;
  groups: AdminFieldGroup[];
}

export function AdminFieldCoverage({
  title,
  description,
  groups,
}: AdminFieldCoverageProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <article
            key={group.title}
            className="rounded-xl border border-app-border bg-app-content-bg p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.description}
                </p>
              </div>
              <Badge variant="secondary" className="px-2 py-1 text-[11px]">
                {group.badge}
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {group.items.map((item) => (
                <div
                  key={`${group.title}-${item.field}`}
                  className="rounded-lg border border-app-border/70 bg-app-bg p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.required ? (
                      <Badge variant="outline" className="text-[10px]">
                        Required
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                    {item.field}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
