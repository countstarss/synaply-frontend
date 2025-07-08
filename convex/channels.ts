import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// MARK: 获取用户可访问的频道列表
export const getUserChannels = query({
  args: {
    userId: v.string(),
    type: v.optional(
      v.union(
        v.literal("team_public"),
        v.literal("team_private"),
        v.literal("group"),
        v.literal("direct")
      )
    ),
    workspaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 首先获取用户作为成员的所有频道
    const memberships = await ctx.db
      .query("channelMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const channelIds = memberships.map((m) => m.channelId);

    if (channelIds.length === 0) {
      return [];
    }

    // 获取频道详情
    const channels = await Promise.all(
      channelIds.map(async (channelId) => {
        const channel = await ctx.db.get(channelId);
        if (!channel || channel.isArchived) return null;

        // 应用过滤条件
        if (args.type && channel.type !== args.type) return null;
        if (args.workspaceId && channel.workspaceId !== args.workspaceId)
          return null;

        // 获取成员数量
        const memberCount = await ctx.db
          .query("channelMembers")
          .withIndex("by_channel", (q) => q.eq("channelId", channelId))
          .collect()
          .then((members) => members.length);

        // 获取最新消息
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_channel", (q) => q.eq("channelId", channelId))
          .filter((q) => q.eq(q.field("isDeleted"), false))
          .order("desc")
          .first();

        // 获取当前用户的成员信息
        const userMembership = memberships.find(
          (m) => m.channelId === channelId
        );

        return {
          ...channel,
          memberCount,
          lastMessage,
          userRole: userMembership?.role,
          lastReadAt: userMembership?.lastReadAt,
          isMuted: userMembership?.isMuted,
          notificationLevel: userMembership?.notificationLevel,
        };
      })
    );

    return channels.filter(Boolean).sort((a, b) => {
      // 默认频道置顶
      if (a!.isDefault && !b!.isDefault) return -1;
      if (!a!.isDefault && b!.isDefault) return 1;

      // 按最后消息时间排序
      const aTime = a!.lastMessage?.createdAt || a!.createdAt;
      const bTime = b!.lastMessage?.createdAt || b!.createdAt;
      return bTime - aTime;
    });
  },
});

// MARK: 创建团队公开频道
export const createTeamChannel = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    chatType: v.union(
      v.literal("text"),
      v.literal("voice"),
      v.literal("video")
    ),
    workspaceId: v.string(),
    teamId: v.string(),
    creatorId: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 检查是否已存在同名频道
    const existingChannel = await ctx.db
      .query("channels")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingChannel) {
      throw new Error("频道名称已存在");
    }

    // 创建频道
    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      description: args.description,
      type: "team_public",
      chatType: args.chatType,
      workspaceId: args.workspaceId,
      teamId: args.teamId,
      creatorId: args.creatorId,
      isDefault: args.isDefault ?? false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    // 添加创建者为频道拥有者
    await ctx.db.insert("channelMembers", {
      channelId,
      userId: args.creatorId,
      role: "owner",
      joinedAt: now,
      lastReadAt: now,
      isMuted: false,
      notificationLevel: "all",
    });

    return channelId;
  },
});

// MARK: 创建群聊
export const createGroupChat = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    creatorId: v.string(),
    memberIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 确保创建者包含在成员列表中
    const allMembers = Array.from(new Set([args.creatorId, ...args.memberIds]));

    // 创建群聊频道
    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      description: args.description,
      type: "group",
      chatType: "text",
      creatorId: args.creatorId,
      isDefault: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    // 添加所有成员
    for (const userId of allMembers) {
      await ctx.db.insert("channelMembers", {
        channelId,
        userId,
        role: userId === args.creatorId ? "owner" : "member",
        joinedAt: now,
        lastReadAt: now,
        isMuted: false,
        notificationLevel: "all",
      });
    }

    // 发送系统消息
    await ctx.db.insert("messages", {
      content: `群聊 "${args.name}" 已创建`,
      userId: "system",
      userName: "系统",
      channelId,
      messageType: "system",
      isEdited: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    return channelId;
  },
});

// MARK: 创建私聊
export const createDirectMessage = mutation({
  args: {
    participantIds: v.array(v.string()), // 两个用户的ID
  },
  handler: async (ctx, args) => {
    if (args.participantIds.length !== 2) {
      throw new Error("私聊只能有两个参与者");
    }

    const now = Date.now();
    const [user1, user2] = args.participantIds.sort(); // 排序确保一致性

    // 检查是否已存在私聊
    const existingConversation = await ctx.db
      .query("directConversations")
      .withIndex("by_participants", (q) => q.eq("participants", [user1, user2]))
      .first();

    if (existingConversation) {
      // 找到对应的频道
      const channels = await ctx.db
        .query("channels")
        .filter((q) => q.eq(q.field("type"), "direct"))
        .collect();

      for (const channel of channels) {
        const members = await ctx.db
          .query("channelMembers")
          .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
          .collect();

        if (members.length === 2) {
          const memberUserIds = members.map((m) => m.userId).sort();
          if (memberUserIds[0] === user1 && memberUserIds[1] === user2) {
            return channel._id;
          }
        }
      }
    }

    // 创建新的私聊频道
    const channelId = await ctx.db.insert("channels", {
      name: `${user1}_${user2}`, // 临时名称，前端可以显示为用户名
      type: "direct",
      chatType: "text",
      creatorId: user1,
      isDefault: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    // 添加两个参与者
    for (const userId of args.participantIds) {
      await ctx.db.insert("channelMembers", {
        channelId,
        userId,
        role: "member",
        joinedAt: now,
        lastReadAt: now,
        isMuted: false,
        notificationLevel: "all",
      });
    }

    // 创建对话记录
    await ctx.db.insert("directConversations", {
      participants: [user1, user2],
      lastMessageAt: now,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    return channelId;
  },
});

// MARK: 获取频道详情
export const getChannelDetail = query({
  args: {
    channelId: v.id("channels"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      return null;
    }

    // 检查用户是否有权限访问
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      return null;
    }

    // 获取所有成员
    const members = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    return {
      ...channel,
      members,
      userRole: membership.role,
      userJoinedAt: membership.joinedAt,
      userLastReadAt: membership.lastReadAt,
      isMuted: membership.isMuted,
      notificationLevel: membership.notificationLevel,
    };
  },
});

// MARK: 更新频道设置
export const updateChannelSettings = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", args.userId)
      )
      .first();

    if (
      !membership ||
      (membership.role !== "admin" && membership.role !== "owner")
    ) {
      throw new Error("权限不足");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.channelId, updates);

    return args.channelId;
  },
});

// MARK: 更新用户频道设置
export const updateUserChannelSettings = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.string(),
    isMuted: v.optional(v.boolean()),
    notificationLevel: v.optional(
      v.union(v.literal("all"), v.literal("mentions"), v.literal("none"))
    ),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new Error("不是频道成员");
    }

    const updates: Record<string, unknown> = {};
    if (args.isMuted !== undefined) updates.isMuted = args.isMuted;
    if (args.notificationLevel !== undefined)
      updates.notificationLevel = args.notificationLevel;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(membership._id, updates);
    }

    return membership._id;
  },
});
