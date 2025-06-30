import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    content: v.string(),
    userId: v.string(),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    createdAt: v.number(),
    channelId: v.string(),
    type: v.union(v.literal("public"), v.literal("private"), v.literal("group")),
  }).index("by_createdAt", ["createdAt"])
    .index("by_channel", ["channelId", "createdAt"]),

  channels: defineTable({
    name: v.string(),
    type: v.union(v.literal("text"), v.literal("voice"), v.literal("video")),
    isOfficial: v.boolean(),
    creatorId: v.optional(v.string()),
    members: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }),

  directMessages: defineTable({
    participants: v.array(v.string()),
    lastMessageAt: v.number(),
  }).index("by_participant", ["participants", "lastMessageAt"]),

  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.boolean(),
  }).index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"]),
}); 