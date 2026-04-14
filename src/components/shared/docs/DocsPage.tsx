"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RiFileTextLine, RiFolder3Line, RiAddLine } from "react-icons/ri";
import DocsProvider, {
  useDocs,
  DocsDocument,
  DocumentContext,
} from "./DocsContext";
import DocsSidebar from "./DocsSidebar";
import DocsTabs from "./DocsTabs";
import DocsEditor from "./DocsEditor";
import { useWorkspace } from "@/hooks/useWorkspace";
import AmbientGlow from "@/components/global/AmbientGlow";
import { useDocStore } from "@/stores/doc-store";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import {
//   ResizablePanelGroup,
//   ResizablePanel,
//   ResizableHandle,
// } from "@/components/ui/resizable";

function DocsPageFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative h-full min-h-full bg-app-bg ${className ?? ""}`}>
      <AmbientGlow />
      <div className="relative z-10 h-full min-h-full overflow-y-auto isolate bg-app-content-bg/80">
        {children}
      </div>
    </div>
  );
}

const docsStaticCardClassName =
  "rounded-2xl border border-app-border bg-app-content-bg/80 p-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-sm";

const docsActionCardClassName =
  "cursor-pointer rounded-2xl border border-app-border bg-app-content-bg/80 p-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-sm transition hover:bg-app-button-hover/40";

const docsListItemClassName =
  "flex cursor-pointer items-center gap-3 rounded-2xl border border-app-border bg-app-content-bg/80 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm transition hover:bg-app-button-hover/40";

interface DocsPageProps {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  userId: string;
  context?: DocumentContext; // Optional; detected automatically when omitted.
  projectId?: string;
}

interface DocsSourceOption {
  value: DocumentContext;
  label: string;
}

function formatDocDate(value: number, locale: string) {
  return new Date(value).toLocaleDateString(locale);
}

function resolveDocumentContext(
  providedContext: DocumentContext | undefined,
  workspaceType: "PERSONAL" | "TEAM",
  currentWorkspaceType?: "PERSONAL" | "TEAM",
): DocumentContext {
  if (providedContext) {
    return providedContext;
  }

  if (currentWorkspaceType === "PERSONAL" || workspaceType === "PERSONAL") {
    return "personal";
  }

  return "team";
}

function DocsSourceSwitcher({
  value,
  options,
  onValueChange,
}: {
  value: DocumentContext;
  options: DocsSourceOption[];
  onValueChange: (value: DocumentContext) => void;
}) {
  const tDocs = useTranslations("docs");
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-app-text-muted">
          {tDocs("sourceSwitcher.label")}
        </p>
        <p className="mt-1 text-xs text-app-text-secondary">
          {tDocs("sourceSwitcher.description")}
        </p>
      </div>

      <Select value={value} onValueChange={(next) => onValueChange(next as DocumentContext)}>
        <SelectTrigger size="sm" className="w-[220px]">
          <SelectValue placeholder={tDocs("sourceSwitcher.placeholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function PersonalDocsOverviewPage() {
  const tDocs = useTranslations("docs");
  const locale = useLocale();
  const { documents, createDoc, openDoc } = useDocs();

  // Split the overview into root-level docs and recent updates.
  const rootDocs = documents.filter((doc) => !doc.parentDocument);
  const recentDocs = [...documents]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  const handleSelectDoc = (doc: DocsDocument) => {
    openDoc(doc);
  };

  const handleCreateNewDoc = async () => {
    await createDoc(tDocs("creation.newDoc"));
  };

  return (
    <DocsPageFrame>
      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-semibold text-app-text-primary">
            {tDocs("overview.personal.title")}
          </h1>
          <p className="text-app-text-secondary">
            {tDocs("overview.personal.subtitle", { count: documents.length })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={docsStaticCardClassName}>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded bg-sky-100 p-2 dark:bg-sky-900/20">
                <RiFileTextLine className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-2xl font-semibold text-app-text-primary">
                {documents.filter((doc) => doc.type === "document").length}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">{tDocs("overview.shared.documentMetric")}</p>
          </div>

          <div className={docsStaticCardClassName}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
                <RiFolder3Line className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-semibold text-app-text-primary">
                {documents.filter((doc) => doc.type === "folder").length}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">{tDocs("overview.shared.folderMetric")}</p>
          </div>

          <button
            onClick={handleCreateNewDoc}
            className={docsActionCardClassName}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded bg-sky-100 p-2 dark:bg-sky-900/20">
                <RiAddLine className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-lg font-semibold text-app-text-primary">
                {tDocs("overview.shared.newDocTitle")}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">{tDocs("overview.personal.newDocDescription")}</p>
          </button>
        </div>

        {/* Document Categories */}
        {rootDocs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-app-text-primary mb-4">
              {tDocs("overview.shared.categoryTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rootDocs.map((doc) => {
                const childCount = documents.filter(
                  (d) => d.parentDocument === doc._id
                ).length;
                return (
                  <div
                    key={doc._id}
                    onClick={() => handleSelectDoc(doc)}
                    className={docsActionCardClassName}
                  >
                    <div className="flex items-start gap-3">
                      {doc.type === "folder" ? (
                        <RiFolder3Line className="w-5 h-5 text-app-text-secondary mt-0.5" />
                      ) : (
                        <RiFileTextLine className="w-5 h-5 text-app-text-secondary mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-app-text-primary mb-1">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-app-text-secondary">
                          {doc.type === "folder"
                            ? childCount > 0
                              ? tDocs("overview.shared.folderContains", { count: childCount })
                              : tDocs("overview.shared.emptyFolder")
                            : tDocs("overview.shared.updatedAt", {
                                value: formatDocDate(doc.updatedAt, locale),
                              })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Documents */}
        {recentDocs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-app-text-primary mb-4">
              {tDocs("overview.shared.recentTitle")}
            </h2>
            <div className="space-y-2">
              {recentDocs.map((doc) => {
                const parentDoc = doc.parentDocument
                  ? documents.find((d) => d._id === doc.parentDocument)
                  : null;

                return (
                  <div
                    key={doc._id}
                    onClick={() => handleSelectDoc(doc)}
                    className={docsListItemClassName}
                  >
                    {doc.type === "folder" ? (
                      <RiFolder3Line className="w-4 h-4 text-app-text-secondary" />
                    ) : (
                      <RiFileTextLine className="w-4 h-4 text-app-text-secondary" />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-app-text-primary">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-app-text-muted">
                        {tDocs("overview.shared.updatedAt", {
                          value: formatDocDate(doc.updatedAt, locale),
                        })}
                      </p>
                    </div>
                    {parentDoc && (
                      <span className="text-xs text-app-text-secondary bg-app-button-hover px-2 py-1 rounded">
                        {parentDoc.title}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-app-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-app-text-primary mb-2">
              {tDocs("overview.personal.emptyTitle")}
            </h3>
            <p className="text-app-text-muted mb-4">
              {tDocs("overview.personal.emptyDescription")}
            </p>
            <button
              onClick={handleCreateNewDoc}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-500"
            >
              <RiAddLine className="w-4 h-4" />
              {tDocs("overview.personal.emptyAction")}
            </button>
          </div>
        )}
      </div>
    </DocsPageFrame>
  );
}

function TeamDocsOverviewPage() {
  const tDocs = useTranslations("docs");
  const locale = useLocale();
  const { documents, createDoc, openDoc } = useDocs();

  // Split the overview into root-level docs and recent updates.
  const rootDocs = documents.filter((doc) => !doc.parentDocument);
  const recentDocs = [...documents]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  const handleSelectDoc = (doc: DocsDocument) => {
    openDoc(doc);
  };

  const handleCreateNewDoc = async () => {
    await createDoc(tDocs("creation.newTeamDoc"));
  };

  return (
    <DocsPageFrame>
      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-semibold text-app-text-primary">
            {tDocs("overview.team.title")}
          </h1>
          <p className="text-app-text-secondary">
            {tDocs("overview.team.subtitle", { count: documents.length })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={docsStaticCardClassName}>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded bg-sky-100 p-2 dark:bg-sky-900/20">
                <RiFileTextLine className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-2xl font-semibold text-app-text-primary">
                {documents.filter((doc) => doc.type === "document").length}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">{tDocs("overview.team.documentMetric")}</p>
          </div>

          <div className={docsStaticCardClassName}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
                <RiFolder3Line className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-semibold text-app-text-primary">
                {documents.filter((doc) => doc.type === "folder").length}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">{tDocs("overview.shared.folderMetric")}</p>
          </div>

          <button
            onClick={handleCreateNewDoc}
            className={docsActionCardClassName}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded bg-sky-100 p-2 dark:bg-sky-900/20">
                <RiAddLine className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-lg font-semibold text-app-text-primary">
                {tDocs("overview.shared.newDocTitle")}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">{tDocs("overview.team.newDocDescription")}</p>
          </button>
        </div>

        {/* Document Categories */}
        {rootDocs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-app-text-primary mb-4">
              {tDocs("overview.shared.categoryTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rootDocs.map((doc) => {
                const childCount = documents.filter(
                  (d) => d.parentDocument === doc._id
                ).length;
                return (
                  <div
                    key={doc._id}
                    onClick={() => handleSelectDoc(doc)}
                    className={docsActionCardClassName}
                  >
                    <div className="flex items-start gap-3">
                      {doc.type === "folder" ? (
                        <RiFolder3Line className="w-5 h-5 text-app-text-secondary mt-0.5" />
                      ) : (
                        <RiFileTextLine className="w-5 h-5 text-app-text-secondary mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-app-text-primary mb-1">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-app-text-secondary">
                          {doc.type === "folder"
                            ? childCount > 0
                              ? tDocs("overview.shared.folderContains", { count: childCount })
                              : tDocs("overview.shared.emptyFolder")
                            : tDocs("overview.shared.updatedAt", {
                                value: formatDocDate(doc.updatedAt, locale),
                              })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Documents */}
        {recentDocs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-app-text-primary mb-4">
              {tDocs("overview.shared.recentTitle")}
            </h2>
            <div className="space-y-2">
              {recentDocs.map((doc) => {
                const parentDoc = doc.parentDocument
                  ? documents.find((d) => d._id === doc.parentDocument)
                  : null;

                return (
                  <div
                    key={doc._id}
                    onClick={() => handleSelectDoc(doc)}
                    className={docsListItemClassName}
                  >
                    {doc.type === "folder" ? (
                      <RiFolder3Line className="w-4 h-4 text-app-text-secondary" />
                    ) : (
                      <RiFileTextLine className="w-4 h-4 text-app-text-secondary" />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-app-text-primary">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-app-text-muted">
                        {tDocs("overview.shared.updatedAt", {
                          value: formatDocDate(doc.updatedAt, locale),
                        })}
                      </p>
                    </div>
                    {parentDoc && (
                      <span className="text-xs text-app-text-secondary bg-app-button-hover px-2 py-1 rounded">
                        {parentDoc.title}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-app-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-app-text-primary mb-2">
              {tDocs("overview.team.emptyTitle")}
            </h3>
            <p className="text-app-text-muted mb-4">
              {tDocs("overview.team.emptyDescription")}
            </p>
            <button
              onClick={handleCreateNewDoc}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-500"
            >
              <RiAddLine className="w-4 h-4" />
              {tDocs("overview.team.emptyAction")}
            </button>
          </div>
        )}
      </div>
    </DocsPageFrame>
  );
}

function TeamPersonalDocsOverviewPage() {
  const tDocs = useTranslations("docs");
  const locale = useLocale();
  const { documents, createDoc, openDoc } = useDocs();

  // Split the overview into root-level docs and recent updates.
  const rootDocs = documents.filter((doc) => !doc.parentDocument);
  const recentDocs = [...documents]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  const handleSelectDoc = (doc: DocsDocument) => {
    openDoc(doc);
  };

  const handleCreateNewDoc = async () => {
    await createDoc(tDocs("creation.newPersonalDoc"));
  };

  return (
    <DocsPageFrame>
      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-semibold text-app-text-primary">
            {tDocs("overview.teamPersonal.title")}
          </h1>
          <p className="text-app-text-secondary">
            {tDocs("overview.teamPersonal.subtitle", { count: documents.length })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={docsStaticCardClassName}>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded bg-sky-100 p-2 dark:bg-sky-900/20">
                <RiFileTextLine className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-2xl font-semibold text-app-text-primary">
                {documents.filter((doc) => doc.type === "document").length}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">{tDocs("overview.teamPersonal.documentMetric")}</p>
          </div>

          <div className={docsStaticCardClassName}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
                <RiFolder3Line className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-semibold text-app-text-primary">
                {documents.filter((doc) => doc.type === "folder").length}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">{tDocs("overview.shared.folderMetric")}</p>
          </div>

          <button
            onClick={handleCreateNewDoc}
            className={docsActionCardClassName}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded bg-sky-100 p-2 dark:bg-sky-900/20">
                <RiAddLine className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-lg font-semibold text-app-text-primary">
                {tDocs("overview.shared.newDocTitle")}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">
              {tDocs("overview.teamPersonal.newDocDescription")}
            </p>
          </button>
        </div>

        {/* Document Categories */}
        {rootDocs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-app-text-primary mb-4">
              {tDocs("overview.shared.categoryTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rootDocs.map((doc) => {
                const childCount = documents.filter(
                  (d) => d.parentDocument === doc._id
                ).length;
                return (
                  <div
                    key={doc._id}
                    onClick={() => handleSelectDoc(doc)}
                    className={docsActionCardClassName}
                  >
                    <div className="flex items-start gap-3">
                      {doc.type === "folder" ? (
                        <RiFolder3Line className="w-5 h-5 text-app-text-secondary mt-0.5" />
                      ) : (
                        <RiFileTextLine className="w-5 h-5 text-app-text-secondary mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-app-text-primary mb-1">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-app-text-secondary">
                          {doc.type === "folder"
                            ? childCount > 0
                              ? tDocs("overview.shared.folderContains", { count: childCount })
                              : tDocs("overview.shared.emptyFolder")
                            : tDocs("overview.shared.updatedAt", {
                                value: formatDocDate(doc.updatedAt, locale),
                              })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Documents */}
        {recentDocs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-app-text-primary mb-4">
              {tDocs("overview.shared.recentTitle")}
            </h2>
            <div className="space-y-2">
              {recentDocs.map((doc) => {
                const parentDoc = doc.parentDocument
                  ? documents.find((d) => d._id === doc.parentDocument)
                  : null;

                return (
                  <div
                    key={doc._id}
                    onClick={() => handleSelectDoc(doc)}
                    className={docsListItemClassName}
                  >
                    {doc.type === "folder" ? (
                      <RiFolder3Line className="w-4 h-4 text-app-text-secondary" />
                    ) : (
                      <RiFileTextLine className="w-4 h-4 text-app-text-secondary" />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-app-text-primary">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-app-text-muted">
                        {tDocs("overview.shared.updatedAt", {
                          value: formatDocDate(doc.updatedAt, locale),
                        })}
                      </p>
                    </div>
                    {parentDoc && (
                      <span className="text-xs text-app-text-secondary bg-app-button-hover px-2 py-1 rounded">
                        {parentDoc.title}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-app-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-app-text-primary mb-2">
              {tDocs("overview.teamPersonal.emptyTitle")}
            </h3>
            <p className="text-app-text-muted mb-4">
              {tDocs("overview.teamPersonal.emptyDescription")}
            </p>
            <button
              onClick={handleCreateNewDoc}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-500"
            >
              <RiAddLine className="w-4 h-4" />
              {tDocs("overview.teamPersonal.emptyAction")}
            </button>
          </div>
        )}
      </div>
    </DocsPageFrame>
  );
}

function DocsOverviewPage({ context }: { context: DocumentContext }) {
  switch (context) {
    case "personal":
      return <PersonalDocsOverviewPage />;
    case "team":
      return <TeamDocsOverviewPage />;
    case "team-personal":
      return <TeamPersonalDocsOverviewPage />;
    default:
      return <PersonalDocsOverviewPage />;
  }
}

function DocsPageContent({ sourceSwitcher }: { sourceSwitcher?: React.ReactNode }) {
  const tDocs = useTranslations("docs");
  const { documents, openDocs, activeDocId, openDoc, isLoading, context } =
    useDocs();
  const [isExpanded, setIsExpanded] = useState(false);
  const sourceSwitcherBar = sourceSwitcher ? (
    <div className="relative z-20 flex items-center justify-end border-b border-app-border/80 bg-app-bg/80 px-4 py-3 backdrop-blur sm:px-6">
      {sourceSwitcher}
    </div>
  ) : null;

  const activeDoc = openDocs.find((doc) => doc._id === activeDocId);

  const handleSelectDoc = (doc: DocsDocument) => {
    openDoc(doc);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {sourceSwitcherBar}
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-app-bg">
          <AmbientGlow />
          <div className="relative z-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-sky-600"></div>
            <p className="text-app-text-muted">{tDocs("states.loadingPage")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeDocId && openDocs.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {sourceSwitcherBar}
        <div className="min-h-0 flex-1 bg-app-bg">
          <DocsOverviewPage context={context} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {sourceSwitcherBar}
      <div className="relative flex min-h-0 flex-1 bg-app-bg">
        <AmbientGlow />
        {/* Sidebar */}
        {!isExpanded && (
          <div className="relative z-10 w-64 flex-shrink-0">
            <DocsSidebar onSelectDoc={handleSelectDoc} />
          </div>
        )}

        {/* Main Content */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {/* Tabs */}
          <DocsTabs onSelectDoc={handleSelectDoc} />

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeDoc ? (
              <DocsEditor
                doc={activeDoc}
                isExpanded={isExpanded}
                onToggleExpand={handleToggleExpand}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-app-bg">
                <div className="text-center">
                  <div className="mb-4">
                    <svg
                      className="w-16 h-16 mx-auto text-app-text-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-app-text-primary mb-2">
                    {tDocs("welcome.title")}
                  </h3>
                  <p className="text-app-text-muted max-w-sm">
                    {documents.length === 0
                      ? tDocs("welcome.emptyDescription")
                      : tDocs("welcome.selectDescription")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage({
  workspaceId,
  workspaceType,
  userId,
  context,
  projectId,
}: DocsPageProps) {
  const tDocs = useTranslations("docs");
  const { currentWorkspace } = useWorkspace();
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);
  const defaultDocumentContext = useMemo(
    () =>
      resolveDocumentContext(context, workspaceType, currentWorkspace?.type),
    [context, currentWorkspace?.type, workspaceType],
  );
  const canSwitchSource = workspaceType === "TEAM" && !projectId;
  const [selectedContext, setSelectedContext] =
    useState<DocumentContext>(defaultDocumentContext);

  useEffect(() => {
    setSelectedContext(defaultDocumentContext);
  }, [defaultDocumentContext, workspaceId, projectId]);

  useEffect(() => {
    setActiveDocId(null);
  }, [projectId, selectedContext, setActiveDocId, workspaceId]);

  const activeContext = canSwitchSource ? selectedContext : defaultDocumentContext;
  const providerKey = `${workspaceId}-${workspaceType}-${activeContext}-${projectId ?? "root"}`;
  const teamDocSourceOptions: DocsSourceOption[] = [
    { value: "team", label: tDocs("source.team") },
    { value: "team-personal", label: tDocs("source.teamPersonal") },
  ];
  const sourceSwitcher = canSwitchSource ? (
    <DocsSourceSwitcher
      value={activeContext}
      options={teamDocSourceOptions}
      onValueChange={setSelectedContext}
    />
  ) : null;

  return (
    <DocsProvider
      key={providerKey}
      context={activeContext}
      workspaceId={workspaceId}
      workspaceType={workspaceType}
      userId={userId}
      projectId={projectId}
    >
      <DocsPageContent sourceSwitcher={sourceSwitcher} />
    </DocsProvider>
  );
}
