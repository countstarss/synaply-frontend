import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============ 聊天系统相关表 ============

  // 用户基本信息表 - 只保留聊天必需的信息，与后端用户ID同步
  users: defineTable({
    userId: v.string(), // 对应后端 User.id
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_online", ["isOnline"]),

  // 频道表 - 支持多种类型的聊天
  channels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("team_public"), // 团队公开频道
      v.literal("team_private"), // 团队私有频道
      v.literal("group"), // 群聊
      v.literal("direct") // 私聊
    ),
    chatType: v.union(
      v.literal("text"),
      v.literal("voice"),
      v.literal("video")
    ),
    // 引用后端ID，不重复存储详细信息
    workspaceId: v.optional(v.string()), // 对应后端 Workspace.id
    teamId: v.optional(v.string()), // 对应后端 Team.id
    creatorId: v.string(), // 对应后端 User.id
    isDefault: v.boolean(),
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_workspace", ["workspaceId"])
    .index("by_team", ["teamId"])
    .index("by_creator", ["creatorId"])
    .index("by_default", ["isDefault"])
    .index("by_archived", ["isArchived"]),

  // 频道成员表 - 管理用户与频道的关系
  channelMembers: defineTable({
    channelId: v.id("channels"),
    userId: v.string(), // 对应后端 User.id
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
    isMuted: v.boolean(),
    notificationLevel: v.union(
      v.literal("all"),
      v.literal("mentions"),
      v.literal("none")
    ),
  })
    .index("by_channel", ["channelId"])
    .index("by_user", ["userId"])
    .index("by_channel_user", ["channelId", "userId"])
    .index("by_role", ["role"]),

  // 消息表 - 支持多种消息类型
  messages: defineTable({
    content: v.string(),
    userId: v.string(), // 对应后端 User.id
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    channelId: v.id("channels"),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("file"),
      v.literal("system"),
      v.literal("mention")
    ),
    parentMessageId: v.optional(v.id("messages")), // 支持回复
    mentionedUsers: v.optional(v.array(v.string())), // @用户ID列表
    attachments: v.optional(
      v.array(
        v.object({
          url: v.string(),
          name: v.string(),
          size: v.number(),
          type: v.string(),
        })
      )
    ),
    isEdited: v.boolean(),
    isDeleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_channel", ["channelId", "createdAt"])
    .index("by_user", ["userId"])
    .index("by_parent", ["parentMessageId"])
    .index("by_type", ["messageType"])
    .index("by_deleted", ["isDeleted"]),

  // 消息反应表
  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.string(), // 对应后端 User.id
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_message_user", ["messageId", "userId"]),

  // 私聊会话表
  directConversations: defineTable({
    participants: v.array(v.string()), // 两个参与者的后端User.id
    lastMessageAt: v.number(),
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_participants", ["participants"])
    .index("by_lastMessage", ["lastMessageAt"])
    .index("by_archived", ["isArchived"]),

  // 通知表
  notifications: defineTable({
    userId: v.string(), // 对应后端 User.id
    type: v.union(
      v.literal("message"),
      v.literal("mention"),
      v.literal("channel_invite"),
      v.literal("team_invite"),
      v.literal("document_shared"),
      v.literal("document_updated"),
      v.literal("project_updated") // 新增：项目更新通知
    ),
    title: v.string(),
    content: v.string(),
    // 关联资源
    channelId: v.optional(v.id("channels")),
    messageId: v.optional(v.id("messages")),
    documentId: v.optional(v.id("documents")),
    // 后端资源引用
    projectId: v.optional(v.string()), // 对应后端 Project.id
    workspaceId: v.optional(v.string()), // 对应后端 Workspace.id
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_type", ["type"])
    .index("by_project", ["projectId"])
    .index("by_workspace", ["workspaceId"]),

  // ============ 文档系统相关表 ============

  // 文档表 - 增强版，与后端项目系统集成
  documents: defineTable({
    title: v.string(),
    content: v.optional(v.string()), // JSON格式内容，存储为string
    creatorId: v.string(), // 对应后端 User.id

    // 关联后端资源（不重复存储详细信息）
    workspaceId: v.string(), // 对应后端 Workspace.id
    workspaceType: v.union(v.literal("PERSONAL"), v.literal("TEAM")), // 与后端 WorkspaceType 一致
    projectId: v.optional(v.string()), // 对应后端 Project.id
    parentDocument: v.optional(v.id("documents")),

    // 权限控制 - 与后端 VisibilityType 对应
    visibility: v.union(
      v.literal("PRIVATE"), // 对应后端 PRIVATE
      v.literal("TEAM_READONLY"), // 对应后端 TEAM_READONLY
      v.literal("TEAM_EDITABLE"), // 对应后端 TEAM_EDITABLE
      v.literal("PUBLIC") // 对应后端 PUBLIC（预留）
    ),
    // 扩展权限：指定用户访问
    allowedUsers: v.optional(v.array(v.string())), // User.id 列表
    allowedEditors: v.optional(v.array(v.string())), // User.id 列表

    // 状态信息
    isArchived: v.boolean(),
    isPublished: v.boolean(),
    isFavorite: v.boolean(),

    // 元数据
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // 时间戳 - 统一使用数字时间戳
    createdAt: v.number(),
    updatedAt: v.number(),
    lastAccessedAt: v.optional(v.number()),
  })
    .index("by_creator", ["creatorId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_type", ["workspaceId", "workspaceType"])
    .index("by_project", ["projectId"])
    .index("by_creator_parent", ["creatorId", "parentDocument"])
    .index("by_workspace_archived", ["workspaceId", "isArchived"])
    .index("by_creator_archived", ["creatorId", "isArchived"])
    .index("by_visibility", ["visibility"])
    .index("by_published", ["isPublished"])
    .index("by_favorite", ["creatorId", "isFavorite"]),

  // 文档访问记录表 - 记录用户访问文档的历史
  documentAccess: defineTable({
    documentId: v.id("documents"),
    userId: v.string(), // 对应后端 User.id
    accessType: v.union(
      v.literal("view"),
      v.literal("edit"),
      v.literal("comment")
    ),
    accessedAt: v.number(),
    // 可选：记录访问来源
    source: v.optional(
      v.union(
        v.literal("direct"), // 直接访问
        v.literal("search"), // 搜索访问
        v.literal("share"), // 分享链接访问
        v.literal("project") // 项目页面访问
      )
    ),
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"])
    .index("by_document_user", ["documentId", "userId"])
    .index("by_recent", ["userId", "accessedAt"])
    .index("by_access_type", ["accessType"]),

  // 文档分享记录表
  documentShares: defineTable({
    documentId: v.id("documents"),
    sharedBy: v.string(), // 分享者 User.id
    sharedWith: v.string(), // 被分享者 User.id
    permission: v.union(
      v.literal("view"),
      v.literal("edit"),
      v.literal("comment")
    ),
    sharedAt: v.number(),
    isActive: v.boolean(),
    // 可选：分享过期时间
    expiresAt: v.optional(v.number()),
    // 可选：分享消息
    message: v.optional(v.string()),
  })
    .index("by_document", ["documentId"])
    .index("by_shared_with", ["sharedWith"])
    .index("by_shared_by", ["sharedBy"])
    .index("by_document_user", ["documentId", "sharedWith"])
    .index("by_active", ["isActive"])
    .index("by_expires", ["expiresAt"]),

  // 文档版本历史表
  documentVersions: defineTable({
    documentId: v.id("documents"),
    version: v.number(), // 版本号
    content: v.string(), // 该版本的内容
    title: v.string(), // 该版本的标题
    createdBy: v.string(), // 创建版本的 User.id
    changeDescription: v.optional(v.string()), // 更改说明
    createdAt: v.number(),
    // 可选：版本标签
    tag: v.optional(v.string()), // 如 "v1.0", "draft", "release"
  })
    .index("by_document", ["documentId", "version"])
    .index("by_document_created", ["documentId", "createdAt"])
    .index("by_creator", ["createdBy"]),

  // ============ 后端数据同步记录表 ============

  // 同步状态表 - 记录与后端数据的同步状态
  syncStatus: defineTable({
    resourceType: v.union(
      v.literal("user"),
      v.literal("team"),
      v.literal("workspace"),
      v.literal("project"),
      v.literal("team_member")
    ),
    resourceId: v.string(), // 后端资源的ID
    lastSyncAt: v.number(),
    syncVersion: v.optional(v.string()), // 同步版本号，用于增量同步
    status: v.union(
      v.literal("success"),
      v.literal("error"),
      v.literal("pending")
    ),
    errorMessage: v.optional(v.string()),
  })
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_status", ["status"])
    .index("by_last_sync", ["lastSyncAt"]),
});
