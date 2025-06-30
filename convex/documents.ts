import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

//WARNING: Luke - 当前没有添加验证，使用了固定的userId，需修改

//MARK: archive
/**
 * 递归归档文档及其所有子文档
 * 实现方式：
 * 1. 验证用户身份和文档所有权
 * 2. 使用递归函数 recursiveArchive 处理子文档：
 *    - 通过 by_user_parent 索引查询所有子文档
 *    - 递归遍历每个子文档，将其标记为已归档
 * 3. 最后将主文档标记为已归档
 * 关键点：确保文档树的完整性，所有子文档都会被归档
 */
export const archive = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {

    // 
    const userId = "33cf0861-916a-4f3b-b37f-9ed0d15bb400"

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const recursiveArchive = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });

        await recursiveArchive(child._id);
      }
    };

    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    });

    await recursiveArchive(args.id);

    return document;
  },
});

//MARK: getSidebar
/**
 * 获取侧边栏文档列表
 * 实现方式：
 * 1. 接收可选的 parentDocument 参数
 * 2. 使用 by_user_parent 复合索引进行高效查询：
 *    - 匹配用户ID和父文档ID
 *    - 过滤掉已归档的文档
 * 关键点：
 * - 使用复合索引优化查询性能
 * - 只返回未归档的文档
 * - 支持文档层级结构显示
 */
export const getSidebar = query({
  args: {
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    
    const userId = "33cf0861-916a-4f3b-b37f-9ed0d15bb400"

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId!).eq("parentDocument", args.parentDocument)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    return documents;
  },
});

//MARK: create
/**
 * 创建新文档
 * 实现方式：
 * 1. 接收标题和可选的父文档ID
 * 2. 在数据库中插入新文档记录，包含：
 *    - 标题和父文档关联
 *    - 用户ID绑定
 *    - 默认状态(未归档、未发布)
 * 关键点：
 * - 支持文档层级结构
 * - 确保文档所有权
 * - 设置合理的默认值
 */
export const create = mutation({
  args: {
    title: v.string(),
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {


    
    const userId = "33cf0861-916a-4f3b-b37f-9ed0d15bb400"

    const document = await ctx.db.insert("documents", {
      title: args.title,
      parentDocument: args.parentDocument,
      userId: userId!,
      isArchived: false,
      isPublished: false,
    });

    return document;
  },
});

//MARK: getTrash
/**
 * 获取回收站中的文档
 * 实现方式：
 * 1. 使用 by_user 索引查询用户的所有文档
 * 2. 过滤条件：
 *    - 只返回已归档的文档
 *    - 按降序排列（最新归档的在前）
 * 关键点：
 * - 使用索引优化查询
 * - 提供合适的排序顺序
 * - 只显示当前用户的文档
 */
export const getTrash = query({
  handler: async (ctx) => {



    
    const userId = "33cf0861-916a-4f3b-b37f-9ed0d15bb400"

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId!))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return documents;
  },
});

//MARK: restore
/**
 * 还原已归档的文档
 * 实现方式：
 * 1. 验证文档所有权
 * 2. 递归处理所有子文档：
 *    - 使用 recursiveRestore 函数遍历子文档树
 *    - 将每个子文档标记为未归档
 * 3. 特殊处理父文档关系：
 *    - 如果父文档仍处于归档状态，断开与父文档的关联
 * 关键点：
 * - 维护文档树的完整性
 * - 处理父文档归档状态
 * - 确保所有相关文档都被正确还原
 */
export const restore = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {


    const userId = "33cf0861-916a-4f3b-b37f-9ed0d15bb400"

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const recursiveRestore = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: false,
        });

        await recursiveRestore(child._id);
      }
    };

    const options: Partial<Doc<"documents">> = {
      isArchived: false,
    };

    if (existingDocument.parentDocument) {
      const parent = await ctx.db.get(existingDocument.parentDocument);
      if (parent?.isArchived) {
        options.parentDocument = undefined;
      }
    }

    const document = await ctx.db.patch(args.id, options);

    await recursiveRestore(args.id);

    return document;
  },
});

//MARK: remove
/**
 * 永久删除文档
 * 实现方式：
 * 1. 严格的权限验证：
 *    - 检查用户认证
 *    - 验证文档所有权
 * 2. 直接从数据库中删除文档
 * 关键点：
 * - 不可逆操作，需要严格的权限控制
 * - 直接删除，不处理子文档（与归档不同）
 */
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {



    
    const userId = "33cf0861-916a-4f3b-b37f-9ed0d15bb400"

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.delete(args.id);

    return document;
  },
});

//MARK: getSearch
/**
 * 获取可搜索的文档列表
 * 实现方式：
 * 1. 使用 by_user 索引查询用户文档
 * 2. 过滤条件：
 *    - 只包含未归档文档
 *    - 按时间降序排列
 * 关键点：
 * - 优化搜索性能
 * - 确保数据实时性
 * - 只返回活跃文档
 */
export const getSearch = query({
  handler: async (ctx) => {



    
    const userId = "33cf0861-916a-4f3b-b37f-9ed0d15bb400"

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId!))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

//MARK: getById
/**
 * 获取单个文档详情
 * 实现方式：
 * 1. 复杂的访问权限控制：
 *    - 已发布且未归档的文档可公开访问
 *    - 私有文档需要验证所有权
 * 2. 多重条件判断：
 *    - 文档存在性检查
 *    - 发布状态检查
 *    - 用户认证和所有权检查
 * 关键点：
 * - 灵活的访问控制
 * - 支持公开和私有文档
 * - 完整的错误处理
 */
export const getById = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Not found");
    }

    if (document.isPublished && !document.isArchived) {
      return document;
    }


    return document;
  },
});



//MARK: update
/**
 * 更新文档属性
 * 实现方式：
 * 1. 支持多个可选更新字段：
 *    - 标题、内容、封面图片
 *    - 图标、发布状态
 * 2. 严格的权限验证
 * 3. 使用解构赋值分离ID和更新数据
 * 关键点：
 * - 灵活的部分更新
 * - 类型安全的参数处理
 * - 确保数据一致性
 */
export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {



    
    const userId = "33cf0861-916a-4f3b-b37f-9ed0d15bb400"

    const { id, ...rest } = args;

    const existingDocument = await ctx.db.get(id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(id, rest);
  },
});



//MARK: removeIcon
/**
 * 移除文档图标
 * 实现方式：
 * 1. 权限验证流程：
 *    - 用户认证
 *    - 文档所有权验证
 * 2. 通过将图标字段设为 undefined 来移除
 * 关键点：
 * - 简单的字段清除操作
 * - 完整的权限检查
 * - 返回更新后的文档
 */
export const removeIcon = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {



    
    const userId = "33cf0861-916a-4f3b-b37f-9ed0d15bb400"

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(args.id, { icon: undefined });

    return document;
  },
});


//MARK: removeCoverImage
/**
 * 移除文档封面图片
 * 实现方式：
 * 1. 与 removeIcon 类似的权限验证流程
 * 2. 将 coverImage 字段设为 undefined
 * 关键点：
 * - 权限控制
 * - 字段清除
 * - 文档更新
 */
export const removeCoverImage = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {



    
    const userId = "33cf0861-916a-4f3b-b37f-9ed0d15bb400"

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(args.id, { coverImage: undefined });

    return document;
  },
});
