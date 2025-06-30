import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// MARK: 获取消息列表
export const list = query({
  args: {
    channelId: v.string(),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    let query = ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("channelId"), args.channelId))
      .order("desc");

    if (args.cursor) {
      query = query.filter((q) => q.lt(q.field("createdAt"), args.cursor ?? 10));
    }

    const messages = await query.take(limit);
    return {
      messages: messages.reverse(),
      nextCursor: messages.length === limit ? messages[0].createdAt : null,
    };
  },
});

// MARK: 发送消息
export const send = mutation({
  args: {
    content: v.string(),
    userId: v.string(),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    channelId: v.string(),
    type: v.union(v.literal("public"), v.literal("private"), v.literal("group")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
    });
  },
}); 