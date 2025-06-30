import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// MARK: 获取频道列表
export const list = query({
  args: {
    type: v.optional(v.union(v.literal("official"), v.literal("private"))),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query("channels").order("desc");
    
    if (args.type === "official") {
      return await query
        .filter((q) => q.eq(q.field("isOfficial"), true))
        .collect();
    } else if (args.type === "private") {
      return await query
        .filter((q) => q.eq(q.field("isOfficial"), false))
        .collect();
    }
    
    return await query.collect();
  },
});

// MARK: 创建频道
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("text"), v.literal("voice"), v.literal("video")),
    isOfficial: v.boolean(),
    creatorId: v.optional(v.string()),
    members: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("channels", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// MARK: 获取频道消息列表
export const getMessages = query({
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
    const hasMore = messages.length === limit;
    
    return {
      messages: messages.reverse(),
      nextCursor: hasMore ? messages[0].createdAt : null,
    };
  },
});

// MARK: 获取频道信息
export const get = query({
  args: { 
    channelId: v.string()
  },
  handler: async (ctx, args) => {
    // NOTE:使用 query 来查找匹配的频道
    const channel = await ctx.db
      .query("channels")
      .filter(q => q.eq(q.field("_id"), args.channelId))
      .first();
    
    return channel;
  },
}); 