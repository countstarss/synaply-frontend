"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useDocStore } from "@/stores/doc-store";
import { VisibilityType } from "@/types/prisma";
import {
  DocContext,
  DocKind,
  DocRecord,
  DocRevisionMutationResult,
  DocVisibility,
} from "@/lib/fetchers/doc";
import {
  useCreateDocMutation,
  useCreateDocRevisionMutation,
  useCreateFolderMutation,
  useDocsTree,
  useUpdateDocMetaMutation,
  useDeleteDocMutation,
} from "@/hooks/useDocApi";

export type DocumentContext = DocContext;
export type DocsDocument = DocRecord;

interface UpdateDocContentOptions {
  metadataSnapshot?: Partial<{
    title: string;
    icon: string;
    coverImage: string;
    visibility: DocVisibility;
  }>;
}

interface CreateDocOptions {
  parentId?: string;
  projectId?: string;
  issueId?: string;
  workflowId?: string;
  content?: string;
  kind?: DocKind;
  templateKey?: string;
}

interface DocsContextType {
  documents: DocsDocument[];
  openDocs: DocsDocument[];
  activeDocId: string | null;
  openDoc: (doc: DocsDocument) => void;
  closeDoc: (docId: string) => void;
  createDoc: (title: string, options?: CreateDocOptions) => Promise<DocsDocument>;
  createFolder: (
    title: string,
    parentId?: string,
    projectId?: string
  ) => Promise<DocsDocument>;
  deleteDoc: (docId: string) => Promise<void>;
  updateDocTitle: (docId: string, title: string) => Promise<DocsDocument>;
  updateDocContent: (
    docId: string,
    content: string,
    options?: UpdateDocContentOptions
  ) => Promise<DocRevisionMutationResult>;
  updateFolderDescription: (
    docId: string,
    description: string
  ) => Promise<DocsDocument>;
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  userId: string;
  context: DocumentContext;
  projectId?: string;
  isLoading: boolean;
}

const DocsContext = createContext<DocsContextType | undefined>(undefined);

export const useDocs = () => {
  const context = useContext(DocsContext);
  if (!context) {
    throw new Error("useDocs must be used within a DocsProvider");
  }
  return context;
};

interface DocsProviderProps {
  children: React.ReactNode;
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  userId: string;
  context: DocumentContext;
  projectId?: string;
}

function getEmptyDocContent() {
  return JSON.stringify([
    {
      id: "initial",
      type: "paragraph",
      content: [],
    },
  ]);
}

function normalizeOptionalId(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export default function DocsProvider({
  children,
  workspaceId,
  workspaceType,
  userId,
  context,
  projectId,
}: DocsProviderProps) {
  const [openDocs, setOpenDocs] = useState<DocsDocument[]>([]);
  const [docsRestored, setDocsRestored] = useState(false);
  const activeDocId = useDocStore((state) => state.activeDocId);
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);

  const docsQuery = useDocsTree(
    workspaceId,
    {
      context,
      workspaceType,
      projectId,
      includeArchived: false,
    },
    {
      enabled: !!workspaceId && !!userId,
    }
  );
  const createDocMutation = useCreateDocMutation();
  const createFolderMutation = useCreateFolderMutation();
  const updateDocMetaMutation = useUpdateDocMetaMutation();
  const createRevisionMutation = useCreateDocRevisionMutation();
  const deleteDocMutation = useDeleteDocMutation();

  const documents = useMemo(() => docsQuery.data ?? [], [docsQuery.data]);
  const isLoading = docsQuery.isLoading;

  const documentMap = useMemo(
    () => new Map(documents.map((doc) => [doc._id, doc])),
    [documents]
  );

  const getDocumentVisibility = (): DocVisibility => {
    switch (context) {
      case "personal":
        return VisibilityType.PRIVATE;
      case "team":
        return VisibilityType.TEAM_EDITABLE;
      case "team-personal":
        return VisibilityType.PRIVATE;
      default:
        return VisibilityType.PRIVATE;
    }
  };

  const replaceOpenDoc = (nextDoc: DocsDocument) => {
    setOpenDocs((current) =>
      current.map((doc) => (doc._id === nextDoc._id ? nextDoc : doc))
    );
  };

  useEffect(() => {
    if (isLoading || docsRestored) return;

    const storageKey = `docs-open-${workspaceId}-${workspaceType}-${context}${
      projectId ? `-${projectId}` : ""
    }`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const openDocIds = JSON.parse(stored) as string[];
        const restoredDocs = openDocIds
          .map((docId) => documentMap.get(docId))
          .filter(Boolean) as DocsDocument[];
        setOpenDocs(restoredDocs);

        if (restoredDocs.length > 0 && !activeDocId) {
          setActiveDocId(restoredDocs[0]._id);
        }
      } catch (error) {
        console.error("Failed to restore open docs:", error);
      }
    }
    setDocsRestored(true);
  }, [
    activeDocId,
    context,
    docsRestored,
    documentMap,
    isLoading,
    projectId,
    setActiveDocId,
    workspaceId,
    workspaceType,
  ]);

  useEffect(() => {
    if (!docsRestored) return;

    setOpenDocs((current) =>
      current
        .map((doc) => documentMap.get(doc._id) ?? doc)
        .filter((doc) => documentMap.has(doc._id))
    );
  }, [documentMap, docsRestored]);

  useEffect(() => {
    if (!docsRestored) return;

    const storageKey = `docs-open-${workspaceId}-${workspaceType}-${context}${
      projectId ? `-${projectId}` : ""
    }`;
    const openDocIds = openDocs.map((doc) => doc._id);
    localStorage.setItem(storageKey, JSON.stringify(openDocIds));
  }, [context, docsRestored, openDocs, projectId, workspaceId, workspaceType]);

  const openDoc = (doc: DocsDocument) => {
    setOpenDocs((current) => {
      if (current.some((item) => item._id === doc._id)) {
        return current;
      }

      return [...current, doc];
    });
    setActiveDocId(doc._id);
  };

  const closeDoc = (docId: string) => {
    setOpenDocs((current) => current.filter((doc) => doc._id !== docId));
    if (activeDocId === docId) {
      const remaining = openDocs.filter((doc) => doc._id !== docId);
      setActiveDocId(remaining.length > 0 ? remaining[0]._id : null);
    }
  };

  const createDoc = async (
    title: string,
    options?: CreateDocOptions
  ) => {
    const resolvedParentId = normalizeOptionalId(options?.parentId);
    const resolvedProjectId =
      normalizeOptionalId(options?.projectId) ?? normalizeOptionalId(projectId);
    const resolvedIssueId = normalizeOptionalId(options?.issueId);
    const resolvedWorkflowId = normalizeOptionalId(options?.workflowId);

    const createdDoc = await createDocMutation.mutateAsync({
      workspaceId,
      data: {
        title,
        parentDocument: resolvedParentId,
        projectId: resolvedProjectId,
        issueId: resolvedIssueId,
        workflowId: resolvedWorkflowId,
        visibility: getDocumentVisibility(),
        content: options?.content ?? getEmptyDocContent(),
        kind: options?.kind,
        templateKey: options?.templateKey,
        order: documents.length,
      },
    });

    openDoc(createdDoc);
    return createdDoc;
  };

  const createFolder = async (
    title: string,
    parentId?: string,
    docProjectId?: string
  ) => {
    const resolvedProjectId =
      normalizeOptionalId(docProjectId) ?? normalizeOptionalId(projectId);

    const createdFolder = await createFolderMutation.mutateAsync({
      workspaceId,
      data: {
        title,
        description: "",
        parentDocument: parentId,
        projectId: resolvedProjectId,
        visibility: getDocumentVisibility(),
        order: documents.length,
      },
    });

    return createdFolder;
  };

  const deleteDoc = async (docId: string) => {
    await deleteDocMutation.mutateAsync({
      workspaceId,
      docId,
    });
    closeDoc(docId);
  };

  const updateDocTitle = async (docId: string, title: string) => {
    const updatedDoc = await updateDocMetaMutation.mutateAsync({
      workspaceId,
      docId,
      data: {
        title,
      },
    });

    replaceOpenDoc(updatedDoc);
    return updatedDoc;
  };

  const updateDocContent = async (
    docId: string,
    content: string,
    options?: UpdateDocContentOptions
  ) => {
    const currentDoc = documentMap.get(docId) || openDocs.find((doc) => doc._id === docId);

    if (!currentDoc) {
      throw new Error("The document does not exist or has not finished loading yet.");
    }

    const metadataSnapshot = JSON.stringify({
      title: options?.metadataSnapshot?.title ?? currentDoc.title,
      icon: options?.metadataSnapshot?.icon ?? currentDoc.icon ?? null,
      coverImage:
        options?.metadataSnapshot?.coverImage ?? currentDoc.coverImage ?? null,
      visibility:
        options?.metadataSnapshot?.visibility ?? currentDoc.visibility,
    });

    const result = await createRevisionMutation.mutateAsync({
      workspaceId,
      docId,
      data: {
        clientMutationId:
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        baseRevisionId: currentDoc.latestRevisionId,
        contentSnapshot: content,
        metadataSnapshot,
        changeSource: "EDITOR",
      },
    });

    if (result.status === "applied" || result.status === "noop") {
      replaceOpenDoc(result.doc);
    }

    return result;
  };

  const updateFolderDescription = async (docId: string, description: string) => {
    const updatedDoc = await updateDocMetaMutation.mutateAsync({
      workspaceId,
      docId,
      data: {
        description,
      },
    });

    replaceOpenDoc(updatedDoc);
    return updatedDoc;
  };

  return (
    <DocsContext.Provider
      value={{
        documents,
        openDocs,
        activeDocId,
        openDoc,
        closeDoc,
        createDoc,
        createFolder,
        deleteDoc,
        updateDocTitle,
        updateDocContent,
        updateFolderDescription,
        workspaceId,
        workspaceType,
        userId,
        context,
        projectId,
        isLoading,
      }}
    >
      {children}
    </DocsContext.Provider>
  );
}
