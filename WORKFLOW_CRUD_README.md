# 工作流CRUD系统

## 概述

本系统为Synaply前端项目实现了完整的工作流CRUD功能，包括创建、读取、更新、删除工作流，以及工作流的发布和设置管理。

## 架构

### 1. API服务层 (`/src/lib/fetchers/workflow.ts`)
- 提供与后端API交互的基础函数
- 包含所有工作流相关的HTTP请求
- 支持工作流的完整生命周期操作

### 2. React Hooks (`/src/hooks/useWorkflowApi.ts`)
- 基于TanStack Query的数据管理
- 提供缓存、错误处理、加载状态管理
- 包含以下主要hooks：
  - `useWorkflows` - 获取工作流列表
  - `useWorkflow` - 获取单个工作流详情
  - `useCreateWorkflow` - 创建工作流
  - `useUpdateWorkflow` - 更新工作流
  - `useDeleteWorkflow` - 删除工作流
  - `usePublishWorkflow` - 发布工作流
  - `useUpdateWorkflowJson` - 更新工作流JSON数据
  - `useWorkflowStats` - 获取工作流统计信息
  - `useBatchWorkflowOperations` - 批量操作

### 3. 用户界面组件

#### 主页面 (`/src/app/[locale]/(main)/(team)/team/workflows/page.tsx`)
- 工作流列表展示
- 统计信息面板
- 操作按钮（创建、编辑、删除、设置）
- 加载状态和错误处理

#### 工作流设置模态框 (`/src/app/[locale]/(main)/(team)/team/components/workflow/WorkflowSettingsModal.tsx`)
- 工作流基本信息编辑
- 可见性设置
- 发布功能
- 状态管理

## 功能特性

### ✅ 已实现的功能
1. **工作流列表**
   - 分页展示工作流
   - 状态筛选（草稿/已发布）
   - 实时统计信息

2. **工作流创建**
   - 基础信息设置
   - 自动生成ID
   - 默认草稿状态

3. **工作流编辑**
   - 节点和边的可视化编辑
   - 实时保存
   - 数据同步

4. **工作流删除**
   - 确认对话框
   - 级联删除处理
   - 缓存清理

5. **工作流发布**
   - 状态转换
   - 验证检查
   - 权限控制

6. **设置管理**
   - 可见性配置
   - 基本信息编辑
   - 状态展示

### 🔄 数据流

```
用户操作 → React Hook → API服务层 → 后端API
    ↓
TanStack Query缓存 → 组件重渲染 → UI更新
```

## 使用示例

### 获取工作流列表
```typescript
const { data: workflows, isLoading, error } = useWorkflows(workspaceId);
```

### 创建工作流
```typescript
const createWorkflowMutation = useCreateWorkflow();

const handleCreate = async () => {
  await createWorkflowMutation.mutateAsync({
    workspaceId: "workspace-id",
    data: {
      name: "新工作流",
      visibility: "PRIVATE"
    }
  });
};
```

### 更新工作流JSON
```typescript
const updateWorkflowJsonMutation = useUpdateWorkflowJson();

const handleSave = async (workflow) => {
  await updateWorkflowJsonMutation.mutateAsync({
    workspaceId: "workspace-id",
    workflowId: workflow.id,
    workflowData: {
      nodes: workflow.nodes,
      edges: workflow.edges,
      assigneeMap: workflow.assigneeMap
    }
  });
};
```

## 错误处理

系统包含完善的错误处理机制：
- 网络错误处理
- 业务逻辑错误提示
- 用户友好的错误消息
- 自动重试机制

## 缓存策略

使用TanStack Query的缓存机制：
- 5分钟缓存时间
- 自动失效更新
- 乐观更新支持
- 离线数据支持

## 类型安全

完整的TypeScript类型定义：
- API响应类型
- 组件Props类型
- Hook参数类型
- 错误类型定义

## 测试

建议的测试覆盖：
- [ ] 单元测试（hooks）
- [ ] 集成测试（API层）
- [ ] 端到端测试（用户流程）
- [ ] 错误场景测试

## 部署注意事项

1. 确保后端API已部署并可访问
2. 设置正确的`NEXT_PUBLIC_BACKEND_DEV_URL`环境变量
3. 配置用户认证和权限系统
4. 监控API性能和错误率

## 未来扩展

可能的功能扩展：
- 工作流模板系统
- 工作流版本控制
- 工作流执行监控
- 工作流分析和报告
- 工作流权限细化
- 工作流导入导出