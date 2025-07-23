import { _decorator, Component, log, warn, sys } from 'cc';
import { DeviceInfoCollector, DeviceInfo } from './DeviceInfoCollector';
import { EncryptedApiClient, ApiResponse } from './EncryptedApiClient';
import { ApiConfig } from './ApiConfig';

const { ccclass, property } = _decorator;

/**
 * 风控上报请求参数（SysDeviceDto）
 */
export interface RiskDetectionRequest {
    androidId: string;
    deviceId?: string;
    requestId: string;
    timeStamp: number;
    packageName?: string;
    simCard?: string;
    noSimCard?: boolean;
    isDebug?: boolean;
    isCharging?: boolean;
    isVpn?: boolean;
    isRoot?: boolean;
    isCleanData?: boolean;
    isResetIdfa?: boolean;
    idfa?: string;
    appVersion?: string;
    platform?: string;
    model?: string;
    brand?: string;
    channel?: string;
    isNetwork?: boolean;
    isWifi?: boolean;
    hasGyroscope?: boolean;
    osVersion?: string;
    devToken?: string;
}

/**
 * 风控上报响应
 */
export interface RiskDetectionResponse {
    error: boolean;
    success: boolean;
    warn: boolean;
    empty: boolean;
}

@ccclass('RiskDetectionService')
export class RiskDetectionService extends Component {
    
    @property
    private autoReportInterval: number = 300000; // 5分钟自动上报一次
    
    private deviceInfoCollector: DeviceInfoCollector = null;
    private apiClient: EncryptedApiClient = null;
    private autoReportTimer: any = null;
    private lastReportTime: number = 0;

    // 风控上报API端点
    private readonly RISK_DETECTION_ENDPOINT = '/safe/riskDetection';

    start() {
        log('RiskDetectionService 已启动');
        
        // 获取设备信息收集器
        this.deviceInfoCollector = this.getComponent(DeviceInfoCollector);
        if (!this.deviceInfoCollector) {
            this.deviceInfoCollector = this.addComponent(DeviceInfoCollector);
        }
        
        // 获取API客户端
        this.apiClient = this.getComponent(EncryptedApiClient);
        if (!this.apiClient) {
            this.apiClient = this.addComponent(EncryptedApiClient);
        }
        
        // 启动自动上报
        this.startAutoReport();
    }

    onDestroy() {
        this.stopAutoReport();
    }

    /**
     * 生成请求ID
     */
    private generateRequestId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `risk_${timestamp}_${random}`;
    }

    /**
     * 构建风控上报请求数据
     */
    private async buildRiskDetectionRequest(deviceInfo: DeviceInfo): Promise<RiskDetectionRequest> {
        // 根据环境决定使用真实或模拟设备ID
        const defaultDeviceInfo = await ApiConfig.getDefaultDeviceInfo();
        
        return {
            // 必填字段
            androidId: deviceInfo.androidId || defaultDeviceInfo.androidId,
            requestId: this.generateRequestId(),
            timeStamp: Date.now(),
            
            // 可选字段
            deviceId: deviceInfo.deviceId || defaultDeviceInfo.deviceId,
            packageName: ApiConfig.getPackageName(),
            simCard: deviceInfo.simCard,
            noSimCard: !deviceInfo.simCard || deviceInfo.simCard.length === 0,
            isDebug: deviceInfo.debug,
            isCharging: deviceInfo.charging,
            isVpn: deviceInfo.vpn,
            isRoot: deviceInfo.root,
            isCleanData: deviceInfo.cleanData,
            isResetIdfa: false, // 默认未重置广告标识
            idfa: deviceInfo.idfa,
            appVersion: ApiConfig.getVersionName(),
            platform: deviceInfo.platform,
            model: deviceInfo.model,
            brand: deviceInfo.brand,
            channel: ApiConfig.getReleaseChannel(),
            isNetwork: deviceInfo.network,
            isWifi: deviceInfo.wifi,
            hasGyroscope: deviceInfo.hasGyroscope,
            osVersion: deviceInfo.osVersion,
            devToken: '' // 首次上报时需要传入
        };
    }

    /**
     * 生成模拟Android ID（当无法获取真实ID时）
     */
    private generateMockAndroidId(): string {
        // 生成16位十六进制字符串，模拟Android ID格式
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    /**
     * 执行风控上报
     */
    public async performRiskDetection(): Promise<RiskDetectionResponse> {
        try {
            log('开始执行风控上报...');
            
            // 获取设备信息
            const deviceInfo = await this.deviceInfoCollector.collectDeviceInfo();
            log('设备信息收集完成:', deviceInfo);
            
            // 构建请求数据
            const requestData = await this.buildRiskDetectionRequest(deviceInfo);
            log('风控上报请求数据:', JSON.stringify(requestData));
            
            // 发送请求
            const response = await this.sendRiskDetectionRequest(requestData);
            
            // 更新最后上报时间
            this.lastReportTime = Date.now();
            
            log('风控上报成功:', response);
            return response.data;
            
        } catch (error) {
            warn('风控上报失败:', error);
            throw error;
        }
    }

    /**
     * 使用模拟数据执行风控上报（测试用）
     */
    public async performRiskDetectionWithMockData(): Promise<RiskDetectionResponse> {
        try {
            log('开始使用模拟数据执行风控上报...');
            
            // 根据环境决定使用真实或模拟设备ID
            const defaultDeviceInfo = await ApiConfig.getDefaultDeviceInfo();
            
            // 构建模拟请求数据
            const mockRequestData: RiskDetectionRequest = {
                androidId: defaultDeviceInfo.androidId,
                deviceId: defaultDeviceInfo.deviceId,
                requestId: this.generateRequestId(),
                timeStamp: Date.now(),
                packageName: ApiConfig.getPackageName(),
                simCard: '46000',
                noSimCard: false,
                isDebug: ApiConfig.DEV_MODE.ENABLE_DEBUG_LOGS,
                isCharging: Math.random() > 0.5,
                isVpn: false,
                isRoot: false,
                isCleanData: false,
                isResetIdfa: false,
                idfa: '',
                appVersion: ApiConfig.getVersionName(),
                platform: this.getPlatform(),
                model: this.getMockDeviceModel(),
                brand: this.getMockDeviceBrand(),
                channel: ApiConfig.getReleaseChannel(),
                isNetwork: true,
                isWifi: Math.random() > 0.3,
                hasGyroscope: true,
                osVersion: sys.osVersion || '10.0',
                devToken: ''
            };
            
            log('模拟风控上报请求数据:', JSON.stringify(mockRequestData));
            
            // 发送请求
            const response = await this.sendRiskDetectionRequest(mockRequestData);
            
            log('模拟风控上报成功:', response);
            return response.data;
            
        } catch (error) {
            warn('模拟风控上报失败:', error);
            throw error;
        }
    }

    /**
     * 发送风控检测请求
     */
    private async sendRiskDetectionRequest(requestData: RiskDetectionRequest): Promise<ApiResponse<RiskDetectionResponse>> {
        return new Promise((resolve, reject) => {
            try {
                const xhr = new XMLHttpRequest();
                const url = ApiConfig.getFullUrl(this.RISK_DETECTION_ENDPOINT);
                
                xhr.timeout = ApiConfig.getTimeout();
                xhr.ontimeout = () => {
                    reject(new Error('风控上报请求超时'));
                };
                
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const response = JSON.parse(xhr.responseText);
                                resolve(response);
                            } catch (parseError) {
                                reject(new Error('风控上报响应解析失败: ' + parseError));
                            }
                        } else {
                            reject(new Error(`风控上报HTTP错误: ${xhr.status} - ${xhr.statusText}`));
                        }
                    }
                };
                
                xhr.onerror = () => {
                    reject(new Error('风控上报网络请求失败'));
                };
                
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/json');
                
                log('发送风控上报请求到:', url);
                log('请求数据:', JSON.stringify(requestData));
                
                xhr.send(JSON.stringify(requestData));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 启动自动风控上报
     */
    public startAutoReport(): void {
        if (this.autoReportTimer) {
            this.stopAutoReport();
        }
        
        log('启动自动风控上报，间隔:', this.autoReportInterval, 'ms');
        
        // 立即执行一次
        this.performRiskDetection().catch(error => {
            warn('初始风控上报失败:', error);
        });
        
        // 设置定时器
        this.autoReportTimer = setInterval(() => {
            this.performRiskDetection().catch(error => {
                warn('定时风控上报失败:', error);
            });
        }, this.autoReportInterval);
    }

    /**
     * 停止自动风控上报
     */
    public stopAutoReport(): void {
        if (this.autoReportTimer) {
            clearInterval(this.autoReportTimer);
            this.autoReportTimer = null;
            log('已停止自动风控上报');
        }
    }

    /**
     * 设置自动上报间隔
     */
    public setAutoReportInterval(intervalMs: number): void {
        this.autoReportInterval = Math.max(intervalMs, 30000); // 最少30秒
        log('设置自动上报间隔为:', this.autoReportInterval, 'ms');
        
        // 如果正在运行，重新启动
        if (this.autoReportTimer) {
            this.startAutoReport();
        }
    }

    /**
     * 获取平台信息
     */
    private getPlatform(): string {
        switch (sys.platform) {
            case sys.Platform.ANDROID:
                return 'android';
            case sys.Platform.IOS:
                return 'ios';
            case sys.Platform.WECHAT_GAME:
                return 'wap';
            default:
                return 'web';
        }
    }

    /**
     * 获取模拟设备型号
     */
    private getMockDeviceModel(): string {
        const models = ['SM-G975F', 'MI 10', 'iPhone 12', 'OPPO R15', 'vivo X50'];
        return models[Math.floor(Math.random() * models.length)];
    }

    /**
     * 获取模拟设备品牌
     */
    private getMockDeviceBrand(): string {
        const brands = ['Samsung', 'Xiaomi', 'Apple', 'OPPO', 'vivo'];
        return brands[Math.floor(Math.random() * brands.length)];
    }

    /**
     * 获取最后上报时间
     */
    public getLastReportTime(): number {
        return this.lastReportTime;
    }

    /**
     * 检查是否需要上报
     */
    public shouldReport(): boolean {
        const now = Date.now();
        return (now - this.lastReportTime) >= this.autoReportInterval;
    }
}