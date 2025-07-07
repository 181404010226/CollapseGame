# 风控上报功能文档

## 概述

风控上报功能是基于提供的API接口文档实现的设备风险检测系统，用于向服务器上报设备信息以进行风险评估。

## 文件结构

- `RiskDetectionService.ts` - 主要的风控上报服务类
- `RiskDetectionExample.ts` - 使用示例和工具类
- `RiskDetectionREADME.md` - 本文档

## API接口信息

**接口地址**: `/safe/riskDetection`  
**请求方式**: `POST`  
**请求数据类型**: `application/json`  
**响应数据类型**: `*/*`

### 请求参数（SysDeviceDto）

| 参数名称 | 类型 | 必须 | 说明 |
|---------|------|------|------|
| androidId | string | ✓ | 安卓ID |
| requestId | string | ✓ | 请求ID，用于防重 |
| timeStamp | number | ✓ | 时间戳 |
| deviceId | string | ✗ | 设备序列号 |
| packageName | string | ✗ | 包名 |
| simCard | string | ✗ | SIM卡信息 |
| noSimCard | boolean | ✗ | 是否无sim卡 |
| isDebug | boolean | ✗ | 是否开启调试 |
| isCharging | boolean | ✗ | 是否充电中 |
| isVpn | boolean | ✗ | 是否开启VPN |
| isRoot | boolean | ✗ | 是否刷机/越狱 |
| isCleanData | boolean | ✗ | 是否清理数据 |
| isResetIdfa | boolean | ✗ | 是否重置广告标识 |
| idfa | string | ✗ | 广告标识符 |
| appVersion | string | ✗ | APP版本 |
| platform | string | ✗ | 设备平台类型 |
| model | string | ✗ | 设备型号 |
| brand | string | ✗ | 设备品牌 |
| channel | string | ✗ | 应用渠道 |
| isNetwork | boolean | ✗ | 是否有网络 |
| isWifi | boolean | ✗ | 是否wifi联网 |
| hasGyroscope | boolean | ✗ | 是否开启陀螺仪/重力传感器 |
| osVersion | string | ✗ | 操作系统版本 |
| devToken | string | ✗ | 连山云dev_token |

### 响应参数

| 参数名称 | 类型 | 说明 |
|---------|------|------|
| error | boolean | 是否发生错误 |
| success | boolean | 是否成功 |
| warn | boolean | 是否有警告 |
| empty | boolean | 是否为空数据 |

## 使用方法

### 1. 基础使用

```typescript
import { RiskDetectionService } from './RiskDetectionService';

// 在组件中添加风控服务
const riskService = this.addComponent(RiskDetectionService);

// 执行风控检测（使用真实设备信息）
try {
    const response = await riskService.performRiskDetection();
    console.log('风控检测结果:', response);
} catch (error) {
    console.error('风控检测失败:', error);
}
```

### 2. 使用模拟数据测试

```typescript
// 使用模拟数据进行测试
try {
    const response = await riskService.performRiskDetectionWithMockData();
    console.log('模拟数据检测结果:', response);
} catch (error) {
    console.error('模拟检测失败:', error);
}
```

### 3. 自动定时上报

```typescript
// 启动自动上报（默认5分钟间隔）
riskService.startAutoReport();

// 设置自定义间隔（毫秒）
riskService.setAutoReportInterval(600000); // 10分钟

// 停止自动上报
riskService.stopAutoReport();
```

### 4. 使用示例组件

```typescript
import { RiskDetectionExample } from './RiskDetectionExample';

// 添加示例组件到节点
const example = this.addComponent(RiskDetectionExample);

// 手动触发检测
const result = await example.triggerRiskDetection();
```

### 5. 快速工具函数

```typescript
import { RiskDetectionUtils } from './RiskDetectionExample';

// 快速执行一次检测
const result = await RiskDetectionUtils.quickRiskDetection();

// 快速执行模拟数据检测
const mockResult = await RiskDetectionUtils.quickMockRiskDetection();
```

## 配置说明

### API配置

在 `ApiConfig.ts` 中配置API相关信息：

```typescript
// 基础URL
baseUrl: 'http://101.133.145.244:7071'

// 风控端点
ENDPOINTS.RISK_DETECTION: '/safe/riskDetection'
```

### 自动上报间隔

默认自动上报间隔为5分钟（300000毫秒），可以通过以下方式修改：

```typescript
// 在服务中设置
riskService.setAutoReportInterval(600000); // 10分钟

// 或在组件属性中修改
@property
private autoReportInterval: number = 600000; // 10分钟
```

## 设备信息收集

风控上报会自动收集以下设备信息：

- **Android ID**: 设备唯一标识
- **设备型号**: 如 SM-G975F, MI 10 等
- **设备品牌**: 如 Samsung, Xiaomi 等
- **操作系统版本**: Android/iOS版本号
- **网络状态**: WiFi/移动网络状态
- **SIM卡信息**: 运营商信息
- **硬件信息**: 陀螺仪、电池等状态
- **安全状态**: Root/越狱、VPN、调试模式等

## 错误处理

```typescript
try {
    const result = await riskService.performRiskDetection();
    
    // 根据响应状态处理
    if (result.success) {
        console.log('✅ 风控检测通过');
    } else if (result.error) {
        console.log('❌ 风控检测发现异常');
    } else if (result.warn) {
        console.log('⚠️ 风控检测发现警告');
    }
    
} catch (error) {
    console.error('请求失败:', error.message);
    
    // 处理不同类型的错误
    if (error.message.includes('超时')) {
        console.log('网络超时，请检查网络连接');
    } else if (error.message.includes('HTTP错误')) {
        console.log('服务器响应错误');
    }
}
```

## 调试和日志

启用调试模式查看详细日志：

```typescript
// 在ApiConfig.ts中设置
DEV_MODE: {
    ENABLE_DEBUG_LOGS: true  // 启用详细调试日志
}
```

日志输出包括：
- 设备信息收集过程
- 请求数据构建
- 网络请求详情
- 响应解析结果

## 注意事项

1. **网络权限**: 确保应用有网络访问权限
2. **设备权限**: 某些设备信息需要特定权限
3. **频率控制**: 避免过于频繁的上报请求
4. **错误重试**: 网络失败时可以考虑重试机制
5. **数据保护**: 注意保护用户隐私数据

## 测试建议

1. **开发阶段**: 使用模拟数据测试功能
2. **真机测试**: 在真实设备上验证数据收集
3. **网络测试**: 测试不同网络环境下的表现
4. **边界测试**: 测试网络异常、超时等情况

## 更新日志

- **v1.0.0**: 初始版本，实现基础风控上报功能
- 支持真实设备信息和模拟数据测试
- 支持自动定时上报
- 提供完整的使用示例和工具函数 