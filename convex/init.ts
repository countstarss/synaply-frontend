import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// MARK: 初始化团队聊天系统
export const initializeTeamChat = mutation({
  args: {
    teamId: v.string(),
    workspaceId: v.string(),
    teamName: v.string(),
    members: v.array(
      v.object({
        userId: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        role: v.union(
          v.literal("OWNER"),
          v.literal("ADMIN"),
          v.literal("MEMBER")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. 同步用户信息到Convex（仅聊天系统需要的字段）
    const userSyncPromises = args.members.map(async (member) => {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", member.userId))
        .first();

      if (!existingUser) {
        return await ctx.db.insert("users", {
          userId: member.userId,
          email: member.email,
          name: member.name,
          avatarUrl: member.avatarUrl,
          isOnline: false,
          lastSeen: now,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        // 更新用户信息
        await ctx.db.patch(existingUser._id, {
          email: member.email,
          name: member.name,
          avatarUrl: member.avatarUrl,
          lastSeen: now,
        });
        return existingUser._id;
      }
    });

    await Promise.all(userSyncPromises);

    // 2. 创建默认的"通用"频道
    const generalChannelName = "通用";
    const existingGeneralChannel = await ctx.db
      .query("channels")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("name"), generalChannelName))
      .first();

    let generalChannelId: Id<"channels">;
    if (!existingGeneralChannel) {
      // 找到团队拥有者作为频道创建者
      const teamOwner = args.members.find((m) => m.role === "OWNER");
      const creatorId = teamOwner?.userId || args.members[0].userId;

      generalChannelId = await ctx.db.insert("channels", {
        name: generalChannelName,
        description: "团队默认通用频道",
        type: "team_public",
        chatType: "text",
        workspaceId: args.workspaceId,
        teamId: args.teamId,
        creatorId,
        isDefault: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      });

      // 3. 将所有团队成员添加到默认频道
      const membershipPromises = args.members.map(async (member) => {
        const role =
          member.role === "OWNER"
            ? "owner"
            : member.role === "ADMIN"
            ? "admin"
            : "member";

        return await ctx.db.insert("channelMembers", {
          channelId: generalChannelId,
          userId: member.userId,
          role,
          joinedAt: now,
          lastReadAt: now,
          isMuted: false,
          notificationLevel: "all",
        });
      });

      await Promise.all(membershipPromises);

      // 4. 发送欢迎消息
      await ctx.db.insert("messages", {
        content: `欢迎来到 ${args.teamName} 团队！这是默认的通用频道，团队成员可以在这里进行日常交流。`,
        userId: "system",
        userName: "系统",
        channelId: generalChannelId,
        messageType: "system",
        isEdited: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      generalChannelId = existingGeneralChannel._id;
    }

    return {
      teamId: args.teamId,
      workspaceId: args.workspaceId,
      generalChannelId,
      membersCount: args.members.length,
    };
  },
});

// MARK: 为新成员初始化默认频道访问
export const initializeNewMember = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    teamId: v.string(),
    workspaceId: v.string(),
    role: v.union(v.literal("OWNER"), v.literal("ADMIN"), v.literal("MEMBER")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. 同步/更新用户信息
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingUser) {
      await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        isOnline: true,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        isOnline: true,
        lastSeen: now,
      });
    }

    // 2. 找到团队的所有默认公开频道
    const defaultChannels = await ctx.db
      .query("channels")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter(
        (q) =>
          q.eq(q.field("type"), "team_public") &&
          q.eq(q.field("isDefault"), true) &&
          q.eq(q.field("isArchived"), false)
      )
      .collect();

    // 3. 将用户添加到所有默认频道
    const membershipPromises = defaultChannels.map(async (channel) => {
      // 检查是否已经是成员
      const existingMembership = await ctx.db
        .query("channelMembers")
        .withIndex("by_channel_user", (q) =>
          q.eq("channelId", channel._id).eq("userId", args.userId)
        )
        .first();

      if (!existingMembership) {
        const memberRole =
          args.role === "OWNER"
            ? "owner"
            : args.role === "ADMIN"
            ? "admin"
            : "member";

        await ctx.db.insert("channelMembers", {
          channelId: channel._id,
          userId: args.userId,
          role: memberRole,
          joinedAt: now,
          lastReadAt: now,
          isMuted: false,
          notificationLevel: "all",
        });

        // 发送欢迎消息到频道
        await ctx.db.insert("messages", {
          content: `${args.name || args.email} 加入了团队`,
          userId: "system",
          userName: "系统",
          channelId: channel._id,
          messageType: "system",
          isEdited: false,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    await Promise.all(membershipPromises);

    return {
      userId: args.userId,
      joinedChannels: defaultChannels.length,
    };
  },
});

// MARK: 获取聊天系统状态
export const getChatSystemStatus = query({
  args: {
    teamId: v.string(),
  },
  handler: async (ctx, args) => {
    // 获取团队的所有频道
    const channels = await ctx.db
      .query("channels")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    if (channels.length === 0) {
      return {
        isInitialized: false,
        channelCount: 0,
        memberCount: 0,
        defaultChannels: [],
        recentActivity: [],
      };
    }

    // 获取总成员数（通过频道成员去重）
    const allMemberships = await ctx.db.query("channelMembers").collect();

    const teamMemberIds = new Set();
    for (const channel of channels) {
      const channelMemberships = allMemberships.filter(
        (m) => m.channelId === channel._id
      );
      channelMemberships.forEach((m) => teamMemberIds.add(m.userId));
    }

    // 获取最近活动
    const recentMessages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("desc")
      .take(10);

    const teamRecentMessages = [];
    for (const message of recentMessages) {
      const channel = await ctx.db.get(message.channelId);
      if (channel && channel.teamId === args.teamId) {
        teamRecentMessages.push({
          ...message,
          channelName: channel.name,
        });
      }
    }

    return {
      isInitialized: true,
      channelCount: channels.length,
      memberCount: teamMemberIds.size,
      defaultChannels: channels.filter((c) => c.isDefault),
      recentActivity: teamRecentMessages.slice(0, 5),
    };
  },
});

// MARK: 批量同步团队成员信息
export const syncTeamMembers = mutation({
  args: {
    teamId: v.string(),
    members: v.array(
      v.object({
        userId: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        role: v.union(
          v.literal("OWNER"),
          v.literal("ADMIN"),
          v.literal("MEMBER")
        ),
        isActive: v.boolean(), // 是否仍是团队成员
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = {
      synced: 0,
      removed: 0,
    };

    // 获取团队的所有频道
    const teamChannels = await ctx.db
      .query("channels")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // 同步活跃成员
    const activeMemberIds = args.members
      .filter((m) => m.isActive)
      .map((m) => m.userId);

    for (const member of args.members) {
      if (member.isActive) {
        // 同步用户信息
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", member.userId))
          .first();

        if (existingUser) {
          await ctx.db.patch(existingUser._id, {
            email: member.email,
            name: member.name,
            avatarUrl: member.avatarUrl,
            lastSeen: now,
          });
        } else {
          await ctx.db.insert("users", {
            userId: member.userId,
            email: member.email,
            name: member.name,
            avatarUrl: member.avatarUrl,
            isOnline: false,
            lastSeen: now,
            createdAt: now,
            updatedAt: now,
          });
        }
        results.synced++;
      }
    }

    // 移除不再是团队成员的用户
    for (const channel of teamChannels) {
      const channelMemberships = await ctx.db
        .query("channelMembers")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .collect();

      for (const membership of channelMemberships) {
        if (!activeMemberIds.includes(membership.userId)) {
          await ctx.db.delete(membership._id);
          results.removed++;
        }
      }
    }

    return results;
  },
});

// MARK: 获取用户聊天统计信息
export const getUserChatStats = query({
  args: {
    userId: v.string(),
    teamId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 获取用户参与的频道
    let channelMemberships = await ctx.db
      .query("channelMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // 如果指定了团队，则过滤
    if (args.teamId) {
      const teamChannels = await ctx.db
        .query("channels")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();

      const teamChannelIds = new Set(teamChannels.map((c) => c._id));
      channelMemberships = channelMemberships.filter((m) =>
        teamChannelIds.has(m.channelId)
      );
    }

    // 获取用户发送的消息数量
    const messageCount = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect()
      .then((messages) => {
        if (!args.teamId) return messages.length;

        // 如果指定了团队，需要进一步过滤
        return messages.filter((message) => {
          const membership = channelMemberships.find(
            (m) => m.channelId === message.channelId
          );
          return !!membership;
        }).length;
      });

    // 获取未读通知数量
    const unreadNotificationCount = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect()
      .then((notifications) => notifications.length);

    return {
      channelCount: channelMemberships.length,
      messageCount,
      unreadNotificationCount,
    };
  },
});

// MARK: 清理团队聊天数据（谨慎使用）
export const cleanupTeamChat = mutation({
  args: {
    teamId: v.string(),
    confirmCode: v.string(), // 安全确认码
  },
  handler: async (ctx, args) => {
    // 安全检查
    if (args.confirmCode !== "CLEANUP_TEAM_CHAT_DATA") {
      throw new Error("安全确认码错误");
    }

    // 获取团队的所有频道
    const teamChannels = await ctx.db
      .query("channels")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const results = {
      deletedChannels: 0,
      deletedMemberships: 0,
      deletedMessages: 0,
      deletedReactions: 0,
      deletedNotifications: 0,
    };

    // 删除所有相关数据
    for (const channel of teamChannels) {
      // 删除频道消息和反应
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .collect();

      for (const message of messages) {
        // 删除消息反应
        const reactions = await ctx.db
          .query("messageReactions")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .collect();

        for (const reaction of reactions) {
          await ctx.db.delete(reaction._id);
          results.deletedReactions++;
        }

        // 删除消息
        await ctx.db.delete(message._id);
        results.deletedMessages++;
      }

      // 删除频道成员关系
      const memberships = await ctx.db
        .query("channelMembers")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .collect();

      for (const membership of memberships) {
        await ctx.db.delete(membership._id);
        results.deletedMemberships++;
      }

      // 删除频道
      await ctx.db.delete(channel._id);
      results.deletedChannels++;
    }

    // 删除相关通知
    const notifications = await ctx.db
      .query("notifications")
      .filter(
        (q) =>
          q.eq(q.field("type"), "channel_invite") ||
          q.eq(q.field("type"), "team_invite") ||
          q.eq(q.field("type"), "message") ||
          q.eq(q.field("type"), "mention")
      )
      .collect();

    for (const notification of notifications) {
      if (notification.channelId) {
        const isTeamNotification = teamChannels.some(
          (c) => c._id === notification.channelId
        );
        if (isTeamNotification) {
          await ctx.db.delete(notification._id);
          results.deletedNotifications++;
        }
      }
    }

    return results;
  },
});
