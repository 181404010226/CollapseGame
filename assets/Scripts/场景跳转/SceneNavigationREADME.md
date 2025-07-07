# 场景导航组件使用说明

## 简介
场景导航组件（SceneNavigator）用于实现按钮点击跳转到其他场景的功能。通过将此组件添加到按钮节点上，可以轻松实现场景之间的切换。

## 使用方法

### 方法一：直接添加组件到按钮

1. 在场景中选中需要添加跳转功能的按钮节点
2. 在属性检查器中点击"添加组件" -> "自定义脚本" -> "SceneNavigator"
3. 在属性检查器中设置 `targetSceneName` 为目标场景的名称
4. 确保 `autoNavigateOnClick` 选项为勾选状态（默认已勾选）

完成以上步骤后，当点击该按钮时，将自动跳转到指定的场景。

### 方法二：使用SceneNavigationExample组件

1. 在场景的任意节点上添加 `SceneNavigationExample` 组件
2. 将需要添加跳转功能的按钮节点拖拽到 `navigationButton` 属性中
3. 在 `targetSceneName` 属性中填写目标场景的名称

### 方法三：通过代码控制

```typescript
// 导入SceneNavigator组件
import { SceneNavigator } from './SceneNavigator';

// 获取或添加SceneNavigator组件
const button = this.getComponent(Button);
let navigator = button.getComponent(SceneNavigator);
if (!navigator) {
    navigator = button.addComponent(SceneNavigator);
}

// 设置目标场景
navigator.targetSceneName = "目标场景名称";

// 手动触发场景跳转
navigator.navigateToScene();

// 或者设置目标场景并立即跳转
navigator.setTargetAndNavigate("目标场景名称");
```

## 注意事项

1. 确保目标场景已经添加到构建设置中，否则无法正常加载
2. 场景名称区分大小写，请确保输入正确
3. 如果需要在场景跳转前执行其他操作，可以禁用 `autoNavigateOnClick` 选项，然后通过代码手动控制跳转时机

## 常见问题解决方案

### 1. 报错: Cannot read properties of null (reading 'off')

如果遇到 `TypeError: Cannot read properties of null (reading 'off')` 错误，可能是由以下原因导致：

- 按钮节点在场景切换过程中被提前销毁
- 按钮组件未正确初始化

**解决方案：**

- 确保在使用 SceneNavigator 组件的节点上有 Button 组件
- 如果问题仍然存在，可以尝试在按钮点击事件中使用以下代码手动跳转，而不是依赖组件的自动跳转：

```typescript
import { director } from 'cc';

// 直接使用 director 加载场景
director.loadScene("目标场景名称");
```

### 2. 场景无法加载

如果点击按钮后没有跳转到目标场景，请检查：

- 目标场景名称是否正确（区分大小写）
- 目标场景是否已添加到构建设置中
- 控制台是否有相关错误信息

### 3. 按钮点击无反应

如果按钮点击没有任何反应，请检查：

- 按钮组件的 Interactable 属性是否为勾选状态
- 按钮是否被其他UI元素遮挡
- SceneNavigator 组件是否正确添加并配置 

# 弹窗系统使用说明

## 概述

本弹窗系统提供了一种简单的方式来在游戏或应用中显示和隐藏弹窗。系统包含以下组件：

1. `PopupButtonBinder.ts` - 将按钮与预制体弹窗绑定，点击按钮显示弹窗
2. `PopupHiderButton.ts` - 添加到弹窗中的关闭按钮，点击后隐藏弹窗
3. `PopupHider.ts` - 简化版的弹窗隐藏组件，不包含动画效果

## 使用方法

### 方法一：在编辑器中设置（推荐）

#### 显示弹窗

1. 将 `PopupButtonBinder` 组件添加到触发按钮上
2. 设置组件属性：
   - `popupPrefab` - 要显示的弹窗预制体
   - `popupContainer` - 弹窗的父节点容器（通常是Canvas或其他UI根节点）
   - `useAnimation` - 是否使用动画效果
   - `animationDuration` - 动画持续时间（秒）
   - `createBackgroundMask` - 是否创建背景遮罩
   - `maskOpacity` - 背景遮罩透明度（0-255）
   - `destroyAfterHide` - 是否在隐藏后销毁节点（**重要：设置为false以便重复使用**）

#### 隐藏弹窗

1. 将 `PopupHiderButton` 组件添加到弹窗中的关闭按钮上
2. 设置组件属性：
   - `popupRoot` - 要隐藏的弹窗根节点（如果不指定，默认使用当前节点的父节点）
   - `useAnimation` - 是否使用动画效果
   - `animationDuration` - 动画持续时间（秒）
   - `destroyAfterHide` - 是否在隐藏后销毁节点（**重要：设置为false以便重复使用**）

### 方法二：通过代码动态创建

```typescript
// 显示弹窗
const popupBinder = button.addComponent(PopupButtonBinder);
popupBinder.popupPrefab = myPopupPrefab;
popupBinder.popupContainer = canvas;
popupBinder.useAnimation = true;
popupBinder.destroyAfterHide = false;

// 手动显示弹窗
popupBinder.showPopup();

// 手动隐藏弹窗
popupBinder.hidePopup();
```

## 注意事项

1. **重复使用问题**：如果希望弹窗可以重复打开和关闭，确保将 `destroyAfterHide` 设置为 `false`。
2. **弹窗位置**：弹窗会在父容器中居中显示，可以通过调整预制体中的布局来更改位置。
3. **背景遮罩**：默认会创建半透明背景遮罩，点击遮罩也会关闭弹窗。
4. **动画效果**：默认使用缩放和透明度动画，可以通过设置 `useAnimation` 为 `false` 来禁用。

## 示例

可以参考 `ButtonToPopupExample.ts` 脚本中的示例代码，了解如何使用弹窗系统。

## 故障排除

1. **弹窗无法第二次打开**：确保 `destroyAfterHide` 设置为 `false`。
2. **弹窗位置不正确**：检查预制体中的锚点和位置设置。
3. **动画效果不生效**：确保 `useAnimation` 设置为 `true`，并且动画持续时间大于0。 