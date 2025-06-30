npx swagger-typescript-api generate --path http://localhost:5678/api-json -o src/api -n index.ts

# Synaply 认证系统

基于 Next.js 和 Supabase 构建的现代化认证系统，采用炫酷的黑绿色主题设计。

## ✨ 特性

- 🔐 **安全认证**: 基于 Supabase 的企业级认证系统
- 🎨 **现代化设计**: 炫酷的黑绿色主题，响应式设计
- ⚡ **动画效果**: 流畅的 Framer Motion 动画
- 🛡️ **路由保护**: 自动保护需要认证的页面
- 📧 **邮箱验证**: 支持用户注册邮箱验证
- 🔄 **密码重置**: 完整的密码重置流程
- 🚀 **高性能**: 基于 Next.js App Router 构建
- 💻 **TypeScript**: 完整的类型安全支持

## 🛠️ 技术栈

- **前端框架**: Next.js 15 (App Router)
- **认证服务**: Supabase Auth
- **样式框架**: Tailwind CSS 4
- **动画库**: Framer Motion
- **图标库**: Lucide React
- **语言**: TypeScript
- **包管理器**: pnpm

## 📦 安装依赖

```bash
# 使用 pnpm 安装依赖
pnpm install
```

## ⚙️ 环境配置

1. 创建 `.env.local` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

2. 在 [Supabase](https://supabase.com) 创建项目并获取以下信息：
   - Project URL
   - API Keys (anon/public key)

3. 在 Supabase 项目中配置认证设置：
   - 启用邮箱认证
   - 设置重定向 URL：
     - `http://localhost:3000/auth/callback` (开发环境)
     - `https://yourdomain.com/auth/callback` (生产环境)

## 🚀 运行项目

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 目录结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── auth/              # 认证相关页面
│   │   ├── callback/      # 认证回调处理
│   │   ├── reset-password/ # 密码重置页面
│   │   └── page.tsx       # 登录/注册页面
│   ├── dashboard/         # 受保护的仪表盘页面
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页
├── components/            # 可复用组件
│   └── ProtectedRoute.tsx # 路由保护组件
├── context/               # React Context
│   └── AuthContext.tsx    # 认证状态管理
└── lib/                   # 工具库
    └── supabase.ts        # Supabase 客户端配置
```

## 🎯 核心功能

### 1. 用户注册
- 邮箱/密码注册
- 邮箱验证流程
- 实时表单验证
- 错误处理

### 2. 用户登录
- 邮箱/密码登录
- 记住登录状态
- 自动重定向

### 3. 密码重置
- 邮箱重置密码
- 安全的重置流程
- 链接验证

### 4. 认证状态管理
- 全局认证状态
- 自动状态同步
- 路由保护

### 5. 用户界面
- 现代化黑绿色主题
- 流畅动画效果
- 响应式设计
- 无障碍支持

## 🎨 设计主题

项目采用炫酷的黑绿色主题：

- **主色调**: 黑色背景渐变
- **强调色**: 绿色到翠绿色渐变
- **动画效果**: 模糊光球背景动画
- **玻璃态效果**: 半透明背景模糊
- **交互反馈**: 悬停和点击动画

## 🔧 自定义配置

### 修改主题颜色

在 Tailwind CSS 中修改颜色配置：

```css
/* 绿色主题 */
from-green-500 to-emerald-500

/* 蓝色主题 */
from-blue-500 to-cyan-500

/* 紫色主题 */
from-purple-500 to-pink-500
```

### 添加新的认证页面

1. 在 `src/app/auth/` 目录下创建新页面
2. 使用 `useAuth` Hook 获取认证状态
3. 实现相应的认证逻辑

### 扩展用户资料

1. 更新 Supabase 数据库表结构
2. 修改 `src/lib/supabase.ts` 中的类型定义
3. 在认证流程中添加额外字段

## 🔒 安全最佳实践

本项目实现了以下安全措施：

- ✅ 客户端和服务端认证分离
- ✅ 安全的密码重置流程
- ✅ 邮箱验证要求
- ✅ 客户端路由保护
- ✅ 错误信息脱敏
- ✅ 会话管理

## 🚀 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 添加环境变量
3. 更新 Supabase 重定向 URL
4. 部署

### 其他平台

确保设置正确的环境变量并更新 Supabase 配置中的重定向 URL。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🎉 开始使用

1. 克隆项目并安装依赖
2. 配置 Supabase 环境变量
3. 启动开发服务器
4. 访问 `/auth` 开始使用认证功能

享受编码吧！🚀
