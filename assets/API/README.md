# API测试脚本使用说明

## 文件结构

```
assets/API/
├── DeviceLogAPI.ts          # 设备日志API通信核心脚本
├── APITestButtons.ts        # API测试按钮脚本（包含18个测试按钮）
└── README.md               # 使用说明文档
```

## 功能概述

### DeviceLogAPI.ts
- 核心API通信组件
- 负责与 `http://101.133.145.244:7071/api/saveDeviceLog` 接口通信
- 自动收集设备信息（平台、操作系统、浏览器等）
- 提供错误处理和超时机制

### APITestButtons.ts
- 暴露18个公共测试按钮，分为5个类别：

#### 1. 基础功能测试（2个按钮）
- `testConnectionBtn` - 测试API连接
- `initDeviceInfoBtn` - 初始化设备信息测试

#### 2. 日志级别测试（4个按钮）
- `sendInfoLogBtn` - 发送INFO级别日志
- `sendWarningLogBtn` - 发送WARNING级别日志
- `sendErrorLogBtn` - 发送ERROR级别日志
- `sendDebugLogBtn` - 发送DEBUG级别日志

#### 3. 游戏事件日志（4个按钮）
- `gameStartLogBtn` - 游戏开始日志
- `gameEndLogBtn` - 游戏结束日志
- `levelCompleteLogBtn` - 关卡完成日志
- `userActionLogBtn` - 用户行为日志

#### 4. 性能监控日志（3个按钮）
- `performanceLogBtn` - 性能监控日志
- `memoryUsageLogBtn` - 内存使用日志
- `fpsLogBtn` - FPS监控日志

#### 5. 错误监控日志（3个按钮）
- `crashReportBtn` - 崩溃报告
- `networkErrorBtn` - 网络错误日志
- `resourceErrorBtn` - 资源加载错误日志

#### 6. 自定义数据日志（2个按钮）
- `customDataBtn` - 自定义数据日志
- `batchLogBtn` - 批量日志发送

#### 7. 状态显示
- `statusLabel` - 显示当前操作状态

## 使用方法

### 1. 添加组件到场景
1. 在Cocos Creator中打开您的测试场景
2. 创建一个空的Node节点
3. 将 `APITestButtons` 组件添加到该节点上

### 2. 绑定按钮到属性
1. 在场景中创建18个Button节点（或根据需要创建部分按钮）
2. 在 `APITestButtons` 组件的属性面板中，将对应的Button拖拽到相应的属性字段中
3. 可选：创建一个Label节点用于显示状态信息，并绑定到 `statusLabel` 属性
4. **注意：按钮的点击事件会自动绑定，无需手动设置事件回调**

### 3. 按钮功能说明

每个按钮对应一个特定的测试功能，事件已自动绑定：

```typescript
// 基础功能
onTestConnection()      // 测试API连接
onInitDeviceInfo()      // 获取设备信息

// 日志级别
onSendInfoLog()         // 发送INFO日志
onSendWarningLog()      // 发送WARNING日志
onSendErrorLog()        // 发送ERROR日志
onSendDebugLog()        // 发送DEBUG日志

// 游戏事件
onGameStartLog()        // 游戏开始
onGameEndLog()          // 游戏结束
onLevelCompleteLog()    // 关卡完成
onUserActionLog()       // 用户行为

// 性能监控
onPerformanceLog()      // 性能监控
onMemoryUsageLog()      // 内存使用
onFpsLog()              // FPS监控

// 错误监控
onCrashReport()         // 崩溃报告
onNetworkError()        // 网络错误
onResourceError()       // 资源错误

// 自定义数据
onCustomData()          // 自定义数据
onBatchLog()            // 批量日志
```

### 4. 运行测试
1. 运行游戏
2. 点击不同的按钮测试各种API功能
3. 观察控制台输出和状态标签的反馈信息
4. 检查服务器端是否正确接收到日志数据

## API接口信息

- **接口地址**: `http://101.133.145.244:7071/api/saveDeviceLog`
- **请求方法**: POST
- **请求头**: 
  - Content-Type: application/json
  - Accept: application/json
- **超时时间**: 10秒

## 数据格式

发送到服务器的数据包含以下字段：

```typescript
{
    deviceId?: string;        // 设备ID
    deviceModel?: string;     // 设备型号
    systemVersion?: string;   // 系统版本
    appVersion?: string;      // 应用版本
    logLevel?: string;        // 日志级别
    logMessage?: string;      // 日志消息
    timestamp?: number;       // 时间戳
    userId?: string;          // 用户ID
    sessionId?: string;       // 会话ID
    errorCode?: string;       // 错误代码
    stackTrace?: string;      // 堆栈跟踪
    // ... 其他自定义字段
}
```

## 注意事项

1. 确保网络连接正常，能够访问目标API地址
2. 如果需要认证，请在 `DeviceLogAPI.ts` 中的 `sendRequest` 方法中添加认证头
3. 可以根据实际需求修改API地址和超时时间
4. 建议在正式环境中添加更完善的错误处理和重试机制
5. 所有按钮都是异步操作，点击后请等待操作完成

## 自定义扩展

如果需要添加更多测试功能：

1. 在 `APITestButtons.ts` 中添加新的 `@property(Button)` 属性
2. 实现对应的测试方法
3. 在场景中创建新的按钮并绑定到新属性
4. 根据需要修改 `DeviceLogAPI.ts` 中的数据结构和发送逻辑 