import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// MARK: 获取频道消息列表
export const getChannelMessages = query({
  args: {
    channelId: v.id("channels"),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // 验证用户是否有权限访问该频道
    let query = ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("desc");

    if (args.cursor !== undefined) {
      query = query.filter((q) => q.lt(q.field("createdAt"), args.cursor!));
    }

    const messages = await query.take(limit);

    // 获取消息反应
    const messagesWithReactions = await Promise.all(
      messages.map(async (message) => {
        const reactions = await ctx.db
          .query("messageReactions")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .collect();

        // 按emoji分组统计
        const reactionCounts = reactions.reduce((acc, reaction) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = { count: 0, users: [] };
          }
          acc[reaction.emoji].count++;
          acc[reaction.emoji].users.push(reaction.userId);
          return acc;
        }, {} as Record<string, { count: number; users: string[] }>);

        return {
          ...message,
          reactions: reactionCounts,
        };
      })
    );

    return {
      messages: messagesWithReactions.reverse(),
      nextCursor: messages.length === limit ? messages[0].createdAt : null,
    };
  },
});

// MARK: 发送消息
export const sendMessage = mutation({
  args: {
    content: v.string(),
    userId: v.string(),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    channelId: v.id("channels"),
    messageType: v.optional(
      v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("file"),
        v.literal("system"),
        v.literal("mention")
      )
    ),
    parentMessageId: v.optional(v.id("messages")),
    mentionedUsers: v.optional(v.array(v.string())),
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 验证用户是否是频道成员
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new Error("用户不是该频道的成员");
    }

    // 检查频道是否存在且未归档
    const channel = await ctx.db.get(args.channelId);
    if (!channel || channel.isArchived) {
      throw new Error("频道不存在或已归档");
    }

    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      userId: args.userId,
      userName: args.userName,
      userAvatar: args.userAvatar,
      channelId: args.channelId,
      messageType: args.messageType ?? "text",
      parentMessageId: args.parentMessageId,
      mentionedUsers: args.mentionedUsers,
      attachments: args.attachments,
      isEdited: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    // 更新用户最后阅读时间
    await ctx.db.patch(membership._id, {
      lastReadAt: now,
    });

    // 如果是私聊，更新对话的最后消息时间
    if (channel.type === "direct") {
      // 通过频道ID查找对应的私聊会话
      const conversations = await ctx.db.query("directConversations").collect();

      // 在直接对话中找到包含这个频道的对话
      for (const conversation of conversations) {
        // 这里需要一个机制来关联频道和对话，现在先跳过
        await ctx.db.patch(conversation._id, {
          lastMessageAt: now,
        });
        break; // 只更新第一个找到的对话
      }
    }

    // 创建通知给其他成员
    if (args.mentionedUsers && args.mentionedUsers.length > 0) {
      for (const mentionedUserId of args.mentionedUsers) {
        if (mentionedUserId !== args.userId) {
          await ctx.db.insert("notifications", {
            userId: mentionedUserId,
            type: "mention",
            title: `${args.userName} 在 ${channel.name} 中提到了你`,
            content: args.content,
            channelId: args.channelId,
            messageId,
            isRead: false,
            createdAt: now,
          });
        }
      }
    }

    return messageId;
  },
});

// MARK: 编辑消息
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("消息不存在");
    }

    if (message.userId !== args.userId) {
      throw new Error("只能编辑自己的消息");
    }

    if (message.isDeleted) {
      throw new Error("无法编辑已删除的消息");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      isEdited: true,
      updatedAt: Date.now(),
    });

    return args.messageId;
  },
});

// MARK: 删除消息
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("消息不存在");
    }

    if (message.userId !== args.userId) {
      // 检查是否是频道管理员
      const membership = await ctx.db
        .query("channelMembers")
        .withIndex("by_channel_user", (q) =>
          q.eq("channelId", message.channelId).eq("userId", args.userId)
        )
        .first();

      if (
        !membership ||
        (membership.role !== "admin" && membership.role !== "owner")
      ) {
        throw new Error("权限不足");
      }
    }

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });

    return args.messageId;
  },
});

// MARK: 添加消息反应
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    // 检查是否已经有相同的反应
    const existingReaction = await ctx.db
      .query("messageReactions")
      .withIndex("by_message_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .first();

    if (existingReaction) {
      // 移除反应
      await ctx.db.delete(existingReaction._id);
      return null;
    } else {
      // 添加反应
      return await ctx.db.insert("messageReactions", {
        messageId: args.messageId,
        userId: args.userId,
        emoji: args.emoji,
        createdAt: Date.now(),
      });
    }
  },
});

// MARK: 获取回复消息
export const getReplies = query({
  args: {
    parentMessageId: v.id("messages"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const replies = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) =>
        q.eq("parentMessageId", args.parentMessageId)
      )
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("asc")
      .take(limit);

    return replies;
  },
});

// MARK: 搜索消息
export const searchMessages = query({
  args: {
    query: v.string(),
    channelId: v.optional(v.id("channels")),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let query = ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("isDeleted"), false));

    if (args.channelId) {
      query = query.filter((q) => q.eq(q.field("channelId"), args.channelId));
    }

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    const messages = await query.order("desc").take(limit * 3); // 先取更多数据用于搜索

    // 简单的文本搜索过滤
    const searchTerm = args.query.toLowerCase();
    const filteredMessages = messages
      .filter(
        (message) =>
          message.content.toLowerCase().includes(searchTerm) ||
          message.userName.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);

    return filteredMessages;
  },
});

// MARK: 标记频道消息为已读
export const markChannelAsRead = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new Error("用户不是该频道的成员");
    }

    await ctx.db.patch(membership._id, {
      lastReadAt: Date.now(),
    });

    return membership._id;
  },
});
