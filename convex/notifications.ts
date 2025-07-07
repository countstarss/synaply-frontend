import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// MARK: 获取用户通知列表
export const getUserNotifications = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.onlyUnread) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }

    const notifications = await query.take(limit);

    // 获取相关的频道和消息信息
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let channelInfo = null;
        let messageInfo = null;

        if (notification.channelId) {
          channelInfo = await ctx.db.get(notification.channelId);
        }

        if (notification.messageId) {
          messageInfo = await ctx.db.get(notification.messageId);
        }

        return {
          ...notification,
          channel: channelInfo,
          message: messageInfo,
        };
      })
    );

    return enrichedNotifications;
  },
});

// MARK: 获取未读通知数量
export const getUnreadCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const count = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect()
      .then((notifications) => notifications.length);

    return count;
  },
});

// MARK: 标记通知为已读
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("通知不存在");
    }

    if (notification.userId !== args.userId) {
      throw new Error("权限不足");
    }

    if (!notification.isRead) {
      await ctx.db.patch(args.notificationId, {
        isRead: true,
      });
    }

    return args.notificationId;
  },
});

// MARK: 标记所有通知为已读
export const markAllAsRead = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    const updatePromises = unreadNotifications.map(async (notification) => {
      return await ctx.db.patch(notification._id, {
        isRead: true,
      });
    });

    await Promise.all(updatePromises);

    return unreadNotifications.length;
  },
});

// MARK: 创建通知
export const createNotification = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      content: args.content,
      channelId: args.channelId,
      messageId: args.messageId,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// MARK: 批量创建通知
export const createBulkNotifications = mutation({
  args: {
    notifications: v.array(
      v.object({
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const insertPromises = args.notifications.map(async (notification) => {
      return await ctx.db.insert("notifications", {
        ...notification,
        isRead: false,
        createdAt: now,
      });
    });

    return await Promise.all(insertPromises);
  },
});

// MARK: 删除通知
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("通知不存在");
    }

    if (notification.userId !== args.userId) {
      throw new Error("权限不足");
    }

    await ctx.db.delete(args.notificationId);

    return args.notificationId;
  },
});

// MARK: 清理旧通知
export const cleanupOldNotifications = mutation({
  args: {
    daysOld: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysOld = args.daysOld ?? 30; // 默认删除30天前的通知
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    const oldNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.lt(q.field("createdAt"), cutoffTime))
      .collect();

    const deletePromises = oldNotifications.map(async (notification) => {
      return await ctx.db.delete(notification._id);
    });

    await Promise.all(deletePromises);

    return oldNotifications.length;
  },
});

// MARK: 获取通知统计
export const getNotificationStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const allNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const unreadCount = allNotifications.filter((n) => !n.isRead).length;
    const totalCount = allNotifications.length;

    // 按类型统计
    const byType = allNotifications.reduce((acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = { total: 0, unread: 0 };
      }
      acc[notification.type].total++;
      if (!notification.isRead) {
        acc[notification.type].unread++;
      }
      return acc;
    }, {} as Record<string, { total: number; unread: number }>);

    return {
      unreadCount,
      totalCount,
      byType,
    };
  },
});

// MARK: 创建提及通知
export const createMentionNotification = mutation({
  args: {
    mentionedUserIds: v.array(v.string()),
    mentionerName: v.string(),
    channelId: v.id("channels"),
    messageId: v.id("messages"),
    messageContent: v.string(),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("频道不存在");
    }

    const now = Date.now();
    const notifications = [];

    for (const userId of args.mentionedUserIds) {
      const notificationId = await ctx.db.insert("notifications", {
        userId,
        type: "mention",
        title: `${args.mentionerName} 在 ${channel.name} 中提到了你`,
        content: args.messageContent,
        channelId: args.channelId,
        messageId: args.messageId,
        isRead: false,
        createdAt: now,
      });
      notifications.push(notificationId);
    }

    return notifications;
  },
});

// MARK: 创建频道邀请通知
export const createChannelInviteNotification = mutation({
  args: {
    invitedUserId: v.string(),
    inviterName: v.string(),
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("频道不存在");
    }

    return await ctx.db.insert("notifications", {
      userId: args.invitedUserId,
      type: "channel_invite",
      title: `${args.inviterName} 邀请你加入频道`,
      content: `你被邀请加入频道：${channel.name}`,
      channelId: args.channelId,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});
