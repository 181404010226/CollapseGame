# 连云山场景上报使用说明

## 概述

本模块提供了连云山SDK的场景上报功能，包括SDK启动时的自动注册上报和按钮点击时的场景上报。

## 文件说明

- `LianyunshanReporter.ts` - 连云山场景上报器组件
- `README.md` - 使用说明文档

## 功能特性

### 1. SDK启动时自动上报注册场景
- 在 `LianyunshanSDK.ts` 中已集成，SDK启动时会自动上报 `register` 场景
- 无需额外配置，SDK初始化完成后会自动执行

### 2. 提现按钮点击场景上报
- 通过 `LianyunshanReporter` 组件实现
- 支持绑定提现按钮，点击时自动上报对应场景
- 支持三种提现场景类型

## 使用方法

### 方法一：组件绑定（推荐）

1. **添加组件到场景节点**
   - 在Cocos Creator编辑器中，选择一个场景节点
   - 添加 `LianyunshanReporter` 组件

2. **配置组件参数**
   - `Target Button`: 拖拽要监听的按钮组件
   - `Scene Type`: 从下拉列表中选择提现场景类型
     - `GOLD_WITHDRAW` - 金币提现 (gold_with_draw)
     - `RED_BAG_WITHDRAW` - 红包提现 (red_bag_with_draw)
     - `WEALTH_WITHDRAW` - 财神提现 (weath_with_draw)

3. **运行测试**
   - 运行游戏，点击绑定的按钮
   - 查看控制台日志确认上报是否成功

### 方法二：代码调用

```typescript
import { LianyunshanReporter, WITHDRAW_SCENE_NAMES } from './连云山汇报/LianyunshanReporter';

// 快速上报（静态方法）
LianyunshanReporter.quickReport(WITHDRAW_SCENE_NAMES.GOLD_WITHDRAW);

// 通过组件实例上报
const reporter = this.getComponent(LianyunshanReporter);
if (reporter) {
    reporter.reportScene(WITHDRAW_SCENE_NAMES.RED_BAG_WITHDRAW);
}
```

## 提现场景名称常量

```typescript
export const WITHDRAW_SCENE_NAMES = {
    GOLD_WITHDRAW: 'gold_with_draw',       // 金币提现
    RED_BAG_WITHDRAW: 'red_bag_with_draw', // 红包提现
    WEALTH_WITHDRAW: 'weath_with_draw'     // 财神提现
} as const;
```

**注意**: 注册场景 (`register`) 由SDK在启动时自动上报，无需手动配置。

## 配置示例

### 金币提现按钮配置
1. 选择金币提现按钮所在的节点
2. 添加 `LianyunshanReporter` 组件
3. 设置参数：
   - Target Button: 拖拽金币提现按钮
   - Scene Type: 选择 `GOLD_WITHDRAW`

### 红包提现按钮配置
1. 选择红包提现按钮所在的节点
2. 添加 `LianyunshanReporter` 组件
3. 设置参数：
   - Target Button: 拖拽红包提现按钮
   - Scene Type: 选择 `RED_BAG_WITHDRAW`

### 财神提现按钮配置
1. 选择财神提现按钮所在的节点
2. 添加 `LianyunshanReporter` 组件
3. 设置参数：
   - Target Button: 拖拽财神提现按钮
   - Scene Type: 选择 `WEALTH_WITHDRAW`

## 注意事项

1. **SDK初始化**
   - 确保 `LianyunshanSDK` 已正确初始化
   - 注册场景会在SDK启动时自动上报，无需手动配置

2. **按钮绑定**
   - 每个按钮需要单独配置一个 `LianyunshanReporter` 组件
   - 确保 `Target Button` 字段正确绑定了按钮组件

3. **场景类型选择**
   - 使用下拉列表选择场景类型，避免拼写错误
   - 组件会自动映射到正确的场景名称格式

4. **错误处理**
   - 组件会自动处理上报失败的情况
   - 查看控制台日志了解上报状态

5. **性能考虑**
   - 上报操作是异步的，不会阻塞UI
   - 避免频繁调用上报接口

## 调试信息

在开发过程中，可以通过控制台日志查看上报状态：

- `[LianyunshanReporter] 按钮被点击，准备上报场景: xxx` - 按钮点击事件
- `[LianyunshanReporter] 开始上报场景: xxx` - 开始上报
- `[LianyunshanReporter] 场景上报成功: xxx` - 上报成功
- `[LianyunshanReporter] 场景上报失败: xxx` - 上报失败
- `[LianyunshanSDK] SDK启动时注册场景上报成功` - SDK启动时注册上报成功

## 故障排除

1. **上报失败**
   - 检查网络连接
   - 确认连云山SDK已正确初始化
   - 查看控制台错误日志

2. **按钮点击无响应**
   - 检查按钮组件是否正确绑定
   - 确认组件已添加到正确的节点
   - 检查场景类型是否正确选择

3. **重复上报**
   - 避免在同一个节点上添加多个 `LianyunshanReporter` 组件
   - 确保每个按钮只绑定一个上报器