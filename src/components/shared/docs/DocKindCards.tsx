"use client";

import React, { useMemo } from "react";
import { RiArrowRightUpLine, RiFileTextLine, RiSparklingLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import type { DocKind, DocRecord } from "@/lib/fetchers/doc";
import type {
  DocTemplateKey,
  DocsTranslationFn,
} from "@/components/shared/docs/doc-template-config";
import { getDocKindLabel } from "@/components/shared/docs/doc-template-config";
import { cn } from "@/lib/utils";

export interface DocKindCardSlot {
  kind: DocKind;
  templateKey: DocTemplateKey;
}

function getLatestDocByKind(docs: DocRecord[], kind: DocKind) {
  return [...docs]
    .filter((doc) => doc.type === "document" && doc.kind === kind)
    .sort((left, right) => right.lastEditedAt - left.lastEditedAt)[0];
}

export function buildDocDigestSummary(
  docs: DocRecord[],
  locale: string,
  tDocs: DocsTranslationFn,
) {
  const counts = new Map<DocKind, number>();

  for (const doc of docs) {
    if (doc.type !== "document" || doc.kind === "GENERAL") {
      continue;
    }

    counts.set(doc.kind, (counts.get(doc.kind) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return tDocs("consumption.summaryEmpty");
  }

  const formatter = new Intl.ListFormat(locale, {
    style: "short",
    type: "conjunction",
  });
  const items = formatter.format(
    Array.from(counts.entries()).map(([kind, count]) =>
      tDocs("consumption.summaryCount", {
        count,
        label: getDocKindLabel(kind, tDocs),
      }),
    ),
  );

  return tDocs("consumption.summaryPrefix", { items });
}

export function DocKindCards({
  docs,
  slots,
  locale,
  tDocs,
  onOpenDoc,
  onCreateDoc,
  className,
}: {
  docs: DocRecord[];
  slots: DocKindCardSlot[];
  locale: string;
  tDocs: DocsTranslationFn;
  onOpenDoc: (doc: DocRecord) => void;
  onCreateDoc: (slot: DocKindCardSlot) => void;
  className?: string;
}) {
  const slotDocs = useMemo(
    () =>
      slots.map((slot) => ({
        slot,
        doc: getLatestDocByKind(docs, slot.kind) ?? null,
      })),
    [docs, slots],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-2xl border border-dashed border-app-border bg-app-content-bg px-4 py-3 text-xs leading-5 text-app-text-secondary">
        {buildDocDigestSummary(docs, locale, tDocs)}
      </div>

      <div className="grid gap-3">
        {slotDocs.map(({ slot, doc }) => {
          const kindLabel = getDocKindLabel(slot.kind, tDocs);

          return (
            <div
              key={`${slot.kind}-${slot.templateKey}`}
              className="rounded-2xl border border-app-border bg-app-content-bg px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-app-text-muted">
                    {kindLabel}
                  </div>
                  <div className="mt-2 flex items-start gap-2">
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-app-border bg-app-bg text-app-text-secondary">
                      <RiFileTextLine className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-app-text-primary">
                        {doc?.title || tDocs("consumption.emptyTitle")}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-app-text-secondary">
                        {doc
                          ? tDocs("consumption.updatedAt", {
                              value: new Intl.DateTimeFormat(locale, {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(doc.lastEditedAt)),
                            })
                          : tDocs("consumption.emptyDescription")}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-app-border bg-transparent text-app-text-primary"
                  onClick={() => (doc ? onOpenDoc(doc) : onCreateDoc(slot))}
                >
                  {doc ? (
                    <RiArrowRightUpLine className="size-4" />
                  ) : (
                    <RiSparklingLine className="size-4" />
                  )}
                  {doc
                    ? tDocs("consumption.openDoc")
                    : tDocs("consumption.createDoc")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
