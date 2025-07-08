import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// MARK: 同步或创建用户
export const syncUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 检查用户是否已存在
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // 更新现有用户信息
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        lastSeen: now,
      });
      return existingUser._id;
    } else {
      // 创建新用户
      return await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        isOnline: true,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// MARK: 更新用户在线状态
export const updateOnlineStatus = mutation({
  args: {
    userId: v.string(),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("用户不存在");
    }

    await ctx.db.patch(user._id, {
      isOnline: args.isOnline,
      lastSeen: Date.now(),
    });

    return user._id;
  },
});

// MARK: 获取用户信息
export const getUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// MARK: 获取多个用户信息
export const getUsers = query({
  args: {
    userIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const users = await Promise.all(
      args.userIds.map(async (userId) => {
        return await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();
      })
    );

    return users.filter(Boolean);
  },
});

// MARK: 搜索用户
export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const searchTerm = args.query.toLowerCase();

    // 获取所有用户进行前端搜索（在实际应用中可能需要更高效的搜索方案）
    const allUsers = await ctx.db.query("users").take(100); // 限制搜索范围

    const filteredUsers = allUsers
      .filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);

    return filteredUsers;
  },
});

// MARK: 获取在线用户
export const getOnlineUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isOnline"), true))
      .order("desc")
      .take(limit);
  },
});

// MARK: 更新用户资料
export const updateProfile = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("用户不存在");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return user._id;
  },
});

// MARK: 获取用户统计信息
export const getUserStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      return null;
    }

    // 获取用户参与的频道数量
    const channelCount = await ctx.db
      .query("channelMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
      .then((members) => members.length);

    // 获取用户发送的消息数量
    const messageCount = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect()
      .then((messages) => messages.length);

    // 获取未读通知数量
    const unreadNotificationCount = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect()
      .then((notifications) => notifications.length);

    return {
      user,
      channelCount,
      messageCount,
      unreadNotificationCount,
    };
  },
});

// MARK: 同步工作空间用户
export const syncWorkspaceUsers = mutation({
  args: {
    workspaceId: v.string(),
    users: v.array(
      v.object({
        userId: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = [];

    for (const userData of args.users) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", userData.userId))
        .first();

      if (existingUser) {
        // 更新现有用户
        await ctx.db.patch(existingUser._id, {
          email: userData.email,
          name: userData.name,
          avatarUrl: userData.avatarUrl,
          lastSeen: now,
        });
        results.push(existingUser._id);
      } else {
        // 创建新用户
        const newUserId = await ctx.db.insert("users", {
          userId: userData.userId,
          email: userData.email,
          name: userData.name,
          avatarUrl: userData.avatarUrl,
          isOnline: false,
          lastSeen: now,
          createdAt: now,
          updatedAt: now,
        });
        results.push(newUserId);
      }
    }

    return results;
  },
});
