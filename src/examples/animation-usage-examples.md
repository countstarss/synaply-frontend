# 页面动画配置使用示例

这个文档展示了如何使用新的统一页面动画系统。默认情况下，所有页面都使用从左向右的滑动动画，但可以通过提供的接口为特殊页面配置自定义动画方向。

## 核心概念

### 默认行为
- 🎯 **统一方向**: 所有页面切换都是从左向右滑动
- 📥 **新页面进入**: 从左侧(-100%)滑入到中央(0%)
- 📤 **旧页面退出**: 从中央(0%)滑向右侧(100%)
- ✨ **完全统一**: 新老页面的滑动方向完全一致，确保流畅体验

### 支持的动画方向
- `left-to-right`: 从左向右（🌟 **强烈推荐** - 统一默认方向）
- `right-to-left`: 从右向左（⚠️ 特殊场景使用）
- `top-to-bottom`: 从上向下（适合模态框等垂直弹出场景）
- `bottom-to-top`: 从下向上（适合底部弹出菜单等场景）

> **注意**: 为了保持用户体验的一致性，强烈建议大部分页面使用默认的 `left-to-right` 方向。

## 使用示例

### 1. 基础使用 - 设置单个页面的自定义动画

```typescript
import { setPageAnimation } from "@/lib/page-animations";

// 设置页面保持统一的左向右滑动（推荐）
setPageAnimation("settings", {
  exitDirection: "left-to-right",  // 退出时向右侧滑动
  enterDirection: "left-to-right"  // 进入时从左侧滑入
});

// 如果确实需要特殊的退出效果（不推荐，会破坏一致性）
// setPageAnimation("settings", {
//   exitDirection: "right-to-left",  // 特殊退出方向
//   enterDirection: "left-to-right"  // 保持统一的进入方向
// });
```

### 2. 使用预设配置

```typescript
import { applyAnimationPreset } from "@/lib/page-animations";

// 使用右向左预设
applyAnimationPreset("settings", "RIGHT_TO_LEFT");

// 使用从下向上预设（适合模态框风格的页面）
applyAnimationPreset("profile", "BOTTOM_TO_TOP");
```

### 3. 应用特殊动画场景

```typescript
import { applySpecialAnimation } from "@/lib/page-animations";

// 应用设置页面的特殊退出动画
applySpecialAnimation("settings", "SETTINGS_EXIT_RIGHT_TO_LEFT");

// 为侧边栏风格的页面应用特殊动画
applySpecialAnimation("sidebar-page", "SIDEBAR_STYLE");
```

### 4. 批量配置多个页面

```typescript
import { setBatchPageAnimations } from "@/lib/page-animations";

setBatchPageAnimations([
  // 设置页面使用特殊退出动画
  { 
    pageId: "settings", 
    exitDirection: "right-to-left",
    enterDirection: "left-to-right" 
  },
  // 用户资料页面使用从下向上的动画
  { 
    pageId: "profile", 
    enterDirection: "bottom-to-top",
    exitDirection: "top-to-bottom" 
  },
  // 帮助页面保持默认动画
  { 
    pageId: "help", 
    enterDirection: "left-to-right",
    exitDirection: "left-to-right" 
  }
]);
```

### 5. 条件性动画配置

```typescript
import { setPageAnimation, applyAnimationPreset } from "@/lib/page-animations";

export const configureAnimationsBasedOnRoute = (fromPath: string, toPath: string) => {
  // 从设置页面退出时使用特殊动画
  if (fromPath.includes('/settings') && !toPath.includes('/settings')) {
    setPageAnimation("settings", {
      exitDirection: "right-to-left"
    });
  }
  
  // 进入仪表板时使用默认动画
  if (toPath.includes('/dashboard')) {
    applyAnimationPreset("dashboard", "DEFAULT");
  }
  
  // 打开模态框风格的页面时使用从下向上的动画
  if (toPath.includes('/modal') || toPath.includes('/popup')) {
    const pageId = getPageIdFromPath(toPath);
    if (pageId) {
      applyAnimationPreset(pageId, "BOTTOM_TO_TOP");
    }
  }
};
```

### 6. 完整的应用初始化配置

```typescript
import { applyAnimationPreset, applySpecialAnimation } from "@/lib/page-animations";

export const setupAllPageAnimations = () => {
  // 默认页面保持左向右动画
  applyAnimationPreset("dashboard", "DEFAULT");
  applyAnimationPreset("docs", "DEFAULT");
  applyAnimationPreset("inbox", "DEFAULT");
  
  // 设置页面使用特殊退出动画
  applySpecialAnimation("settings", "SETTINGS_EXIT_RIGHT_TO_LEFT");
  
  // 模态框风格的页面
  applyAnimationPreset("user-profile", "BOTTOM_TO_TOP");
  applyAnimationPreset("quick-settings", "BOTTOM_TO_TOP");
};
```

### 7. 在React组件中使用

```typescript
import React, { useEffect } from 'react';
import { setPageAnimation, applyAnimationPreset } from '@/lib/page-animations';

export const MyComponent = () => {
  useEffect(() => {
    // 根据某些条件设置不同的动画
    const userPreference = localStorage.getItem('animation-preference');
    
    if (userPreference === 'smooth') {
      // 使用更平滑的动画
      setPageAnimation("settings", {
        exitDirection: "right-to-left",
        enterDirection: "left-to-right"
      });
    } else {
      // 使用默认动画
      applyAnimationPreset("settings", "DEFAULT");
    }
  }, []);

  return <div>My Component</div>;
};

// 在应用初始化时配置所有页面的动画
export const AppInitializer = () => {
  useEffect(() => {
    setupAllPageAnimations();
  }, []);

  return null;
};
```

## 预设配置

### 可用的预设

```typescript
const ANIMATION_PRESETS = {
  // 默认从左向右
  DEFAULT: {
    enterDirection: "left-to-right",
    exitDirection: "left-to-right",
  },
  // 从右向左（可用于退出动画）
  RIGHT_TO_LEFT: {
    enterDirection: "right-to-left",
    exitDirection: "right-to-left",
  },
  // 从上向下
  TOP_TO_BOTTOM: {
    enterDirection: "top-to-bottom",
    exitDirection: "top-to-bottom",
  },
  // 从下向上
  BOTTOM_TO_TOP: {
    enterDirection: "bottom-to-top",
    exitDirection: "bottom-to-top",
  },
};
```

### 特殊场景配置

```typescript
const SPECIAL_ANIMATIONS = {
  // 设置页面退出时使用右向左动画
  SETTINGS_EXIT_RIGHT_TO_LEFT: {
    pageId: "settings",
    exitDirection: "right-to-left",
    enterDirection: "left-to-right", // 进入时仍然从左向右
  },
  
  // 模态框风格的页面（从下向上）
  MODAL_STYLE: {
    enterDirection: "bottom-to-top",
    exitDirection: "top-to-bottom",
  },
  
  // 侧边栏风格的页面（从右向左）
  SIDEBAR_STYLE: {
    enterDirection: "right-to-left",
    exitDirection: "right-to-left",
  },
};
```

## 最佳实践

1. **保持一致性**: 大部分页面保持默认的左向右动画以保持一致性
2. **特殊用途**: 只为有特殊交互需求的页面（如设置、模态框）使用自定义动画
3. **初始化配置**: 在应用初始化时配置所有特殊页面的动画
4. **性能优化**: 动画配置会被缓存，不会影响运行时性能
5. **硬件加速**: 所有动画都使用 CSS transform，享受硬件加速优化

## 快速开始

1. 导入所需函数：
   ```typescript
   import { setPageAnimation } from '@/lib/page-animations'
   ```

2. 调用配置函数：
   ```typescript
   setPageAnimation("pageId", { exitDirection: "right-to-left" })
   ```

3. 在应用初始化时调用：
   ```typescript
   setupAllPageAnimations()
   ```

## 总结

这个统一的页面动画系统提供了：
- 🎯 **统一性**: 默认从左向右的一致体验
- 🔧 **灵活性**: 为特殊页面提供自定义配置接口
- ⚡ **性能**: CSS transform硬件加速
- 🎨 **易用性**: 简单的API和预设配置
</rewritten_file> 