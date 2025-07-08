"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useDocStore } from "@/stores/doc-store";

// 定义文档类型 (与 Convex schema 匹配)
export interface ConvexDocument {
  _id: Id<"documents">;
  title: string;
  type: "document" | "folder";
  content?: string;
  description?: string;
  creatorId: string;
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  projectId?: string;
  parentDocument?: Id<"documents">;
  visibility: "PRIVATE" | "TEAM_READONLY" | "TEAM_EDITABLE" | "PUBLIC";
  allowedUsers?: string[];
  allowedEditors?: string[];
  isArchived: boolean;
  isPublished: boolean;
  isFavorite: boolean;
  coverImage?: string;
  icon?: string;
  tags?: string[];
  order?: number;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt?: number;
  canEdit?: boolean;
}

interface ConvexDocsContextType {
  documents: ConvexDocument[];
  openDocs: ConvexDocument[];
  activeDocId: string | null;
  openDoc: (doc: ConvexDocument) => void;
  closeDoc: (docId: string) => void;
  createDoc: (title: string, parentId?: string) => Promise<void>;
  createFolder: (title: string, parentId?: string) => Promise<void>;
  deleteDoc: (docId: string) => Promise<void>;
  updateDocTitle: (docId: string, title: string) => Promise<void>;
  updateDocContent: (docId: string, content: string) => Promise<void>;
  updateFolderDescription: (
    docId: string,
    description: string
  ) => Promise<void>;
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  userId: string;
  isLoading: boolean;
}

const ConvexDocsContext = createContext<ConvexDocsContextType | undefined>(
  undefined
);

export const useConvexDocs = () => {
  const context = useContext(ConvexDocsContext);
  if (!context) {
    throw new Error("useConvexDocs must be used within a ConvexDocsProvider");
  }
  return context;
};

interface ConvexDocsProviderProps {
  children: React.ReactNode;
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  userId: string;
}

export default function ConvexDocsProvider({
  children,
  workspaceId,
  workspaceType,
  userId,
}: ConvexDocsProviderProps) {
  const [openDocs, setOpenDocs] = useState<ConvexDocument[]>([]);
  const [docsRestored, setDocsRestored] = useState(false);

  // 从 Zustand store 获取 activeDocId 和 setActiveDocId
  const activeDocId = useDocStore((state) => state.activeDocId);
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);

  // 获取文档树结构
  const documents =
    useQuery(api.documents.getDocumentTree, {
      workspaceId,
      userId,
      workspaceType,
      parentDocument: undefined, // 获取根文档
      includeArchived: false,
    }) || [];

  // Convex mutations
  const createDocMutation = useMutation(api.documents.create);
  const createFolderMutation = useMutation(api.documents.createFolder);
  const updateDocMutation = useMutation(api.documents.update);
  const updateFolderDescMutation = useMutation(
    api.documents.updateFolderDescription
  );
  const deleteDocMutation = useMutation(api.documents.remove);
  const recordAccessMutation = useMutation(api.documents.recordDocumentAccess);

  const isLoading = documents === undefined;

  // 从 localStorage 恢复打开的文档
  useEffect(() => {
    if (isLoading || docsRestored) return;

    const storageKey = `convex-docs-open-${workspaceId}-${workspaceType}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const openDocIds = JSON.parse(stored);
        const restoredDocs = documents.filter((doc) =>
          openDocIds.includes(doc._id)
        );
        setOpenDocs(restoredDocs);

        // 只在没有激活文档时才设置第一个文档为激活状态
        if (restoredDocs.length > 0 && !activeDocId) {
          setActiveDocId(restoredDocs[0]._id);
        }
      } catch (error) {
        console.error("Failed to restore open docs:", error);
      }
    }
    setDocsRestored(true);
  }, [
    isLoading,
    documents,
    workspaceId,
    workspaceType,
    docsRestored,
    activeDocId,
    setActiveDocId,
  ]);

  // MARK: 同步打开文档列表
  useEffect(() => {
    if (!docsRestored) return;

    const currentOpenDocIds = openDocs.map((doc) => doc._id);
    const updatedOpenDocs = documents.filter((doc) =>
      currentOpenDocIds.includes(doc._id)
    );

    if (
      updatedOpenDocs.length !== openDocs.length ||
      !updatedOpenDocs.every((doc, index) => doc._id === openDocs[index]?._id)
    ) {
      setOpenDocs(updatedOpenDocs);
    }
  }, [documents, openDocs, docsRestored]);

  // MARK: 保存打开的文档到 localStorage
  useEffect(() => {
    if (!docsRestored) return;

    const storageKey = `convex-docs-open-${workspaceId}-${workspaceType}`;
    const openDocIds = openDocs.map((doc) => doc._id);
    localStorage.setItem(storageKey, JSON.stringify(openDocIds));
  }, [openDocs, workspaceId, workspaceType, docsRestored]);

  const openDoc = (doc: ConvexDocument) => {
    if (!openDocs.find((d) => d._id === doc._id)) {
      setOpenDocs([...openDocs, doc]);
    }
    setActiveDocId(doc._id);

    // 记录文档访问
    if (doc.type === "document") {
      recordAccessMutation({
        documentId: doc._id,
        userId,
        accessType: "view",
        source: "direct",
      });
    }
  };

  const closeDoc = (docId: string) => {
    setOpenDocs(openDocs.filter((d) => d._id !== docId));
    if (activeDocId === docId) {
      const remaining = openDocs.filter((d) => d._id !== docId);
      setActiveDocId(remaining.length > 0 ? remaining[0]._id : null);
    }
  };

  const createDoc = async (title: string, parentId?: string) => {
    const parentDocument = parentId ? (parentId as Id<"documents">) : undefined;

    const docId = await createDocMutation({
      title,
      type: "document",
      creatorId: userId,
      workspaceId,
      workspaceType,
      parentDocument,
      visibility: workspaceType === "PERSONAL" ? "PRIVATE" : "TEAM_READONLY",
      content: JSON.stringify([
        {
          id: "initial",
          type: "paragraph",
          content: [],
        },
      ]),
      order: documents.length,
    });

    // 自动打开新创建的文档
    const newDoc: ConvexDocument = {
      _id: docId,
      title,
      type: "document",
      content: JSON.stringify([
        {
          id: "initial",
          type: "paragraph",
          content: [],
        },
      ]),
      creatorId: userId,
      workspaceId,
      workspaceType,
      parentDocument,
      visibility: workspaceType === "PERSONAL" ? "PRIVATE" : "TEAM_READONLY",
      isArchived: false,
      isPublished: false,
      isFavorite: false,
      order: documents.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      canEdit: true,
    };

    openDoc(newDoc);
  };

  const createFolder = async (title: string, parentId?: string) => {
    const parentDocument = parentId ? (parentId as Id<"documents">) : undefined;

    await createFolderMutation({
      title,
      creatorId: userId,
      workspaceId,
      workspaceType,
      parentDocument,
      visibility: workspaceType === "PERSONAL" ? "PRIVATE" : "TEAM_READONLY",
      description: "",
      order: documents.length,
    });
  };

  const deleteDoc = async (docId: string) => {
    await deleteDocMutation({
      id: docId as Id<"documents">,
      userId,
    });
    closeDoc(docId);
  };

  const updateDocTitle = async (docId: string, title: string) => {
    await updateDocMutation({
      id: docId as Id<"documents">,
      userId,
      title,
    });
  };

  const updateDocContent = async (docId: string, content: string) => {
    await updateDocMutation({
      id: docId as Id<"documents">,
      userId,
      content,
    });
  };

  const updateFolderDescription = async (
    docId: string,
    description: string
  ) => {
    await updateFolderDescMutation({
      id: docId as Id<"documents">,
      userId,
      description,
    });
  };

  return (
    <ConvexDocsContext.Provider
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
        isLoading,
      }}
    >
      {children}
    </ConvexDocsContext.Provider>
  );
}
