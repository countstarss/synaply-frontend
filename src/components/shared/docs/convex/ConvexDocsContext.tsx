"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useDocStore } from "@/stores/doc-store";
import { useAuth } from "@/context/AuthContext";

// 定义文档上下文类型
export type DocumentContext =
  | "personal" // 个人工作区下的文档
  | "team" // 团队工作区下的团队文档
  | "team-personal"; // 团队工作区下的个人文档

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
  createDoc: (
    title: string,
    parentId?: string,
    projectId?: string
  ) => Promise<void>;
  createFolder: (
    title: string,
    parentId?: string,
    projectId?: string
  ) => Promise<void>;
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
  context: DocumentContext;
  projectId?: string;
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
  context: DocumentContext;
  projectId?: string; // 当在项目内创建文档时传递
}

export default function ConvexDocsProvider({
  children,
  workspaceId,
  workspaceType,
  userId,
  context,
  projectId,
}: ConvexDocsProviderProps) {
  const [openDocs, setOpenDocs] = useState<ConvexDocument[]>([]);
  const [docsRestored, setDocsRestored] = useState(false);
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const authenticatedUserId = session?.user?.id ?? userId;

  // 从 Zustand store 获取 activeDocId 和 setActiveDocId
  const activeDocId = useDocStore((state) => state.activeDocId);
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);

  // 根据上下文获取不同的文档查询参数
  const getQueryParams = (token: string) => {
    const baseParams = {
      workspaceId,
      accessToken: token,
      workspaceType,
      context,
      parentDocument: undefined,
      includeArchived: false,
    };

    switch (context) {
      case "personal":
        // 个人工作区：只查询属于当前用户的文档
        return {
          ...baseParams,
          workspaceType: "PERSONAL" as const,
        };

      case "team":
        // 团队工作区：查询团队可见的文档
        return {
          ...baseParams,
          workspaceType: "TEAM" as const,
          projectId, // 如果有项目ID，只查询该项目的文档
        };

      case "team-personal":
        // 团队工作区中的个人文档：查询当前工作区中属于当前用户的私有文档
        return {
          ...baseParams,
          workspaceType: "TEAM" as const,
          // context 参数会让后端过滤只有当前用户可见的私有文档
        };

      default:
        return baseParams;
    }
  };

  // 获取文档树结构
  const documentsResult = useQuery(
    api.documents.getDocumentTree,
    accessToken ? getQueryParams(accessToken) : "skip"
  );
  const documents = documentsResult || [];

  // Convex mutations
  const createDocMutation = useMutation(api.documents.create);
  const createFolderMutation = useMutation(api.documents.createFolder);
  const updateDocMutation = useMutation(api.documents.update);
  const updateFolderDescMutation = useMutation(
    api.documents.updateFolderDescription
  );
  const deleteDocMutation = useMutation(api.documents.remove);
  const recordAccessMutation = useMutation(api.documents.recordDocumentAccess);

  const isLoading = !accessToken || documentsResult === undefined;

  const getAccessTokenOrThrow = () => {
    if (!accessToken) {
      throw new Error("请先登录后再操作文档");
    }

    return accessToken;
  };

  // 根据上下文获取文档的可见性设置
  const getDocumentVisibility = (): ConvexDocument["visibility"] => {
    switch (context) {
      case "personal":
        return "PRIVATE"; // 个人工作区的文档默认私有

      case "team":
        return "TEAM_EDITABLE"; // 团队文档默认团队可编辑

      case "team-personal":
        return "PRIVATE"; // 团队中的个人文档默认私有

      default:
        return "PRIVATE";
    }
  };

  // 从 localStorage 恢复打开的文档
  useEffect(() => {
    if (isLoading || docsRestored) return;

    const storageKey = `convex-docs-open-${workspaceId}-${workspaceType}-${context}${
      projectId ? `-${projectId}` : ""
    }`;
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
    context,
    projectId,
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

    const storageKey = `convex-docs-open-${workspaceId}-${workspaceType}-${context}${
      projectId ? `-${projectId}` : ""
    }`;
    const openDocIds = openDocs.map((doc) => doc._id);
    localStorage.setItem(storageKey, JSON.stringify(openDocIds));
  }, [openDocs, workspaceId, workspaceType, context, projectId, docsRestored]);

  const openDoc = (doc: ConvexDocument) => {
    if (!openDocs.find((d) => d._id === doc._id)) {
      setOpenDocs([...openDocs, doc]);
    }
    setActiveDocId(doc._id);

    // 记录文档访问
    if (doc.type === "document" && accessToken) {
      recordAccessMutation({
        documentId: doc._id,
        accessToken,
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

  const createDoc = async (
    title: string,
    parentId?: string,
    docProjectId?: string
  ) => {
    if (!accessToken) {
      throw new Error("请先登录后再创建文档");
    }

    const parentDocument = parentId ? (parentId as Id<"documents">) : undefined;
    const finalProjectId = docProjectId || projectId; // 优先使用传入的项目ID

    const docId = await createDocMutation({
      title,
      type: "document",
      accessToken,
      workspaceId,
      workspaceType,
      projectId: finalProjectId,
      parentDocument,
      visibility: getDocumentVisibility(),
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
      creatorId: authenticatedUserId,
      workspaceId,
      workspaceType,
      projectId: finalProjectId,
      parentDocument,
      visibility: getDocumentVisibility(),
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

  const createFolder = async (
    title: string,
    parentId?: string,
    docProjectId?: string
  ) => {
    if (!accessToken) {
      throw new Error("请先登录后再创建文件夹");
    }

    const parentDocument = parentId ? (parentId as Id<"documents">) : undefined;
    const finalProjectId = docProjectId || projectId; // 优先使用传入的项目ID

    await createFolderMutation({
      title,
      accessToken,
      workspaceId,
      workspaceType,
      projectId: finalProjectId,
      parentDocument,
      visibility: getDocumentVisibility(),
      description: "",
      order: documents.length,
    });
  };

  const deleteDoc = async (docId: string) => {
    await deleteDocMutation({
      id: docId as Id<"documents">,
      accessToken: getAccessTokenOrThrow(),
    });
    closeDoc(docId);
  };

  const updateDocTitle = async (docId: string, title: string) => {
    await updateDocMutation({
      id: docId as Id<"documents">,
      accessToken: getAccessTokenOrThrow(),
      title,
    });
  };

  const updateDocContent = async (docId: string, content: string) => {
    await updateDocMutation({
      id: docId as Id<"documents">,
      accessToken: getAccessTokenOrThrow(),
      content,
    });
  };

  const updateFolderDescription = async (
    docId: string,
    description: string
  ) => {
    await updateFolderDescMutation({
      id: docId as Id<"documents">,
      accessToken: getAccessTokenOrThrow(),
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
        userId: authenticatedUserId,
        context,
        projectId,
        isLoading,
      }}
    >
      {children}
    </ConvexDocsContext.Provider>
  );
}
