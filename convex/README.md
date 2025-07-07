# Synaply 聊天系统 - Convex 后端

基于 Convex 构建的完整聊天系统，支持团队公开聊天、群聊、私聊等功能。

## 📋 功能特性

### 🏗️ 系统架构
- **类型安全**：完全基于 TypeScript，端到端类型安全
- **实时更新**：Convex 提供自动的实时数据同步
- **响应式设计**：支持多种设备和屏幕尺寸
- **可扩展性**：模块化设计，易于扩展新功能

### 💬 聊天功能
- **团队公开频道**：团队成员默认加入，公开交流
- **团队私有频道**：需要邀请才能加入的私密频道
- **群聊**：多人群组聊天，支持自定义成员
- **私聊**：一对一私密对话
- **消息类型**：文本、图片、文件、系统消息、@提及
- **消息管理**：编辑、删除、回复消息
- **表情反应**：为消息添加表情符号反应

### 👥 用户管理
- **用户同步**：与后端 API 的用户信息同步
- **在线状态**：实时显示用户在线/离线状态
- **用户搜索**：根据姓名或邮箱搜索用户
- **个人资料**：用户头像、姓名等信息管理

### 🔔 通知系统
- **消息通知**：新消息提醒
- **@提及通知**：被提及时的特殊通知
- **频道邀请通知**：加入频道的邀请通知
- **通知管理**：标记已读、批量操作

### 🏢 团队集成
- **自动初始化**：新团队创建时自动设置默认频道
- **成员管理**：新成员自动加入默认频道
- **权限控制**：基于团队角色的频道权限管理

## 📁 文件结构

```
convex/
├── schema.ts           # 数据库 Schema 定义
├── messages.ts         # 消息相关功能
├── channels.ts         # 频道管理功能
├── users.ts           # 用户管理功能
├── notifications.ts   # 通知系统
├── init.ts           # 系统初始化功能
├── documents.ts      # 文档系统（保留原功能）
└── README.md         # 本文档
```

## 🔧 API 接口

### 消息管理 (messages.ts)

**查询 (Queries):**
- `getChannelMessages` - 获取频道消息列表（支持分页）
- `getReplies` - 获取回复消息
- `searchMessages` - 搜索消息

**变更 (Mutations):**
- `sendMessage` - 发送消息
- `editMessage` - 编辑消息
- `deleteMessage` - 删除消息
- `addReaction` - 添加/移除消息反应
- `markChannelAsRead` - 标记频道为已读

### 频道管理 (channels.ts)

**查询 (Queries):**
- `getUserChannels` - 获取用户频道列表
- `getChannelDetail` - 获取频道详情

**变更 (Mutations):**
- `createTeamChannel` - 创建团队频道
- `createGroupChat` - 创建群聊
- `createDirectMessage` - 创建私聊
- `updateChannelSettings` - 更新频道设置
- `updateUserChannelSettings` - 更新用户频道设置

### 用户管理 (users.ts)

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
- `deleteNotification` - 删除通知
- `cleanupOldNotifications` - 清理旧通知

### 系统初始化 (init.ts)

**查询 (Queries):**
- `getChatSystemStatus` - 获取聊天系统状态

**变更 (Mutations):**
- `initializeTeamChat` - 初始化团队聊天系统
- `initializeNewMember` - 为新成员初始化默认频道访问
- `resetTeamChatSystem` - 重置团队聊天系统（谨慎使用）

## 🚀 使用指南

### 1. 初始化团队聊天系统

当创建新团队时，调用初始化功能：

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

### 2. 发送消息

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

### 3. 获取频道列表

```typescript
const channels = await convex.query(api.channels.getUserChannels, {
  userId: "user-1",
  type: "team_public", // 可选：过滤频道类型
  workspaceId: "workspace-456", // 可选：按工作空间过滤
});
```

### 4. 创建群聊

```typescript
const groupId = await convex.mutation(api.channels.createGroupChat, {
  name: "项目讨论组",
  description: "讨论项目相关事宜",
  creatorId: "user-1",
  memberIds: ["user-2", "user-3", "user-4"],
});
```

### 5. 创建私聊

```typescript
const dmChannelId = await convex.mutation(api.channels.createDirectMessage, {
  participantIds: ["user-1", "user-2"],
});
```

## 🛡️ 权限和安全

### 频道权限
- **团队公开频道**：团队成员可自由加入
- **团队私有频道**：需要管理员邀请
- **群聊**：创建者和管理员可邀请新成员
- **私聊**：仅参与者可访问

### 消息权限
- 用户只能编辑自己的消息
- 频道管理员可删除任何消息
- 系统自动过滤已删除的消息

### 通知隐私
- 用户只能访问自己的通知
- 通知内容根据频道权限进行过滤

## 🔗 与后端 API 集成

聊天系统设计为与现有的后端 API 无缝集成：

- **用户同步**：自动同步后端用户信息到 Convex
- **团队管理**：与团队管理系统集成
- **工作空间**：支持多工作空间架构
- **权限映射**：后端角色自动映射到聊天系统权限

## 📈 性能优化

- **索引优化**：为常用查询路径建立了合适的索引
- **分页支持**：消息和通知列表支持分页加载
- **缓存策略**：Convex 自动缓存查询结果
- **批量操作**：支持批量用户同步和通知创建

## 🔧 部署和维护

### 环境变量
确保设置以下 Convex 环境变量：
- `VITE_CONVEX_URL` - Convex 项目 URL

### 数据迁移
- 所有 schema 更改都通过 Convex 自动处理
- 支持在线迁移，无需停机
- 向后兼容的 schema 设计

### 监控和日志
- 使用 Convex Dashboard 监控系统性能
- 错误处理和用户友好的错误信息
- 自动清理过期通知和数据

## 📝 注意事项

1. **文档系统保留**：原有的 documents 功能完全保留，不受聊天系统影响
2. **用户ID映射**：聊天系统使用后端用户ID，确保数据一致性
3. **实时更新**：Convex 提供自动实时更新，无需额外配置
4. **类型安全**：所有 API 都有完整的 TypeScript 类型定义

## 🚀 下一步

- 添加文件上传功能
- 实现消息搜索高亮
- 添加语音和视频通话支持
- 实现消息加密
- 添加机器人和自动化功能

---

需要帮助？请查看 [Convex 官方文档](https://docs.convex.dev/) 或联系开发团队。 