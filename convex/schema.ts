import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 用户表 - 同步后端用户信息
  users: defineTable({
    userId: v.string(), // 后端用户ID
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

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
    workspaceId: v.optional(v.string()), // 关联工作空间
    teamId: v.optional(v.string()), // 关联团队
    creatorId: v.string(), // 创建者用户ID
    isDefault: v.boolean(), // 是否为默认频道
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_workspace", ["workspaceId"])
    .index("by_team", ["teamId"])
    .index("by_creator", ["creatorId"]),

  // 频道成员表 - 管理用户与频道的关系
  channelMembers: defineTable({
    channelId: v.id("channels"),
    userId: v.string(),
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
    .index("by_channel_user", ["channelId", "userId"]),

  // 消息表 - 支持多种消息类型
  messages: defineTable({
    content: v.string(),
    userId: v.string(),
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
    mentionedUsers: v.optional(v.array(v.string())), // @用户
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
    .index("by_parent", ["parentMessageId"]),

  // 消息反应表
  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.string(),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_message_user", ["messageId", "userId"]),

  // 私聊会话表
  directConversations: defineTable({
    participants: v.array(v.string()), // 两个参与者的ID
    lastMessageAt: v.number(),
    isArchived: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_participants", ["participants"])
    .index("by_lastMessage", ["lastMessageAt"]),

  // 工作空间表 - 同步后端工作空间信息
  workspaces: defineTable({
    workspaceId: v.string(), // 后端工作空间ID
    name: v.string(),
    type: v.union(v.literal("PERSONAL"), v.literal("TEAM")),
    userId: v.optional(v.string()),
    teamId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"]),

  // 团队表 - 同步后端团队信息
  teams: defineTable({
    teamId: v.string(), // 后端团队ID
    name: v.string(),
    workspaceId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_teamId", ["teamId"])
    .index("by_workspace", ["workspaceId"]),

  // 通知表
  notifications: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("message"),
      v.literal("mention"),
      v.literal("channel_invite"),
      v.literal("team_invite")
    ),
    title: v.string(),
    content: v.string(),
    channelId: v.optional(v.id("channels")),
    messageId: v.optional(v.id("messages")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),

  // 保留原有的文档表不变
  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"]),
});
