import { _decorator, Component, Node, sys, log } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 设备日志数据接口
 */
interface DeviceLogData {
    deviceId?: string;
    deviceModel?: string;
    systemVersion?: string;
    appVersion?: string;
    logLevel?: string;
    logMessage?: string;
    timestamp?: number;
    userId?: string;
    sessionId?: string;
    errorCode?: string;
    stackTrace?: string;
    // 游戏事件相关字段
    eventType?: string;
    gameLevel?: number;
    score?: number;
    playTime?: number;
    actionType?: string;
    // 性能监控相关字段
    fps?: number;
    memoryUsage?: number;
    memoryLimit?: number;
    cpuUsage?: number;
    targetFps?: number;
    // 批量日志相关字段
    batchId?: string;
    sequenceNumber?: number;
    // 自定义字段支持
    customField1?: string;
    customField2?: number;
    customField3?: boolean;
    businessData?: any;
    // 索引签名，允许任意自定义字段
    [key: string]: any;
}

/**
 * API响应接口
 */
interface APIResponse {
    code: number;
    message: string;
    data?: any;
}

@ccclass('DeviceLogAPI')
export class DeviceLogAPI extends Component {
    
    @property
    private apiBaseUrl: string = 'http://101.133.145.244:7071';
    
    @property
    private timeout: number = 10000; // 10秒超时
    
    start() {
        // 组件启动时可以进行初始化
        this.initDeviceInfo();
    }

    /**
     * 初始化设备信息
     */
    private initDeviceInfo() {
        log('设备信息初始化完成');
        log('平台:', sys.platform);
        log('操作系统:', sys.os);
        log('浏览器类型:', sys.browserType);
        log('浏览器版本:', sys.browserVersion);
    }

    /**
     * 获取设备基础信息
     */
    private getDeviceInfo(): Partial<DeviceLogData> {
        const deviceInfo: Partial<DeviceLogData> = {
            deviceModel: sys.platform,
            systemVersion: `${sys.os} ${sys.browserVersion}`,
            appVersion: '1.0.0', // 可以从配置中获取
            timestamp: Date.now(),
            sessionId: this.generateSessionId()
        };
        
        return deviceInfo;
    }

    /**
     * 生成会话ID
     */
    private generateSessionId(): string {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 发送设备日志到服务器
     * @param logData 日志数据
     */
    public async saveDeviceLog(logData: Partial<DeviceLogData>): Promise<APIResponse> {
        try {
            // 合并设备基础信息和传入的日志数据
            const deviceInfo = this.getDeviceInfo();
            const fullLogData: DeviceLogData = {
                ...deviceInfo,
                ...logData
            };

            log('准备发送设备日志:', fullLogData);

            const response = await this.sendRequest('/api/saveDeviceLog', fullLogData);
            
            log('设备日志发送成功:', response);
            return response;
            
        } catch (error) {
            log('设备日志发送失败:', error);
            throw error;
        }
    }

    /**
     * 发送HTTP请求
     * @param endpoint API端点
     * @param data 请求数据
     */
    private async sendRequest(endpoint: string, data: any): Promise<APIResponse> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = this.apiBaseUrl + endpoint;
            
            xhr.timeout = this.timeout;
            xhr.ontimeout = () => {
                reject(new Error('请求超时'));
            };
            
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response: APIResponse = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (parseError) {
                            reject(new Error('响应解析失败: ' + parseError));
                        }
                    } else {
                        reject(new Error(`HTTP错误: ${xhr.status} - ${xhr.statusText}`));
                    }
                }
            };
            
            xhr.onerror = () => {
                reject(new Error('网络请求失败'));
            };
            
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Accept', 'application/json');
            
            // 如果需要添加认证头，可以在这里添加
            // xhr.setRequestHeader('Authorization', 'Bearer your-token');
            
            xhr.send(JSON.stringify(data));
        });
    }

    /**
     * 发送普通日志
     * @param message 日志消息
     * @param level 日志级别
     */
    public async logInfo(message: string, level: string = 'INFO'): Promise<void> {
        try {
            await this.saveDeviceLog({
                logLevel: level,
                logMessage: message,
                userId: this.getCurrentUserId()
            });
        } catch (error) {
            log('发送普通日志失败:', error);
        }
    }

    /**
     * 发送错误日志
     * @param error 错误对象
     * @param errorCode 错误代码
     */
    public async logError(error: Error, errorCode?: string): Promise<void> {
        try {
            await this.saveDeviceLog({
                logLevel: 'ERROR',
                logMessage: error.message,
                errorCode: errorCode,
                stackTrace: error.stack,
                userId: this.getCurrentUserId()
            });
        } catch (sendError) {
            log('发送错误日志失败:', sendError);
        }
    }

    /**
     * 获取当前用户ID（示例实现）
     */
    private getCurrentUserId(): string {
        // 这里应该从游戏的用户系统中获取真实的用户ID
        return 'user_' + Date.now();
    }

    /**
     * 测试API连接
     */
    public async testConnection(): Promise<boolean> {
        try {
            const testData: Partial<DeviceLogData> = {
                logLevel: 'TEST',
                logMessage: 'API连接测试',
                userId: 'test_user'
            };
            
            await this.saveDeviceLog(testData);
            log('API连接测试成功');
            return true;
            
        } catch (error) {
            log('API连接测试失败:', error);
            return false;
        }
    }
} 