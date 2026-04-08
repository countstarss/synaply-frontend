import {
  ArrowUpRight,
  CircleDot,
  FileText,
  GitBranch,
  Layers3,
  MessageSquareText,
} from "lucide-react";

import { EncryptedText } from "@/components/ui/encrypted-text";
import { cn } from "@/lib/utils";

interface ProductPreviewProps {
  className?: string;
  compact?: boolean;
}

const issueRows = [
  {
    name: "Remote onboarding release",
    owner: "ENG",
    state: "In review",
    doc: "Launch checklist",
  },
  {
    name: "Workflow handoff update",
    owner: "PM",
    state: "Spec aligned",
    doc: "Decision notes",
  },
  {
    name: "Docs linked to execution",
    owner: "OPS",
    state: "Ready",
    doc: "Operating guide",
  },
];

const workflowSteps = [
  "Product defines milestone and sequence",
  "Design delivers reviewed handoff packet",
  "Engineering ships with linked docs",
];

export function ProductPreview({
  className,
  compact = false,
}: ProductPreviewProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[14px] border border-white/10 bg-[#080a0f]/96 shadow-[0_40px_140px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
      <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-white/5 blur-[90px]" />

      <div className="relative p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-white/86">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Synaply Workspace</p>
              <p className="text-xs text-white/48">
                Projects, issues, workflows, and docs in one operating context
              </p>
            </div>
          </div>

          <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
            <EncryptedText
              text="remote execution synced"
              encryptedClassName="text-white/18"
              revealedClassName="text-white/54"
              revealDelayMs={22}
              flipDelayMs={24}
            />
          </div>
        </div>

        <div
          className={cn(
            "mt-4 grid gap-4",
            compact ? "lg:grid-cols-1" : "xl:grid-cols-[minmax(0,1.2fr)_22rem]",
          )}
        >
          <section className="border border-white/10 bg-[#0a0d12]">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                  Current execution
                </p>
                <h3 className="mt-1 text-sm font-semibold text-white">
                  Cross-role release coordination
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/72">
                <CircleDot className="h-3.5 w-3.5 text-emerald-200/70" />
                Synced now
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1.6fr)_76px_120px_132px] border-b border-white/8 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/28">
              <span>Issue</span>
              <span>Owner</span>
              <span>State</span>
              <span>Linked doc</span>
            </div>

            <div className="divide-y divide-white/8">
              {issueRows.map((row, index) => (
                <div
                  key={row.name}
                  className={cn(
                    "grid grid-cols-[minmax(0,1.6fr)_76px_120px_132px] items-center gap-3 px-4 py-4 text-sm",
                    index === 0 && "bg-white/[0.02]",
                  )}
                >
                  <div className="pr-4">
                    <p className="font-medium text-white">{row.name}</p>
                    <p className="mt-1 text-xs text-white/42">
                      Context stays attached as work moves.
                    </p>
                  </div>
                  <span className="text-xs font-medium tracking-[0.18em] text-white/60">
                    {row.owner}
                  </span>
                  <span
                    className={cn(
                      "inline-flex w-fit items-center border px-2.5 py-1 text-[11px] font-medium",
                      index === 0
                        ? "border-white/10 bg-white/[0.03] text-white/76"
                        : "border-white/10 bg-white/[0.03] text-white/68",
                    )}
                  >
                    {row.state}
                  </span>
                  <span className="text-xs text-white/54">{row.doc}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                    Workflow
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-white">
                    Clear handoff path
                  </h4>
                </div>
                <GitBranch className="h-4 w-4 text-white/56" />
              </div>

              <div className="space-y-3 px-4 py-4">
                {workflowSteps.map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <div className="flex w-6 flex-col items-center">
                      <div className="flex h-6 w-6 items-center justify-center border border-white/10 bg-white/[0.04] text-[11px] text-white/72">
                        {index + 1}
                      </div>
                      {index < workflowSteps.length - 1 ? (
                        <div className="mt-1 h-full w-px bg-gradient-to-b from-white/16 to-transparent" />
                      ) : null}
                    </div>
                    <div className="pt-1 text-xs leading-6 text-white/62">{item}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                    Context
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-white">
                    Docs and updates stay attached
                  </h4>
                </div>
                <FileText className="h-4 w-4 text-white/56" />
              </div>

              <div className="space-y-4 px-4 py-4">
                <div className="border border-white/8 bg-[#0b0e14] p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/32">
                    Doc snippet
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/70">
                    Launch checklist, reviewer notes, and release decisions stay visible beside the work instead of falling into chat history.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 text-xs text-white/46">
                  <div className="flex items-center gap-2">
                    {["PM", "DS", "ENG", "OPS"].map((label) => (
                      <div
                        key={label}
                        className="flex h-8 w-8 items-center justify-center border border-white/10 bg-white/[0.04] text-[10px] font-semibold tracking-[0.14em] text-white/74"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4" />
                    Shared by every role
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
