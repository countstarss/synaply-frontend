# 页面动画测试指南

## 测试目标
验证所有页面切换都使用统一的从左向右滑动动画。

## 预期行为

### ✅ 正确的动画效果
1. **新页面进入**：
   - 从屏幕左侧(-100%)滑入
   - 滑动到中央位置(0%)
   - 透明度从0变为1
   - z-index为10（最顶层）

2. **旧页面退出**：
   - 从中央位置(0%)开始
   - 滑动到屏幕右侧(100%)
   - 透明度从1变为0
   - z-index为5（中间层）

3. **其他隐藏页面**：
   - 保持在左侧(-100%)待命
   - 透明度为0
   - z-index为1（底层）

## 测试步骤

### 1. 基础页面切换测试
- 从 Dashboard → Docs
- 从 Docs → Settings  
- 从 Settings → Inbox
- 从 Inbox → Dashboard

**检查要点**：
- ✅ 新页面从左侧滑入
- ✅ 旧页面向右侧滑出
- ✅ 动画持续时间300ms
- ✅ 没有闪烁或跳跃
- ✅ 滑动方向完全一致

### 2. 特殊页面测试
- 测试设置页面是否保持统一动画
- 测试模态框风格页面（如果有配置）

### 3. 浏览器导航测试
- 使用浏览器后退按钮
- 使用浏览器前进按钮
- 直接在地址栏输入URL

## 动画调试

### 开发者工具检查
1. 打开浏览器开发者工具
2. 查看Console日志中的动画状态：
   ```
   🎭 [pageId] 动画状态: {
     isVisible: true/false,
     isCurrentPage: true/false,
     animationDirection: "left-to-right",
     transform: "translateX(0%)" / "translateX(-100%)" / "translateX(100%)",
     opacity: 0 / 1
   }
   ```

### CSS检查
确认页面元素的style属性：
```css
/* 可见页面 */
transform: translateX(0%);
opacity: 1;
z-index: 10;

/* 退出页面 */
transform: translateX(100%);
opacity: 0;
z-index: 5;

/* 待命页面 */
transform: translateX(-100%);
opacity: 0;
z-index: 1;
```

## 常见问题排查

### ❌ 问题：页面从右侧进入
**原因**: 页面被错误地分类为退出页面
**解决**: 检查 `isCurrentPage` 判断逻辑

### ❌ 问题：页面向左侧退出
**原因**: 使用了错误的动画方向配置
**解决**: 确保所有页面使用 `left-to-right` 方向

### ❌ 问题：动画不流畅或有跳跃
**原因**: z-index层级冲突或transition设置问题
**解决**: 检查CSS层级和transition配置

### ❌ 问题：页面不显示或黑屏
**原因**: 页面状态管理或路由问题
**解决**: 检查pageCache store和路由配置

## 性能检查

### 帧率监控
- 使用开发者工具的Performance面板
- 动画期间应保持60fps
- CPU使用率应该合理

### 内存使用
- 检查是否有内存泄漏
- 页面缓存数量是否合理
- 垃圾回收是否正常

## 验收标准

### ✅ 通过条件
- [ ] 所有页面切换都是从左向右
- [ ] 新页面从左侧滑入
- [ ] 旧页面向右侧滑出
- [ ] 动画流畅，无闪烁
- [ ] 没有性能问题
- [ ] 控制台没有错误信息
- [ ] 浏览器导航正常工作

### 🎯 最终目标
实现类似原生应用的页面切换体验：
- 统一的视觉方向
- 流畅的动画效果
- 一致的用户体验
- 优秀的性能表现

## 自动化测试建议

可以考虑添加E2E测试来自动验证动画效果：
```typescript
// 示例：Playwright测试
test('页面切换动画', async ({ page }) => {
  await page.goto('/dashboard');
  
  // 点击导航到docs
  await page.click('[data-testid="docs-nav"]');
  
  // 验证动画效果
  const newPage = page.locator('[data-testid="docs-page"]');
  await expect(newPage).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)'); // translateX(0)
  
  const oldPage = page.locator('[data-testid="dashboard-page"]');
  await expect(oldPage).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 100, 0)'); // translateX(100%)
});
``` 