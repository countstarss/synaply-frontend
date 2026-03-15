import { cn } from "@/lib/utils";
import { AdminStatusItem } from "@/lib/data/admin-data";

interface AdminStatusBoardProps {
  title: string;
  description: string;
  items: AdminStatusItem[];
}

function toneClass(tone: AdminStatusItem["tone"]) {
  if (tone === "positive") {
    return "border-emerald-500/25 bg-emerald-500/5";
  }

  if (tone === "warning") {
    return "border-orange-500/25 bg-orange-500/5";
  }

  return "border-app-border bg-app-content-bg";
}

export function AdminStatusBoard({
  title,
  description,
  items,
}: AdminStatusBoardProps) {
  return (
    <section className="space-y-4 rounded-xl border border-app-border bg-app-content-bg p-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.label}
            className={cn(
              "rounded-xl border p-4 transition-colors hover:bg-app-bg",
              toneClass(item.tone),
            )}
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {item.value}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
