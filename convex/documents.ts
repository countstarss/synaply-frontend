import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireAuthenticatedUserId } from "./auth";

// ============ 权限检查辅助函数 ============

async function isWorkspaceTeamMember(
  ctx: QueryCtx | MutationCtx,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const channels = await ctx.db
    .query("channels")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .filter((q) => q.eq(q.field("isArchived"), false))
    .collect();

  for (const channel of channels) {
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", channel._id).eq("userId", userId)
      )
      .first();

    if (membership) {
      return true;
    }
  }

  return false;
}

async function assertCanCreateDocument(
  ctx: QueryCtx | MutationCtx,
  {
    workspaceId,
    workspaceType,
    parentDocument,
    projectId,
  }: {
    workspaceId: string;
    workspaceType: "PERSONAL" | "TEAM";
    parentDocument?: Id<"documents">;
    projectId?: string;
  },
  userId: string
) {
  if (workspaceType === "TEAM") {
    const isMember = await isWorkspaceTeamMember(ctx, workspaceId, userId);
    if (!isMember) {
      throw new Error("权限不足");
    }
  }

  if (!parentDocument) {
    return;
  }

  const parent = await ctx.db.get(parentDocument);
  if (!parent) {
    throw new Error("父文档不存在");
  }

  if (
    parent.workspaceId !== workspaceId ||
    parent.workspaceType !== workspaceType
  ) {
    throw new Error("父文档不属于当前工作空间");
  }

  if ((parent.projectId ?? undefined) !== (projectId ?? undefined)) {
    throw new Error("父文档不属于当前项目");
  }

  const canEditParent = await canEditDocument(ctx, parent, userId);
  if (!canEditParent) {
    throw new Error("权限不足");
  }
}

function hasExplicitViewAccess(document: Doc<"documents">, userId: string) {
  return (
    document.allowedUsers?.includes(userId) ||
    document.allowedEditors?.includes(userId) ||
    false
  );
}

function hasExplicitEditAccess(document: Doc<"documents">, userId: string) {
  return document.allowedEditors?.includes(userId) || false;
}

// 检查用户是否有权限查看文档/文件夹
async function canViewDocument(
  ctx: QueryCtx | MutationCtx,
  document: Doc<"documents">,
  userId: string
): Promise<boolean> {
  // 创建者始终可以查看
  if (document.creatorId === userId) {
    return true;
  }

  // 根据可见性设置检查权限
  switch (document.visibility) {
    case "PRIVATE":
      return hasExplicitViewAccess(document, userId);

    case "TEAM_READONLY":
    case "TEAM_EDITABLE":
      if (hasExplicitViewAccess(document, userId)) {
        return true;
      }

      if (document.workspaceType !== "TEAM") {
        return false;
      }

      return isWorkspaceTeamMember(ctx, document.workspaceId, userId);

    case "PUBLIC":
      return true;

    default:
      return false;
  }
}

// 检查用户是否有权限编辑文档/文件夹
async function canEditDocument(
  ctx: QueryCtx | MutationCtx,
  document: Doc<"documents">,
  userId: string
): Promise<boolean> {
  // 创建者始终可以编辑
  if (document.creatorId === userId) {
    return true;
  }

  // 根据可见性设置检查编辑权限
  switch (document.visibility) {
    case "PRIVATE":
      return hasExplicitEditAccess(document, userId);

    case "TEAM_READONLY":
      // 只有创建者可以编辑
      return false;

    case "TEAM_EDITABLE":
      if (hasExplicitEditAccess(document, userId)) {
        return true;
      }

      if (document.workspaceType !== "TEAM") {
        return false;
      }

      return isWorkspaceTeamMember(ctx, document.workspaceId, userId);

    case "PUBLIC":
      // 公开文档的编辑权限由allowedEditors控制
      return hasExplicitEditAccess(document, userId);

    default:
      return false;
  }
}

// ============ 文档管理功能 ============

// MARK: 创建文档
export const create = mutation({
  args: {
    title: v.string(),
    type: v.optional(v.union(v.literal("document"), v.literal("folder"))),
    content: v.optional(v.string()),
    description: v.optional(v.string()),
    accessToken: v.string(),
    workspaceId: v.string(),
    workspaceType: v.union(v.literal("PERSONAL"), v.literal("TEAM")),
    projectId: v.optional(v.string()), // 后端项目ID引用
    parentDocument: v.optional(v.id("documents")),
    visibility: v.optional(
      v.union(
        v.literal("PRIVATE"),
        v.literal("TEAM_READONLY"),
        v.literal("TEAM_EDITABLE"),
        v.literal("PUBLIC")
      )
    ),
    allowedUsers: v.optional(v.array(v.string())),
    allowedEditors: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);

    // 设置默认值
    const docType = args.type || "document";
    const visibility =
      args.visibility ??
      (args.workspaceType === "PERSONAL" ? "PRIVATE" : "TEAM_READONLY");

    // 验证：文件夹不应该有内容，文档不应该有描述
    if (docType === "folder" && args.content) {
      throw new Error("文件夹不能包含内容");
    }
    if (docType === "document" && args.description) {
      throw new Error("文档不能有描述，请使用内容字段");
    }

    await assertCanCreateDocument(
      ctx,
      {
        workspaceId: args.workspaceId,
        workspaceType: args.workspaceType,
        parentDocument: args.parentDocument,
        projectId: args.projectId,
      },
      currentUserId
    );

    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      type: docType,
      content: docType === "document" ? args.content : undefined,
      description: docType === "folder" ? args.description : undefined,
      creatorId: currentUserId,
      workspaceId: args.workspaceId,
      workspaceType: args.workspaceType,
      projectId: args.projectId,
      parentDocument: args.parentDocument,
      visibility,
      allowedUsers: args.allowedUsers,
      allowedEditors: args.allowedEditors,
      isArchived: false,
      isPublished: false,
      isFavorite: false,
      coverImage: undefined,
      icon: undefined,
      tags: args.tags,
      order: args.order ?? 0,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    });

    // 记录文档访问
    await ctx.db.insert("documentAccess", {
      documentId,
      userId: currentUserId,
      accessType: "edit",
      accessedAt: now,
      source: "direct",
    });

    return documentId;
  },
});

// MARK: 创建文件夹 (便捷函数)
export const createFolder = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    accessToken: v.string(),
    workspaceId: v.string(),
    workspaceType: v.union(v.literal("PERSONAL"), v.literal("TEAM")),
    projectId: v.optional(v.string()), // 后端项目ID引用
    parentDocument: v.optional(v.id("documents")),
    visibility: v.optional(
      v.union(
        v.literal("PRIVATE"),
        v.literal("TEAM_READONLY"),
        v.literal("TEAM_EDITABLE"),
        v.literal("PUBLIC")
      )
    ),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const defaultVisibility =
      args.visibility ??
      (args.workspaceType === "PERSONAL" ? "PRIVATE" : "TEAM_READONLY");

    await assertCanCreateDocument(
      ctx,
      {
        workspaceId: args.workspaceId,
        workspaceType: args.workspaceType,
        parentDocument: args.parentDocument,
        projectId: args.projectId,
      },
      currentUserId
    );

    return await ctx.db.insert("documents", {
      title: args.title,
      type: "folder",
      description: args.description,
      creatorId: currentUserId,
      workspaceId: args.workspaceId,
      workspaceType: args.workspaceType,
      projectId: args.projectId,
      parentDocument: args.parentDocument,
      visibility: defaultVisibility,
      content: undefined,
      isArchived: false,
      isPublished: false,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: args.order ?? 0,
    });
  },
});

// MARK: 更新文件夹描述
export const updateFolderDescription = mutation({
  args: {
    id: v.id("documents"),
    accessToken: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("文档不存在");
    }

    if (document.type !== "folder") {
      throw new Error("只能更新文件夹的描述");
    }

    // 检查编辑权限
    const hasEditPermission = await canEditDocument(
      ctx,
      document,
      currentUserId
    );
    if (!hasEditPermission) {
      throw new Error("权限不足");
    }

    await ctx.db.patch(args.id, {
      description: args.description,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// MARK: 获取文档详情
export const getById = query({
  args: {
    documentId: v.id("documents"),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return null;
    }

    // 检查权限
    const hasViewPermission = await canViewDocument(
      ctx,
      document,
      currentUserId
    );
    if (!hasViewPermission) {
      return null;
    }

    return {
      ...document,
      canEdit: await canEditDocument(ctx, document, currentUserId),
    };
  },
});

// MARK: 获取工作空间文档树结构
export const getDocumentTree = query({
  args: {
    workspaceId: v.string(),
    accessToken: v.string(),
    workspaceType: v.optional(
      v.union(v.literal("PERSONAL"), v.literal("TEAM"))
    ),
    context: v.optional(
      v.union(
        v.literal("personal"),
        v.literal("team"),
        v.literal("team-personal")
      )
    ),
    projectId: v.optional(v.string()), // 项目ID过滤
    parentDocument: v.optional(v.id("documents")),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    // 根据条件构建查询
    let documents;
    if (args.workspaceType) {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_workspace_type", (q) =>
          q
            .eq("workspaceId", args.workspaceId)
            .eq("workspaceType", args.workspaceType!)
        )
        .collect();
    } else {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();
    }

    // 应用过滤条件
    if (!args.includeArchived) {
      documents = documents.filter((doc) => !doc.isArchived);
    }

    // 过滤父文档
    if (args.parentDocument !== undefined) {
      documents = documents.filter(
        (doc) =>
          (args.parentDocument === null && !doc.parentDocument) ||
          doc.parentDocument === args.parentDocument
      );
    }

    // 项目ID过滤
    if (args.projectId) {
      documents = documents.filter((doc) => doc.projectId === args.projectId);
    }

    // 根据上下文进行过滤
    if (args.context) {
      switch (args.context) {
        case "personal":
          // 个人工作区：只显示用户自己创建的文档
          documents = documents.filter(
            (doc) =>
              doc.creatorId === currentUserId && doc.workspaceType === "PERSONAL"
          );
          break;

        case "team":
          // 团队工作区的团队文档：显示团队共享的文档
          documents = documents.filter(
            (doc) =>
              doc.workspaceType === "TEAM" &&
              (doc.visibility === "TEAM_READONLY" ||
                doc.visibility === "TEAM_EDITABLE" ||
                doc.visibility === "PUBLIC")
          );
          break;

        case "team-personal":
          // 团队工作区的个人文档：只显示用户自己创建的私有文档
          documents = documents.filter(
            (doc) =>
              doc.creatorId === currentUserId &&
              doc.workspaceType === "TEAM" &&
              doc.visibility === "PRIVATE"
          );
          break;
      }
    }

    // 权限过滤
    const accessibleDocuments = [];
    for (const doc of documents) {
      const hasAccess = await canViewDocument(ctx, doc, currentUserId);
      if (hasAccess) {
        accessibleDocuments.push({
          ...doc,
          canEdit: await canEditDocument(ctx, doc, currentUserId),
        });
      }
    }

    // 排序：先文件夹，后文档，然后按order和创建时间排序
    const sortedDocs = accessibleDocuments.sort((a, b) => {
      // 文件夹优先
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;

      // 按order排序
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;

      // 最后按创建时间排序
      return a.createdAt - b.createdAt;
    });

    return sortedDocs;
  },
});

// MARK: 获取文件夹子项
export const getFolderChildren = query({
  args: {
    folderId: v.id("documents"),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.type !== "folder") {
      throw new Error("文件夹不存在");
    }

    // 检查权限
    const hasViewPermission = await canViewDocument(
      ctx,
      folder,
      currentUserId
    );
    if (!hasViewPermission) {
      throw new Error("权限不足");
    }

    const children = await ctx.db
      .query("documents")
      .withIndex("by_parent", (q) => q.eq("parentDocument", args.folderId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    // 权限过滤和排序
    const accessibleChildren = [];
    for (const child of children) {
      const hasAccess = await canViewDocument(ctx, child, currentUserId);
      if (hasAccess) {
        accessibleChildren.push({
          ...child,
          canEdit: await canEditDocument(ctx, child, currentUserId),
        });
      }
    }

    return accessibleChildren.sort((a, b) => {
      // 文件夹优先
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;

      // 按order排序
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;

      return a.createdAt - b.createdAt;
    });
  },
});

// MARK: 更新文档
export const update = mutation({
  args: {
    id: v.id("documents"),
    accessToken: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    isFavorite: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    projectId: v.optional(v.string()), // 后端项目ID
    visibility: v.optional(
      v.union(
        v.literal("PRIVATE"),
        v.literal("TEAM_READONLY"),
        v.literal("TEAM_EDITABLE"),
        v.literal("PUBLIC")
      )
    ),
    allowedUsers: v.optional(v.array(v.string())),
    allowedEditors: v.optional(v.array(v.string())),
    saveVersion: v.optional(v.boolean()),
    changeDescription: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const { id, accessToken: _accessToken, saveVersion, changeDescription, ...updateData } = args;

    const existingDocument = await ctx.db.get(id);
    if (!existingDocument) {
      throw new Error("文档不存在");
    }

    // 检查编辑权限
    const hasEditPermission = await canEditDocument(
      ctx,
      existingDocument,
      currentUserId
    );
    if (!hasEditPermission) {
      throw new Error("权限不足");
    }

    // 验证更新内容的合法性
    if (existingDocument.type === "folder" && args.content !== undefined) {
      throw new Error("文件夹不能包含内容");
    }
    if (
      existingDocument.type === "document" &&
      args.description !== undefined
    ) {
      throw new Error("文档不能有描述");
    }

    const now = Date.now();

    // 如果需要保存版本历史 (仅对文档)
    if (
      saveVersion &&
      existingDocument.type === "document" &&
      (updateData.content !== undefined || updateData.title !== undefined)
    ) {
      // 获取最新版本号
      const latestVersion = await ctx.db
        .query("documentVersions")
        .withIndex("by_document", (q) => q.eq("documentId", id))
        .order("desc")
        .first();

      const newVersion = (latestVersion?.version || 0) + 1;

      // 保存版本历史
      await ctx.db.insert("documentVersions", {
        documentId: id,
        version: newVersion,
        content: updateData.content || existingDocument.content || "",
        title: updateData.title || existingDocument.title,
        createdBy: currentUserId,
        changeDescription: changeDescription,
        createdAt: now,
      });
    }

    // 更新文档
    await ctx.db.patch(id, {
      ...updateData,
      updatedAt: now,
    });

    // 记录编辑操作
    await ctx.db.insert("documentAccess", {
      documentId: id,
      userId: currentUserId,
      accessType: "edit",
      accessedAt: now,
      source: "direct",
    });

    return id;
  },
});

// MARK: 获取工作空间文档列表 (兼容原有接口)
export const getByWorkspace = query({
  args: {
    workspaceId: v.string(),
    accessToken: v.string(),
    workspaceType: v.optional(
      v.union(v.literal("PERSONAL"), v.literal("TEAM"))
    ),
    projectId: v.optional(v.string()), // 后端项目ID
    parentDocument: v.optional(v.id("documents")),
    includeArchived: v.optional(v.boolean()),
    onlyFavorites: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const limit = args.limit ?? 100;

    // 根据条件构建查询
    let documents;
    if (args.workspaceType) {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_workspace_type", (q) =>
          q
            .eq("workspaceId", args.workspaceId)
            .eq("workspaceType", args.workspaceType!)
        )
        .collect();
    } else {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();
    }

    // 应用过滤条件
    if (!args.includeArchived) {
      documents = documents.filter((doc) => !doc.isArchived);
    }

    if (args.onlyFavorites) {
      documents = documents.filter(
        (doc) => doc.isFavorite && doc.creatorId === currentUserId
      );
    }

    if (args.parentDocument !== undefined) {
      documents = documents.filter(
        (doc) =>
          (args.parentDocument === null && !doc.parentDocument) ||
          doc.parentDocument === args.parentDocument
      );
    }

    if (args.projectId) {
      documents = documents.filter((doc) => doc.projectId === args.projectId);
    }

    // 权限过滤
    const accessibleDocuments = [];
    for (const doc of documents) {
      const hasAccess = await canViewDocument(ctx, doc, currentUserId);
      if (hasAccess) {
        accessibleDocuments.push({
          ...doc,
          canEdit: await canEditDocument(ctx, doc, currentUserId),
        });
      }
    }

    // 排序并限制数量
    const sortedDocs = accessibleDocuments
      .sort((a, b) => {
        // 文件夹优先
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;

        // 按order排序
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;

        return b.updatedAt - a.updatedAt;
      })
      .slice(0, limit);

    return sortedDocs;
  },
});

// MARK: 获取用户的文档列表
export const getByCreator = query({
  args: {
    accessToken: v.string(),
    workspaceId: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const limit = args.limit ?? 100;

    const query = ctx.db
      .query("documents")
      .withIndex("by_creator", (q) => q.eq("creatorId", currentUserId));

    const documents = await query.collect();

    // 应用过滤条件
    let filteredDocs = documents;

    if (args.workspaceId) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.workspaceId === args.workspaceId
      );
    }

    if (!args.includeArchived) {
      filteredDocs = filteredDocs.filter((doc) => !doc.isArchived);
    }

    return filteredDocs
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  },
});

// MARK: 获取最近访问的文档
export const getRecentlyAccessed = query({
  args: {
    accessToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const limit = args.limit ?? 20;

    // 获取最近访问记录
    const recentAccesses = await ctx.db
      .query("documentAccess")
      .withIndex("by_recent", (q) => q.eq("userId", currentUserId))
      .order("desc")
      .take(limit * 2); // 多取一些，因为可能有重复文档

    // 去重并获取文档详情
    const documentIds: Id<"documents">[] = Array.from(
      new Set(recentAccesses.map((access) => access.documentId))
    );
    const documents = [];

    for (const docId of documentIds.slice(0, limit)) {
      const doc = await ctx.db.get(docId);
      if (doc && doc.type && !doc.isArchived) {
        // 确保是文档类型且有 type 字段
        const hasAccess = await canViewDocument(ctx, doc, currentUserId);
        if (hasAccess) {
          documents.push({
            ...doc,
            canEdit: await canEditDocument(ctx, doc, currentUserId),
            lastAccessedAt: recentAccesses.find(
              (access) => access.documentId === docId
            )?.accessedAt,
          });
        }
      }
    }

    return documents;
  },
});

// MARK: 搜索文档和文件夹
export const search = query({
  args: {
    query: v.string(),
    accessToken: v.string(),
    workspaceId: v.optional(v.string()),
    projectId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    type: v.optional(v.union(v.literal("document"), v.literal("folder"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const limit = args.limit ?? 50;
    const searchTerm = args.query.toLowerCase();

    // 构建基础查询
    let documents;
    if (args.projectId) {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
    } else if (args.workspaceId) {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_workspace", (q) =>
          q.eq("workspaceId", args.workspaceId!)
        )
        .collect();
    } else {
      // 搜索用户有权限访问的所有文档
      documents = await ctx.db.query("documents").collect();
    }

    // 过滤已归档文档
    documents = documents.filter((doc) => !doc.isArchived);

    // 类型过滤
    if (args.type) {
      documents = documents.filter((doc) => doc.type === args.type);
    }

    // 文本搜索过滤
    const textFilteredDocs = documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchTerm) ||
        (doc.content && doc.content.toLowerCase().includes(searchTerm)) ||
        (doc.description &&
          doc.description.toLowerCase().includes(searchTerm)) ||
        (doc.tags &&
          doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
    );

    // 标签过滤
    let tagFilteredDocs = textFilteredDocs;
    if (args.tags && args.tags.length > 0) {
      tagFilteredDocs = textFilteredDocs.filter(
        (doc) => doc.tags && args.tags!.some((tag) => doc.tags!.includes(tag))
      );
    }

    // 权限过滤
    const accessibleDocuments = [];
    for (const doc of tagFilteredDocs) {
      const hasAccess = await canViewDocument(ctx, doc, currentUserId);
      if (hasAccess) {
        accessibleDocuments.push({
          ...doc,
          canEdit: await canEditDocument(ctx, doc, currentUserId),
        });
      }
    }

    return accessibleDocuments
      .sort((a, b) => {
        // 文件夹优先
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;

        return b.updatedAt - a.updatedAt;
      })
      .slice(0, limit);
  },
});

// MARK: 分享文档给指定用户
export const shareDocument = mutation({
  args: {
    documentId: v.id("documents"),
    accessToken: v.string(),
    sharedWith: v.string(),
    permission: v.union(
      v.literal("view"),
      v.literal("edit"),
      v.literal("comment")
    ),
    message: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("文档不存在");
    }

    // 检查分享者是否有权限
    const canShare = await canEditDocument(ctx, document, currentUserId);
    if (!canShare && document.creatorId !== currentUserId) {
      throw new Error("权限不足");
    }

    const now = Date.now();

    // 创建分享记录
    const shareId = await ctx.db.insert("documentShares", {
      documentId: args.documentId,
      sharedBy: currentUserId,
      sharedWith: args.sharedWith,
      permission: args.permission,
      sharedAt: now,
      isActive: true,
      message: args.message,
      expiresAt: args.expiresAt,
    });

    // 创建通知
    await ctx.db.insert("notifications", {
      userId: args.sharedWith,
      type: "document_shared",
      title: `文档分享`,
      content: `文档 "${document.title}" 已与你分享`,
      documentId: args.documentId,
      isRead: false,
      createdAt: now,
    });

    return shareId;
  },
});

// MARK: 归档文档/文件夹
export const archive = mutation({
  args: {
    id: v.id("documents"),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("文档不存在");
    }

    // 检查权限
    const canEdit = await canEditDocument(ctx, existingDocument, currentUserId);
    if (!canEdit) {
      throw new Error("权限不足");
    }

    await ctx.db.patch(args.id, {
      isArchived: true,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// MARK: 恢复文档/文件夹
export const restore = mutation({
  args: {
    id: v.id("documents"),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("文档不存在");
    }

    if (existingDocument.creatorId !== currentUserId) {
      throw new Error("权限不足");
    }

    await ctx.db.patch(args.id, {
      isArchived: false,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// MARK: 删除文档/文件夹
export const remove = mutation({
  args: {
    id: v.id("documents"),
    accessToken: v.string(),
    force: v.optional(v.boolean()), // 强制删除，不检查子项
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("文档不存在");
    }

    if (existingDocument.creatorId !== currentUserId) {
      throw new Error("权限不足");
    }

    // 如果是文件夹且不是强制删除，检查是否有子项
    if (existingDocument.type === "folder" && !args.force) {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_parent", (q) => q.eq("parentDocument", args.id))
        .collect();

      if (children.length > 0) {
        throw new Error("文件夹不为空，无法删除");
      }
    }

    // 删除相关数据
    const accessRecords = await ctx.db
      .query("documentAccess")
      .withIndex("by_document", (q) => q.eq("documentId", args.id))
      .collect();

    for (const record of accessRecords) {
      await ctx.db.delete(record._id);
    }

    const shareRecords = await ctx.db
      .query("documentShares")
      .withIndex("by_document", (q) => q.eq("documentId", args.id))
      .collect();

    for (const record of shareRecords) {
      await ctx.db.delete(record._id);
    }

    const versionRecords = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.id))
      .collect();

    for (const record of versionRecords) {
      await ctx.db.delete(record._id);
    }

    await ctx.db.delete(args.id);

    return args.id;
  },
});

// MARK: 获取回收站文档
export const getTrash = query({
  args: {
    accessToken: v.string(),
    workspaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const query = ctx.db
      .query("documents")
      .withIndex("by_creator_archived", (q) =>
        q.eq("creatorId", currentUserId).eq("isArchived", true)
      );

    const documents = await query.collect();

    // 如果指定了工作空间，则过滤
    const filteredDocs = args.workspaceId
      ? documents.filter((doc) => doc.workspaceId === args.workspaceId)
      : documents;

    return filteredDocs.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// MARK: 移除图标
export const removeIcon = mutation({
  args: {
    id: v.id("documents"),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("文档不存在");
    }

    const canEdit = await canEditDocument(ctx, existingDocument, currentUserId);
    if (!canEdit) {
      throw new Error("权限不足");
    }

    await ctx.db.patch(args.id, {
      icon: undefined,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// MARK: 记录文档访问
export const recordDocumentAccess = mutation({
  args: {
    documentId: v.id("documents"),
    accessToken: v.string(),
    accessType: v.union(
      v.literal("view"),
      v.literal("edit"),
      v.literal("comment")
    ),
    source: v.optional(
      v.union(
        v.literal("direct"),
        v.literal("search"),
        v.literal("share"),
        v.literal("project")
      )
    ),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("文档不存在");
    }

    const hasAccess =
      args.accessType === "edit"
        ? await canEditDocument(ctx, document, currentUserId)
        : await canViewDocument(ctx, document, currentUserId);

    if (!hasAccess) {
      throw new Error("权限不足");
    }

    const now = Date.now();

    // 更新文档最后访问时间
    await ctx.db.patch(args.documentId, {
      lastAccessedAt: now,
    });

    // 记录访问历史
    await ctx.db.insert("documentAccess", {
      documentId: args.documentId,
      userId: currentUserId,
      accessType: args.accessType,
      accessedAt: now,
      source: args.source || "direct",
    });

    return args.documentId;
  },
});

// MARK: 移除封面图片
export const removeCoverImage = mutation({
  args: {
    id: v.id("documents"),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthenticatedUserId(args.accessToken);
    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("文档不存在");
    }

    const canEdit = await canEditDocument(ctx, existingDocument, currentUserId);
    if (!canEdit) {
      throw new Error("权限不足");
    }

    await ctx.db.patch(args.id, {
      coverImage: undefined,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
