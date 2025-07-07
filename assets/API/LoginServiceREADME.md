# LoginService 登录服务

## 概述

`LoginService` 是一个用于处理游戏登录功能的服务类，支持游客登录和微信登录两种模式。该服务参考了 `RiskDetectionService` 的架构设计，提供了完整的登录流程管理和Token管理功能。

## 功能特性

- ✅ 游客登录（无需任何用户信息）
- ✅ 微信登录（需要微信授权码）
- ✅ 自动登录（根据环境自动选择登录方式）
- ✅ Token管理（自动保存、验证、过期检查）
- ✅ 模拟数据支持（便于测试和开发）
- ✅ 设备信息自动收集
- ✅ 错误处理和日志记录

## 接口文档

### 登录接口
- **地址**: `/base/login`
- **方法**: `POST`
- **数据类型**: `application/json`

### 请求参数

| 参数名称 | 类型 | 必需 | 说明 |
|---------|------|------|------|
| androidId | string | ✓ | 安卓设备ID |
| deviceId | string | ✓ | 设备序列号 |
| requestId | string | ✓ | 请求ID（防重复） |
| timeStamp | number | ✓ | 时间戳 |
| packageName | string |  | 应用包名 |
| code | string |  | 微信登录码（有则为微信登录，无则为游客登录） |
| releaseChannel | string |  | 发布渠道 |

### 响应参数

| 参数名称 | 类型 | 说明 |
|---------|------|------|
| openid | string | 用户OpenID |
| wechatNickname | string | 微信昵称 |
| wechatAvatar | string | 微信头像URL |
| isRealName | boolean | 是否已实名认证 |
| access_token | string | 访问令牌 |
| expire_in | number | 令牌有效期（秒） |
| client_id | string | 应用ID |

## 快速开始

### 1. 基本使用

```typescript
import { LoginService, LoginResponse } from './LoginService';

// 在 Component 中使用
export class MyLoginController extends Component {
    private loginService: LoginService = null;

    start() {
        // 获取或创建 LoginService
        this.loginService = this.getComponent(LoginService);
        if (!this.loginService) {
            this.loginService = this.addComponent(LoginService);
        }
    }

    // 游客登录
    async guestLogin() {
        try {
            const result = await this.loginService.performGuestLoginWithMockData();
            console.log('游客登录成功:', result);
        } catch (error) {
            console.error('游客登录失败:', error);
        }
    }

    // 微信登录
    async wechatLogin() {
        try {
            const result = await this.loginService.performWeChatLoginWithMockData();
            console.log('微信登录成功:', result);
        } catch (error) {
            console.error('微信登录失败:', error);
        }
    }
}
```

### 2. 自动登录

```typescript
// 根据环境自动选择登录方式
async autoLogin() {
    try {
        const result = await this.loginService.performAutoLogin();
        console.log('自动登录成功:', result);
    } catch (error) {
        console.error('自动登录失败:', error);
    }
}
```

### 3. Token管理

```typescript
// 检查Token是否有效
if (this.loginService.isTokenValid()) {
    console.log('Token有效，剩余时间:', this.loginService.getTokenRemainingTime(), '秒');
} else {
    console.log('Token已失效，需要重新登录');
}

// 获取当前Token
const token = this.loginService.getCurrentToken();

// 清除Token（登出）
this.loginService.clearToken();
```

## 示例项目

我们提供了完整的示例项目 `LoginServiceExample`，展示了如何在UI中使用登录服务：

### 示例功能
- 游客登录按钮
- 微信登录按钮  
- 自动登录按钮
- 登出按钮
- Token状态检查
- 实时状态显示
- 用户信息显示
- Token信息显示

### 使用示例组件

1. 将 `LoginServiceExample` 脚本添加到你的UI节点上
2. 在Inspector中配置UI组件引用：
   - `guestLoginButton`: 游客登录按钮
   - `wechatLoginButton`: 微信登录按钮
   - `autoLoginButton`: 自动登录按钮
   - `logoutButton`: 登出按钮
   - `checkTokenButton`: 检查Token按钮
   - `statusLabel`: 状态显示标签
   - `userInfoLabel`: 用户信息标签
   - `tokenLabel`: Token信息标签

## 依赖关系

LoginService 依赖以下组件，会自动创建：

- `DeviceInfoCollector`: 设备信息收集器
- `EncryptedApiClient`: 加密API客户端
- `ApiConfig`: API配置管理

确保这些组件在项目中可用。

## 配置说明

### API配置

在 `ApiConfig` 中配置相关参数：

```typescript
// 确保以下方法在 ApiConfig 中实现
ApiConfig.getFullUrl(endpoint)     // 获取完整API地址
ApiConfig.getTimeout()             // 获取请求超时时间
ApiConfig.getPackageName()         // 获取应用包名
ApiConfig.getReleaseChannel()      // 获取发布渠道
ApiConfig.getVersionName()         // 获取应用版本
```

## 调试和测试

### 模拟数据模式

所有带 `WithMockData` 后缀的方法都使用模拟数据，适合开发和测试：

```typescript
// 使用模拟数据进行游客登录
await this.loginService.performGuestLoginWithMockData();

// 使用模拟数据进行微信登录
await this.loginService.performWeChatLoginWithMockData();
```

### 真实数据模式

不带 `WithMockData` 后缀的方法会使用真实设备信息：

```typescript
// 使用真实设备信息进行游客登录
await this.loginService.performGuestLogin();

// 使用真实设备信息进行微信登录（需要真实的微信授权码）
await this.loginService.performWeChatLogin(realWeChatCode);
```

### 日志输出

服务会输出详细的日志信息，便于调试：

```
[LoginService] 开始执行游客登录...
[LoginService] 设备信息收集完成: {...}
[LoginService] 游客登录请求数据: {...}
[LoginService] 发送登录请求到: https://api.example.com/base/login
[LoginService] 游客登录成功: {...}
[LoginService] Token已保存: {...}
```

## 错误处理

服务提供了完善的错误处理机制：

```typescript
try {
    const result = await this.loginService.performGuestLogin();
    // 处理成功结果
} catch (error) {
    if (error.message.includes('超时')) {
        // 处理超时错误
    } else if (error.message.includes('网络')) {
        // 处理网络错误
    } else {
        // 处理其他错误
    }
}
```

常见错误类型：
- `登录请求超时`: 网络请求超时
- `登录网络请求失败`: 网络连接失败
- `登录HTTP错误: xxx`: HTTP状态码错误
- `登录响应解析失败`: 服务器响应格式错误

## 最佳实践

1. **初始化检查**: 在使用前确保 LoginService 已正确初始化
2. **Token管理**: 定期检查Token有效性，及时刷新
3. **错误处理**: 为所有登录操作添加适当的错误处理
4. **用户体验**: 在登录过程中显示加载状态
5. **安全考虑**: 不要在客户端长期存储敏感的Token信息

## 更新日志

### v1.0.0
- 初始版本发布
- 支持游客登录和微信登录
- 完整的Token管理功能
- 提供模拟数据测试模式
- 包含完整的使用示例

## 技术支持

如果您在使用过程中遇到问题，请：

1. 检查控制台日志输出
2. 确认网络连接和API配置
3. 验证依赖组件是否正确加载
4. 查看示例项目的实现方式

---

**注意**: 本服务设计用于开发和测试环境。在生产环境中使用时，请确保：
- API端点配置正确
- 网络安全策略已配置
- 用户数据处理符合隐私政策
- Token存储策略符合安全要求 