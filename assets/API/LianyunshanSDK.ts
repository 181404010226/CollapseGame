import { _decorator, Component, sys, log, warn, native, Node, game } from 'cc';
import { NativeBridge, INativeMessageHandler } from './NativeBridgeManager';
import { ApiConfig, RiskDetectionRequest, RiskDetectionResponse } from './ApiConfig';
import { EncryptedApiClient } from './EncryptedApiClient';

const { ccclass, property } = _decorator;

/**
 * 连云山安全SDK接口
 * 用于设备风险识别和安全防护
 */
@ccclass('LianyunshanSDK')
export class LianyunshanSDK extends Component implements INativeMessageHandler {
    
    private static instance: LianyunshanSDK = null;
    private deviceToken: string = '';
    private tokenCallbacks: Array<(token: string) => void> = [];
    private reportCallbacks: Array<(success: boolean, message: string) => void> = [];
    
    /**
     * 获取单例实例
     */
    public static getInstance(): LianyunshanSDK {
        if (!LianyunshanSDK.instance) {
            // 创建一个临时节点来承载组件
            const node = new Node('LianyunshanSDK');
            LianyunshanSDK.instance = node.addComponent(LianyunshanSDK);
            // 设置为常驻节点
            game.addPersistRootNode(node);
        }
        return LianyunshanSDK.instance;
    }
    
    start() {
        warn('=== LianyunshanSDK start 开始 ===');
        
        // 延迟注册，确保NativeBridgeManager完全初始化
        this.scheduleOnce(() => {
            this.registerToNativeBridge();
            
            // 再延迟一点进行风控信息上报
            this.scheduleOnce(() => {
                this.reportRiskDetection((success, error) => {
                    if (success) {
                        log('[LianyunshanSDK] 启动后风控信息上报成功');
                        
                        // 风控信息上报成功后，自动上报注册场景
                        this.scheduleOnce(() => {
                            this.reportScene('register').then((reportSuccess) => {
                                if (reportSuccess) {
                                    log('[LianyunshanSDK] SDK启动时注册场景上报成功');
                                } else {
                                    warn('[LianyunshanSDK] SDK启动时注册场景上报失败');
                                }
                            }).catch((reportError) => {
                                warn('[LianyunshanSDK] SDK启动时注册场景上报异常:', reportError);
                            });
                        }, 0.5); // 延迟0.5秒确保风控上报完全完成
                    } else {
                        warn('[LianyunshanSDK] 启动后风控信息上报失败:', error);
                        
                        // 即使风控上报失败，也尝试上报注册场景
                        this.scheduleOnce(() => {
                            this.reportScene('register').then((reportSuccess) => {
                                if (reportSuccess) {
                                    log('[LianyunshanSDK] SDK启动时注册场景上报成功（风控失败后重试）');
                                } else {
                                    warn('[LianyunshanSDK] SDK启动时注册场景上报失败（风控失败后重试）');
                                }
                            }).catch((reportError) => {
                                warn('[LianyunshanSDK] SDK启动时注册场景上报异常（风控失败后重试）:', reportError);
                            });
                        }, 0.5);
                    }
                });
            }, 1.0);
        }, 0.1); // 延迟0.1秒确保NativeBridgeManager先初始化
        
        warn('=== LianyunshanSDK start 完成 ===');
        log('连云山SDK组件已启动');

    }
    
    /**
     * 注册到统一原生桥接管理器
     */
    private registerToNativeBridge(): void {
        warn('注册LianyunshanSDK到统一原生桥接管理器...');
        
        try {
            // 确保原生桥接管理器已初始化
            const bridgeManager = NativeBridge.ensureInitialized();
            log('NativeBridgeManager实例获取成功:', !!bridgeManager);
            
            // 注册消息处理器
            NativeBridge.registerHandler('LianyunshanSDK', this);
            
            // 验证注册是否成功
            const registeredHandlers = bridgeManager.getRegisteredHandlers();
            log('当前已注册的处理器:', registeredHandlers);
            
            warn('LianyunshanSDK已注册到统一原生桥接管理器');
        } catch (error) {
            console.error('注册到原生桥接管理器失败:', error);
        }
    }
    
    /**
     * 实现INativeMessageHandler接口 - 处理原生消息
     */
    public handleNativeMessage(command: string, data: string): boolean {
        log(`[LianyunshanSDK] 收到原生消息: ${command}, 数据: ${data}`);
        
        // 只处理连云山SDK相关的消息
        if (!this.isLianyunshanCommand(command)) {
            log(`[LianyunshanSDK] 非连云山消息，跳过处理: ${command}`);
            return false; // 不是连云山相关消息，不处理
        }
        
        warn(`[LianyunshanSDK] 开始处理连云山消息: ${command}, 数据: ${data}`);
        
        this.handleNativeResponse(command, data);
        
        warn(`[LianyunshanSDK] 连云山消息处理完成: ${command}`);
        return true; // 消息已处理
    }
    
    /**
     * 检查是否是连云山SDK相关的命令
     */
    private isLianyunshanCommand(command: string): boolean {
        const lianyunshanCommands = [
            'lianyunshan_token_loaded',
            'lianyunshanTokenResult',
            'lianyunshanTokenError',
            'lianyunshanReportResult',
            'lianyunshanReportError'
        ];
        return lianyunshanCommands.includes(command);
    }
    
    /**
     * 处理来自原生的响应
     */
    private handleNativeResponse(command: string, data: string): void {
        switch (command) {
            case 'lianyunshan_token_loaded':
                this.handleTokenLoaded(data);
                break;
            case 'lianyunshanTokenResult':
                this.handleTokenResult(data);
                break;
            case 'lianyunshanTokenError':
                this.handleTokenError(data);
                break;
            case 'lianyunshanReportResult':
                this.handleReportResult(data);
                break;
            case 'lianyunshanReportError':
                this.handleReportError(data);
                break;
            default:
                log('未处理的连云山原生响应:', command, data);
                break;
        }
    }
    
    /**
     * 处理token加载完成
     */
    private handleTokenLoaded(token: string): void {
        log('连云山SDK token已加载:', token ? token.substring(0, 20) + '...' : 'empty');
        this.deviceToken = token || '';
        
        // 通知所有等待的回调
        this.tokenCallbacks.forEach(callback => {
            try {
                callback(this.deviceToken);
            } catch (error) {
                warn('Token回调执行失败:', error);
            }
        });
        this.tokenCallbacks = [];
    }
    
    /**
     * 处理token获取结果
     */
    private handleTokenResult(token: string): void {
        log('连云山SDK token获取成功:', token ? token.substring(0, 20) + '...' : 'empty');
        this.deviceToken = token || '';
        
        // 通知所有等待的回调
        this.tokenCallbacks.forEach(callback => {
            try {
                callback(this.deviceToken);
            } catch (error) {
                warn('Token回调执行失败:', error);
            }
        });
        this.tokenCallbacks = [];
    }
    
    /**
     * 处理token获取错误
     */
    private handleTokenError(errorMsg: string): void {
        warn('连云山SDK token获取失败:', errorMsg);
        
        // 通知所有等待的回调
        this.tokenCallbacks.forEach(callback => {
            try {
                callback(''); // 返回空字符串表示失败
            } catch (error) {
                warn('Token错误回调执行失败:', error);
            }
        });
        this.tokenCallbacks = [];
    }
    
    /**
     * 处理场景上报结果
     */
    private handleReportResult(message: string): void {
        log('连云山SDK场景上报成功:', message);
        
        // 通知所有等待的回调
        this.reportCallbacks.forEach(callback => {
            try {
                callback(true, message);
            } catch (error) {
                warn('上报回调执行失败:', error);
            }
        });
        this.reportCallbacks = [];
    }
    
    /**
     * 处理场景上报错误
     */
    private handleReportError(errorMsg: string): void {
        warn('连云山SDK场景上报失败:', errorMsg);
        
        // 通知所有等待的回调
        this.reportCallbacks.forEach(callback => {
            try {
                callback(false, errorMsg);
            } catch (error) {
                warn('上报错误回调执行失败:', error);
            }
        });
        this.reportCallbacks = [];
    }
    
    /**
     * 获取设备token
     * @returns Promise<string> 设备token
     */
    public async getDeviceToken(): Promise<string> {
        log('开始获取连云山设备token...');
        
        // 如果已有token，直接返回
        if (this.deviceToken && this.deviceToken.length > 0) {
            return this.deviceToken;
        }
        
        // 如果是Android原生环境，请求获取token
        if (sys.platform === sys.Platform.ANDROID && sys.isNative) {
            return new Promise<string>((resolve) => {
                // 添加回调
                this.tokenCallbacks.push(resolve);
                
                // 设置超时
                setTimeout(() => {
                    const index = this.tokenCallbacks.indexOf(resolve);
                    if (index >= 0) {
                        this.tokenCallbacks.splice(index, 1);
                        warn('获取连云山设备token超时');
                        resolve(''); // 超时返回空字符串
                    }
                }, 10000); // 10秒超时
                
                // 发送请求
                try {
                    const success = NativeBridge.sendToNative('getLianyunshanToken', '');
                    if (success) {
                        log('已发送获取连云山token请求');
                    } else {
                        warn('发送获取连云山token请求失败，尝试直接调用');
                        if (typeof native !== 'undefined' && native.bridge) {
                            native.bridge.sendToNative('getLianyunshanToken', '');
                        } else {
                            throw new Error('原生桥接不可用');
                        }
                    }
                } catch (error) {
                    warn('发送获取连云山token请求失败:', error);
                    const index = this.tokenCallbacks.indexOf(resolve);
                    if (index >= 0) {
                        this.tokenCallbacks.splice(index, 1);
                    }
                    resolve(''); // 失败返回空字符串
                }
            });
        } else {
            warn('非Android原生环境，无法获取连云山设备token');
            return '';
        }
    }
    
    /**
     * 上报场景数据
     * @param sceneName 场景名称
     * @returns Promise<boolean> 是否上报成功
     */
    public async reportScene(sceneName: string): Promise<boolean> {
        log('开始上报连云山场景:', sceneName);
        
        if (!sceneName || sceneName.trim().length === 0) {
            warn('场景名称不能为空');
            return false;
        }
        
        // 如果是Android原生环境，发送上报请求
        if (sys.platform === sys.Platform.ANDROID && sys.isNative) {
            return new Promise<boolean>((resolve) => {
                // 添加回调
                this.reportCallbacks.push((success: boolean, message: string) => {
                    resolve(success);
                });
                
                // 设置超时
                setTimeout(() => {
                    if (this.reportCallbacks.length > 0) {
                        this.reportCallbacks = [];
                        warn('连云山场景上报超时');
                        resolve(false); // 超时返回失败
                    }
                }, 5000); // 5秒超时
                
                // 发送请求
                try {
                    const success = NativeBridge.sendToNative('reportLianyunshanScene', sceneName);
                    if (success) {
                        log('已发送连云山场景上报请求:', sceneName);
                    } else {
                        warn('发送连云山场景上报请求失败，尝试直接调用');
                        if (typeof native !== 'undefined' && native.bridge) {
                            native.bridge.sendToNative('reportLianyunshanScene', sceneName);
                        } else {
                            throw new Error('原生桥接不可用');
                        }
                    }
                } catch (error) {
                    warn('发送连云山场景上报请求失败:', error);
                    this.reportCallbacks = [];
                    resolve(false); // 失败返回false
                }
            });
        } else {
            warn('非Android原生环境，无法上报连云山场景');
            return false;
        }
    }
    
    /**
     * 上报设备风控数据到服务器
     * @param callback 回调函数
     * @param timeout 超时时间（毫秒）
     */
    public async reportRiskDetection(callback?: (success: boolean, error?: string) => void, timeout: number = 15000): Promise<void> {
        try {
            // 获取连云山设备token
            const deviceToken = await this.getDeviceTokenAsync();
            if (!deviceToken) {
                const error = 'Failed to get device token';
                warn(`[LianyunshanSDK] ${error}`);
                callback?.(false, error);
                return;
            }

            // 收集设备信息
            const deviceInfo = await this.collectDeviceInfo();
            
            // 添加连云山设备token
            deviceInfo.devToken = deviceToken;

            log(`[LianyunshanSDK] Reporting risk detection data`);
            
            // 使用原生XMLHttpRequest发送请求
            const response = await this.sendRiskDetectionRequest(deviceInfo, timeout);

            if (response && response.success) {
                log(`[LianyunshanSDK] Risk detection report successful`);
                callback?.(true);
            } else {
                const error = 'Risk detection report failed';
                warn(`[LianyunshanSDK] ${error}`);
                callback?.(false, error);
            }
        } catch (error) {
            const errorMsg = `Risk detection report error: ${error}`;
            warn(`[LianyunshanSDK] ${errorMsg}`);
            callback?.(false, errorMsg);
        }
    }

    /**
     * 发送风控检测请求
     * @param requestData 请求数据
     * @param timeout 超时时间
     */
    private async sendRiskDetectionRequest(requestData: RiskDetectionRequest, timeout: number): Promise<RiskDetectionResponse> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = ApiConfig.getFullUrl(ApiConfig.API_ENDPOINTS.RISK_DETECTION);
            
            xhr.timeout = timeout;
            xhr.ontimeout = () => {
                reject(new Error('Request timeout'));
            };
            
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            log(`[LianyunshanSDK] Risk detection response:`, JSON.stringify(response, null, 2));
                            log(`[LianyunshanSDK] Response status:`, xhr.status);
                            log(`[LianyunshanSDK] Response headers:`, xhr.getAllResponseHeaders());
                            
                            // 检查响应格式
                            if (response.code === 200) {
                                resolve({
                                    ...(response.data || {}),
                                    success: true,
                                    error: false,
                                    warn: false,
                                    empty: false,
                                    message: response.msg || 'Success'
                                });
                            } else {
                                reject(new Error(`Risk detection report failed: ${response.msg || 'Unknown error'}`));
                            }
                        } catch (parseError) {
                            reject(new Error(`Response parse error: ${parseError}`));
                        }
                    } else {
                        reject(new Error(`HTTP error: ${xhr.status} - ${xhr.statusText}`));
                    }
                }
            };
            
            xhr.onerror = () => {
                reject(new Error('Network request failed'));
            };
            
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Accept', 'application/json');
            
            log(`[LianyunshanSDK] Sending risk detection request to:`, url);
            log(`[LianyunshanSDK] Request data:`, JSON.stringify(requestData, null, 2));
            
            xhr.send(JSON.stringify(requestData));
        });
    }

    /**
     * 收集设备信息
     * @returns 设备信息对象
     */
    private async collectDeviceInfo(): Promise<RiskDetectionRequest> {
        let defaultDeviceInfo;
        try {
            // 使用异步方法获取真实设备信息
            defaultDeviceInfo = await ApiConfig.getDefaultDeviceInfo();
            
            // 如果返回的是空值，使用备用方案
            if (!defaultDeviceInfo.androidId || !defaultDeviceInfo.deviceId) {
                warn(`[LianyunshanSDK] 无法获取设备信息，使用备用设备ID`);
                defaultDeviceInfo = {
                    androidId: this.generateMockAndroidId(),
                    deviceId: '13974751124'
                };
            } else {
                log(`[LianyunshanSDK] 成功获取真实设备信息: androidId=${defaultDeviceInfo.androidId.substring(0, 8)}..., deviceId=${defaultDeviceInfo.deviceId}`);
            }
        } catch (error) {
            warn(`[LianyunshanSDK] 获取默认设备信息失败，使用备用设备ID:`, error);
            defaultDeviceInfo = {
                androidId: this.generateMockAndroidId(),
                deviceId: '13974751124'
            };
        }
        
        const deviceInfo: RiskDetectionRequest = {
            // 必需的BaseReq字段
            androidId: defaultDeviceInfo.androidId,
            deviceId: defaultDeviceInfo.deviceId,
            requestId: this.generateRequestId(),
            timeStamp: Date.now(),
            packageName: ApiConfig.getPackageName(),
            
            // 应用版本信息
            appVersion: ApiConfig.getVersionName(),
            platform: 'android',
            
            // 渠道信息
            channel: ApiConfig.getReleaseChannel(),
            
            // 使用从DeviceInfoCollector获取的真实设备信息
            brand: defaultDeviceInfo.brand || 'Unknown',
            model: defaultDeviceInfo.model || 'Unknown',
            osVersion: defaultDeviceInfo.osVersion || sys.osVersion,
            simCard: defaultDeviceInfo.simCard || '',
            
            // 设备状态信息（优先使用真实数据）
            noSimCard: !defaultDeviceInfo.simCard || defaultDeviceInfo.simCard.length === 0,
            isDebug: defaultDeviceInfo.isDebug !== undefined ? defaultDeviceInfo.isDebug : (!sys.isNative || ApiConfig.DEV_MODE.ENABLE_DEBUG_LOGS),
            isCharging: defaultDeviceInfo.isCharging || false,
            isVpn: defaultDeviceInfo.isVpn || false,
            isRoot: defaultDeviceInfo.isRoot || false,
            isCleanData: false,
            isResetIdfa: false,
            hasGyroscope: defaultDeviceInfo.hasGyroscope !== undefined ? defaultDeviceInfo.hasGyroscope : true,
            isNetwork: defaultDeviceInfo.isNetwork !== undefined ? defaultDeviceInfo.isNetwork : (sys.getNetworkType() !== sys.NetworkType.NONE),
            isWifi: defaultDeviceInfo.isWifi !== undefined ? defaultDeviceInfo.isWifi : (sys.getNetworkType() === sys.NetworkType.LAN)
        };

        log(`[LianyunshanSDK] Device info collected:`, JSON.stringify(deviceInfo, null, 2));

        return deviceInfo;
    }

    /**
     * 获取设备品牌
     * @returns 设备品牌字符串
     */
    private getDeviceBrand(): string {
        try {
            // 在Cocos Creator 3.x中，sys.deviceModel不存在
            // 返回默认品牌或通过其他方式获取
            if (sys.os === sys.OS.ANDROID) {
                // 可以通过原生调用获取真实设备信息，这里先返回默认值
                return 'Unknown';
            }
        } catch (error) {
            warn(`[LianyunshanSDK] Error getting device brand:`, error);
        }
        return 'Unknown';
    }

    /**
     * 生成模拟的Android ID
     * 用于在无法获取真实设备信息时提供默认值
     */
    private generateMockAndroidId(): string {
        // 生成16位随机字符串作为模拟Android ID
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 异步获取设备token
     * @returns Promise<string | null>
     */
    private async getDeviceTokenAsync(): Promise<string | null> {
        try {
            const token = await this.getDeviceToken();
            if (token && token.length > 0) {
                return token;
            } else {
                warn(`[LianyunshanSDK] Failed to get device token: empty token`);
                return null;
            }
        } catch (error) {
            warn(`[LianyunshanSDK] Failed to get device token: ${error}`);
            return null;
        }
    }

    /**
     * 生成请求ID
     * @returns 请求ID字符串
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 获取缓存的设备token
     */
    public getCachedToken(): string {
        return this.deviceToken;
    }
    
    /**
     * 清除缓存的token
     */
    public clearToken(): void {
        this.deviceToken = '';
        log('连云山设备token缓存已清除');
    }
}

/**
 * 连云山SDK静态接口
 * 提供便捷的静态方法调用
 */
export class LianyunshanSDKManager {
    
    /**
     * 获取设备token
     */
    public static async getDeviceToken(): Promise<string> {
        const sdk = LianyunshanSDK.getInstance();
        return await sdk.getDeviceToken();
    }
    
    /**
     * 上报场景
     */
    public static async reportScene(sceneName: string): Promise<boolean> {
        const sdk = LianyunshanSDK.getInstance();
        return await sdk.reportScene(sceneName);
    }
    
    /**
     * 上报设备风控数据
     */
    public static async reportRiskDetection(callback?: (success: boolean, error?: string) => void): Promise<void> {
        const sdk = LianyunshanSDK.getInstance();
        return await sdk.reportRiskDetection(callback);
    }
    
    /**
     * 获取缓存的token
     */
    public static getCachedToken(): string {
        const sdk = LianyunshanSDK.getInstance();
        return sdk.getCachedToken();
    }
    
    /**
     * 清除token缓存
     */
    public static clearToken(): void {
        const sdk = LianyunshanSDK.getInstance();
        sdk.clearToken();
    }
}