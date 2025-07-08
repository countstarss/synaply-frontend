# Synaply Convex 后端系统

基于 Convex 构建的完整后端系统，专注于聊天系统、通知系统和文档管理，与后端 PostgreSQL 数据库协同工作。

## 📋 系统架构

### 🏗️ 设计原则
- **职责分离**：Convex 专注于实时功能（聊天、通知），PostgreSQL 处理核心业务数据（用户、团队、工作空间）
- **类型安全**：完全基于 TypeScript，端到端类型安全
- **实时更新**：Convex 提供自动的实时数据同步
- **权限控制**：灵活的文档权限管理系统

### 💬 聊天系统
- **团队公开频道**：团队成员默认加入，公开交流
- **团队私有频道**：需要邀请才能加入的私密频道
- **群聊**：多人群组聊天，支持自定义成员
- **私聊**：一对一私密对话
- **消息类型**：文本、图片、文件、系统消息、@提及
- **消息管理**：编辑、删除、回复消息
- **表情反应**：为消息添加表情符号反应

### 📄 文档系统
- **工作空间支持**：支持个人（PERSONAL）和团队（TEAM）工作空间
- **项目管理**：团队工作空间可创建项目，文档可关联项目
- **灵活权限**：
  - **可见性控制**：私有、团队可见、项目可见、指定用户可见
  - **编辑权限**：创建者、团队成员、项目成员、指定用户可编辑
- **文档功能**：
  - JSON 格式内容存储
  - 文档层级结构（父子文档）
  - 标签系统
  - 收藏功能
  - 版本历史
  - 访问记录
  - 文档分享

### 🔔 通知系统
- **消息通知**：新消息提醒
- **@提及通知**：被提及时的特殊通知
- **频道邀请通知**：加入频道的邀请通知
- **文档分享通知**：文档被分享时的通知
- **文档更新通知**：关注文档的更新提醒

## 📁 文件结构

```
convex/
├── schema.ts           # 数据库 Schema 定义
├── messages.ts         # 消息相关功能
├── channels.ts         # 频道管理功能
├── users.ts           # 用户管理功能（同步）
├── notifications.ts   # 通知系统
├── projects.ts        # 项目管理功能
├── documents.ts       # 文档系统（增强版）
├── init.ts           # 系统初始化功能
└── README.md         # 本文档
```

## 🗄️ 数据表设计

### 聊天系统相关表
- `users` - 用户基本信息（仅聊天必需字段，与后端同步）
- `channels` - 频道信息
- `channelMembers` - 频道成员关系
- `messages` - 消息内容
- `messageReactions` - 消息反应
- `directConversations` - 私聊会话
- `notifications` - 通知信息

### 文档系统相关表
- `projects` - 项目管理
- `documents` - 文档内容（增强版，支持权限控制）
- `documentAccess` - 文档访问记录
- `documentShares` - 文档分享记录
- `documentVersions` - 文档版本历史

## 🔧 API 接口

### 聊天系统

#### 消息管理 (messages.ts)
**查询 (Queries):**
- `getChannelMessages` - 获取频道消息列表（支持分页、反应）
- `getReplies` - 获取回复消息
- `searchMessages` - 搜索消息

**变更 (Mutations):**
- `sendMessage` - 发送消息（支持@提及、附件）
- `editMessage` - 编辑消息
- `deleteMessage` - 删除消息
- `addReaction` - 添加/移除消息反应
- `markChannelAsRead` - 标记频道为已读

#### 频道管理 (channels.ts)
**查询 (Queries):**
- `getUserChannels` - 获取用户频道列表
- `getChannelDetail` - 获取频道详情

**变更 (Mutations):**
- `createTeamChannel` - 创建团队频道
- `createGroupChat` - 创建群聊
- `createDirectMessage` - 创建私聊
- `updateChannelSettings` - 更新频道设置
- `updateUserChannelSettings` - 更新用户频道设置

#### 用户管理 (users.ts)
**查询 (Queries):**
- `getUser` - 获取用户信息
- `getUsers` - 批量获取用户信息
- `searchUsers` - 搜索用户
- `getOnlineUsers` - 获取在线用户
- `getUserStats` - 获取用户统计信息

**变更 (Mutations):**
- `syncUser` - 同步/创建用户
- `updateOnlineStatus` - 更新在线状态
- `updateProfile` - 更新用户资料
- `syncWorkspaceUsers` - 批量同步工作空间用户

### 文档系统

#### 项目管理 (projects.ts)
**查询 (Queries):**
- `getByWorkspace` - 获取工作空间项目列表
- `getByCreator` - 获取用户创建的项目
- `getById` - 获取项目详情
- `search` - 搜索项目
- `getStats` - 获取项目统计

**变更 (Mutations):**
- `create` - 创建项目
- `update` - 更新项目
- `archive` - 归档项目
- `restore` - 恢复项目
- `remove` - 删除项目

#### 文档管理 (documents.ts)
**查询 (Queries):**
- `getById` - 获取文档详情（支持权限检查）
- `getByWorkspace` - 获取工作空间文档列表
- `getByCreator` - 获取用户创建的文档
- `getRecentlyAccessed` - 获取最近访问的文档
- `search` - 搜索文档（支持标签过滤）
- `getTrash` - 获取回收站文档

**变更 (Mutations):**
- `create` - 创建文档（支持权限设置、项目关联）
- `update` - 更新文档（支持版本历史）
- `shareDocument` - 分享文档给指定用户
- `archive` - 归档文档（递归）
- `restore` - 恢复文档（递归）
- `remove` - 删除文档
- `removeIcon` - 移除文档图标
- `removeCoverImage` - 移除文档封面

### 通知系统 (notifications.ts)
**查询 (Queries):**
- `getUserNotifications` - 获取用户通知列表
- `getUnreadCount` - 获取未读通知数量
- `getNotificationStats` - 获取通知统计

**变更 (Mutations):**
- `markAsRead` - 标记通知为已读
- `markAllAsRead` - 标记所有通知为已读
- `createNotification` - 创建通知
- `createBulkNotifications` - 批量创建通知
- `createMentionNotification` - 创建提及通知
- `createChannelInviteNotification` - 创建频道邀请通知

### 系统初始化 (init.ts)
**查询 (Queries):**
- `getChatSystemStatus` - 获取聊天系统状态
- `getUserChatStats` - 获取用户聊天统计

**变更 (Mutations):**
- `initializeTeamChat` - 初始化团队聊天系统
- `initializeNewMember` - 为新成员初始化默认频道访问
- `syncTeamMembers` - 批量同步团队成员信息
- `cleanupTeamChat` - 清理团队聊天数据（谨慎使用）

## 🚀 使用指南

### 1. 初始化团队聊天系统

```typescript
const result = await convex.mutation(api.init.initializeTeamChat, {
  teamId: "team-123",
  workspaceId: "workspace-456", 
  teamName: "我的团队",
  members: [
    {
      userId: "user-1",
      email: "user1@example.com",
      name: "用户一",
      role: "OWNER"
    },
    // ... 其他成员
  ]
});
```

### 2. 创建项目

```typescript
const projectId = await convex.mutation(api.projects.create, {
  name: "新项目",
  description: "项目描述",
  workspaceId: "workspace-456",
  teamId: "team-123",
  creatorId: "user-1",
  color: "#ff6b6b",
});
```

### 3. 创建文档（支持权限控制）

```typescript
const documentId = await convex.mutation(api.documents.create, {
  title: "项目文档",
  content: JSON.stringify(docContent),
  creatorId: "user-1",
  workspaceId: "workspace-456",
  workspaceType: "TEAM",
  projectId: projectId, // 可选：关联项目
  visibility: "team", // 团队可见
  allowEdit: "project", // 项目成员可编辑
  tags: ["开发", "文档"],
});
```

### 4. 分享文档

```typescript
const shareId = await convex.mutation(api.documents.shareDocument, {
  documentId: documentId,
  sharedBy: "user-1",
  sharedWith: "user-2",
  permission: "edit", // view | edit | comment
});
```

### 5. 发送消息

```typescript
const messageId = await convex.mutation(api.messages.sendMessage, {
  content: "Hello, World!",
  userId: "user-1",
  userName: "用户一",
  channelId: channelId,
  messageType: "text",
  mentionedUsers: ["user-2"], // 可选：@提及用户
});
```

## 🛡️ 权限和安全

### 文档权限系统
- **可见性控制**：
  - `private` - 仅创建者可见
  - `team` - 团队成员可见
  - `project` - 项目成员可见
  - `specific` - 指定用户可见

- **编辑权限**：
  - `creator` - 仅创建者可编辑
  - `team` - 团队成员可编辑
  - `project` - 项目成员可编辑
  - `specific` - 指定用户可编辑

### 聊天权限
- **频道权限**：
  - 团队公开频道：团队成员可自由加入
  - 团队私有频道：需要管理员邀请
  - 群聊：创建者和管理员可邀请新成员
  - 私聊：仅参与者可访问

- **消息权限**：
  - 用户只能编辑自己的消息
  - 频道管理员可删除任何消息
  - 系统自动过滤已删除的消息

## 🔗 与后端 API 集成

### 数据同步策略
- **用户信息**：定期从后端同步用户基本信息到 Convex
- **团队成员**：通过 `syncTeamMembers` 同步团队成员变更
- **权限检查**：文档和聊天权限可以结合后端团队成员关系进行验证

### 集成点
- 用户登录时同步用户信息
- 团队成员变更时同步成员列表
- 工作空间创建时初始化聊天系统
- 项目创建时可关联后端项目信息

## 📈 性能优化

- **索引优化**：为常用查询路径建立了合适的索引
- **分页支持**：消息和文档列表支持分页加载
- **权限缓存**：权限检查结果可以在前端缓存
- **批量操作**：支持批量用户同步和通知创建
- **访问记录**：文档访问记录支持最近访问功能

## 🔧 部署和维护

### 环境变量
确保设置以下 Convex 环境变量：
- `VITE_CONVEX_URL` - Convex 项目 URL

### 数据迁移
- Schema 更改通过 Convex 自动处理
- 支持在线迁移，无需停机
- 向后兼容的 schema 设计

### 监控和维护
- 使用 Convex Dashboard 监控系统性能
- 定期清理过期通知和访问记录
- 监控文档版本历史大小

## 📝 注意事项

1. **职责分离**：Convex 专注于实时功能，核心业务数据仍在后端 PostgreSQL
2. **数据同步**：需要确保 Convex 中的用户信息与后端保持同步
3. **权限验证**：文档权限检查目前是简化版本，可根据需要增强
4. **版本控制**：文档版本历史会占用存储空间，需要定期清理策略

## 🚀 下一步

- 实现更复杂的权限检查逻辑（与后端 API 集成）
- 添加文件上传功能
- 实现文档协作编辑
- 添加语音和视频通话支持
- 实现消息加密
- 添加机器人和自动化功能

---

需要帮助？请查看 [Convex 官方文档](https://docs.convex.dev/) 或联系开发团队。 