import { _decorator, Component, sys, log, native, warn } from 'cc';
import { NativeBridge, INativeMessageHandler } from './NativeBridgeManager';

const { ccclass, property } = _decorator;

/**
 * 设备信息数据接口
 */
export interface DeviceInfo {
    androidId: string;
    simCard: string;
    idfa: string;
    brand: string;
    model: string;
    osVersion: string;
    deviceId: string;
    channel: string;
    platform: string;
    ipAddress: string;
    ipLocation: string;
    updateTime: string;
    hasGyroscope: boolean;
    lianScore: number;
    debug: boolean;
    root: boolean;
    charging: boolean;
    vpn: boolean;
    cleanData: boolean;
    network: boolean;
    wifi: boolean;
}

@ccclass('DeviceInfoCollector')
export class DeviceInfoCollector extends Component implements INativeMessageHandler {
    
    @property
    private apiBaseUrl: string = 'http://101.133.145.244:7071';
    
    @property
    private timeout: number = 10000; // 10秒超时
    
    private cachedDeviceInfo: DeviceInfo = null;
    private deviceInfoPromise: Promise<DeviceInfo> = null;
    private resolveDeviceInfoPromise: (value: DeviceInfo) => void = null;
    private rejectDeviceInfoPromise: (reason?: any) => void = null;
    
    // Android ID请求管理
    private androidIdPromise: Promise<string> = null;
    private resolveAndroidIdPromise: (value: string) => void = null;
    private rejectAndroidIdPromise: (reason?: any) => void = null;
    private androidIdTimeout: any = null;

    start() {
        warn('=== DeviceInfoCollector start 开始 ===');
        warn('当前平台:', sys.platform);
        warn('是否原生:', sys.isNative);
        
        // 注册到统一原生桥接管理器
        this.registerToNativeBridge();
        
        warn('=== DeviceInfoCollector start 完成 ===');
        log('DeviceInfoCollector组件已启动，准备收集设备信息');
    }

    /**
     * 注册到统一原生桥接管理器
     */
    private registerToNativeBridge(): void {
        warn('注册DeviceInfoCollector到统一原生桥接管理器...');
        
        try {
            // 确保原生桥接管理器已初始化
            const bridgeManager = NativeBridge.ensureInitialized();
            
            // 注册消息处理器
            NativeBridge.registerHandler('DeviceInfoCollector', this);
            
            warn('DeviceInfoCollector已注册到统一原生桥接管理器');
        } catch (error) {
            console.error('注册到原生桥接管理器失败:', error);
        }
    }

    /**
     * 实现INativeMessageHandler接口 - 处理原生消息
     */
    public handleNativeMessage(command: string, data: string): boolean {
        // 只处理设备信息相关的消息
        if (!this.isDeviceInfoCommand(command)) {
            return false; // 不是设备信息相关消息，不处理
        }
        
        warn(`DeviceInfoCollector处理原生消息: ${command}, 数据: ${data}`);
        log(`DeviceInfoCollector处理原生消息: ${command}, 数据: ${data}`);
        
        this.handleNativeResponse(command, data);
        return true; // 消息已处理
    }
    
    /**
     * 检查是否是设备信息相关的命令
     */
    private isDeviceInfoCommand(command: string): boolean {
        const deviceInfoCommands = [
            'deviceInfoResult',
            'deviceInfoError', 
            'androidIdResult',
            'simInfoResult',
            'deviceModelResult',
            'batteryInfoResult',
            'networkInfoResult',
            'systemInfoResult'
        ];
        return deviceInfoCommands.includes(command);
    }
    
    /**
     * 处理来自原生的响应
     */
    private handleNativeResponse(command: string, data: string): void {
        switch (command) {
            case 'deviceInfoResult':
                this.handleDeviceInfoResult(data);
                break;
            case 'deviceInfoError':
                this.handleDeviceInfoError(data);
                break;
            case 'androidIdResult':
                this.handleAndroidIdResult(data);
                break;
            case 'androidIdError':
                this.handleAndroidIdError(data);
                break;
            case 'simInfoResult':
                log('SIM信息:', data);
                break;
            case 'deviceModelResult':
                log('设备型号信息:', data);
                break;
            case 'batteryInfoResult':
                log('电池信息:', data);
                break;
            case 'networkInfoResult':
                log('网络信息:', data);
                break;
            case 'systemInfoResult':
                log('系统信息:', data);
                break;
            default:
                log('未处理的原生响应:', command, data);
                break;
        }
    }

    /**
     * 处理设备信息获取成功的回调
     */
    private handleDeviceInfoResult(jsonData: string): void {
        try {
            const nativeDeviceInfo = JSON.parse(jsonData);
            
            // 将原生数据转换为我们的DeviceInfo格式
            const deviceInfo: DeviceInfo = {
                // 从原生获取的真实数据
                androidId: nativeDeviceInfo.androidId || '',
                simCard: nativeDeviceInfo.simCard || '',
                brand: nativeDeviceInfo.brand || '',
                model: nativeDeviceInfo.model || '',
                osVersion: nativeDeviceInfo.osVersion || '',
                deviceId: nativeDeviceInfo.deviceId || '',
                platform: nativeDeviceInfo.platform || this.getPlatform(),
                ipAddress: nativeDeviceInfo.ipAddress || '',
                hasGyroscope: nativeDeviceInfo.hasGyroscope || false,
                debug: nativeDeviceInfo.debugMode || false,
                root: nativeDeviceInfo.isRoot || false,
                charging: nativeDeviceInfo.isCharging || false,
                vpn: nativeDeviceInfo.isVPN || false,
                network: nativeDeviceInfo.hasNetwork || false,
                wifi: nativeDeviceInfo.isWiFi || false,
                
                // iOS相关（Android上为空）
                idfa: '',
                
                // 其他信息
                channel: '',
                ipLocation: '',
                lianScore: 0,
                cleanData: false,
                updateTime: new Date().toISOString()
            };

            this.cachedDeviceInfo = deviceInfo;
            log('设备信息收集完成:', deviceInfo);
            
            // 如果有等待的Promise，解决它
            if (this.resolveDeviceInfoPromise) {
                this.resolveDeviceInfoPromise(deviceInfo);
                this.deviceInfoPromise = null;
                this.resolveDeviceInfoPromise = null;
                this.rejectDeviceInfoPromise = null;
            }
            
        } catch (error) {
            log('解析设备信息JSON失败:', error);
            this.handleDeviceInfoError('JSON解析失败: ' + error.message);
        }
    }

    /**
     * 处理设备信息获取失败的回调
     */
    private handleDeviceInfoError(errorMsg: string): void {
        warn('获取设备信息失败:', errorMsg);
        
        // 创建默认的空设备信息
        const defaultDeviceInfo: DeviceInfo = {
            androidId: '',
            simCard: '',
            idfa: '',
            brand: '',
            model: '',
            osVersion: sys.osVersion || '',
            deviceId: '',
            channel: '',
            platform: this.getPlatform(),
            ipAddress: '',
            ipLocation: '',
            updateTime: new Date().toISOString(),
            hasGyroscope: false,
            lianScore: 0,
            debug: false,
            root: false,
            charging: false,
            vpn: false,
            cleanData: false,
            network: false,
            wifi: false
        };

        this.cachedDeviceInfo = defaultDeviceInfo;
        
        if (this.resolveDeviceInfoPromise) {
            this.resolveDeviceInfoPromise(defaultDeviceInfo);
            this.deviceInfoPromise = null;
            this.resolveDeviceInfoPromise = null;
            this.rejectDeviceInfoPromise = null;
        }
    }

    /**
     * 处理Android ID结果
     */
    private handleAndroidIdResult(androidId: string): void {
        log('Android ID:', androidId);
        
        if (this.androidIdTimeout) {
            clearTimeout(this.androidIdTimeout);
            this.androidIdTimeout = null;
        }
        
        if (this.resolveAndroidIdPromise) {
            this.resolveAndroidIdPromise(androidId || '');
            this.resolveAndroidIdPromise = null;
            this.rejectAndroidIdPromise = null;
            this.androidIdPromise = null;
        }
    }
    
    /**
     * 处理Android ID错误
     */
    private handleAndroidIdError(errorMsg: string): void {
        warn('获取Android ID失败:', errorMsg);
        
        if (this.androidIdTimeout) {
            clearTimeout(this.androidIdTimeout);
            this.androidIdTimeout = null;
        }
        
        if (this.rejectAndroidIdPromise) {
            this.rejectAndroidIdPromise(new Error(errorMsg));
            this.rejectAndroidIdPromise = null;
            this.resolveAndroidIdPromise = null;
            this.androidIdPromise = null;
        }
    }

    /**
     * 收集完整的设备信息
     */
    public async collectDeviceInfo(): Promise<DeviceInfo> {
        log('开始收集设备信息...');
        
        // 如果已有缓存，直接返回
        if (this.cachedDeviceInfo) {
            return this.cachedDeviceInfo;
        }

        // 如果正在请求中，返回现有的Promise
        if (this.deviceInfoPromise) {
            return this.deviceInfoPromise;
        }

        // 创建新的Promise
        this.deviceInfoPromise = new Promise<DeviceInfo>((resolve, reject) => {
            this.resolveDeviceInfoPromise = resolve;
            this.rejectDeviceInfoPromise = reject;
            
            // 设置超时
            setTimeout(() => {
                if (this.deviceInfoPromise) {
                    warn('设备信息获取超时，返回默认信息');
                    this.handleDeviceInfoError('获取超时');
                }
            }, this.timeout);
        });

        // 根据平台选择获取方式
        if (sys.platform === sys.Platform.ANDROID && sys.isNative) {
            // 发送请求到Android原生
            this.requestNativeDeviceInfo();
        } else {
            // 非Android平台或非原生环境，返回默认信息
            warn('非Android原生环境，无法获取设备信息');
            setTimeout(() => {
                this.handleDeviceInfoError('非Android原生环境');
            }, 100);
        }

        return this.deviceInfoPromise;
    }

    /**
     * 请求原生设备信息
     */
    private requestNativeDeviceInfo(): void {
        try {
            // 使用统一原生桥接管理器发送消息
            const success = NativeBridge.sendToNative('getDeviceInfo', '');
            if (success) {
                log('已通过统一桥接管理器发送设备信息请求到Android原生');
            } else {
                warn('统一桥接管理器发送失败，尝试直接发送');
                if (typeof native !== 'undefined' && native.bridge) {
                    native.bridge.sendToNative('getDeviceInfo', '');
                    log('已直接发送设备信息请求到Android原生');
                } else {
                    throw new Error('原生桥接不可用');
                }
            }
        } catch (error) {
            warn('发送原生请求失败:', error);
            this.handleDeviceInfoError('发送请求失败: ' + error.message);
        }
    }

    /**
     * 获取特定的设备信息
     */
    public async getAndroidId(): Promise<string> {
        if (sys.platform === sys.Platform.ANDROID && sys.isNative) {
            // 如果已有请求在进行中，返回现有的Promise
            if (this.androidIdPromise) {
                return this.androidIdPromise;
            }
            
            this.androidIdPromise = new Promise((resolve, reject) => {
                this.resolveAndroidIdPromise = resolve;
                this.rejectAndroidIdPromise = reject;
                
                // 设置超时
                this.androidIdTimeout = setTimeout(() => {
                    warn('获取Android ID超时');
                    if (this.resolveAndroidIdPromise) {
                        this.resolveAndroidIdPromise('');
                        this.resolveAndroidIdPromise = null;
                        this.rejectAndroidIdPromise = null;
                        this.androidIdPromise = null;
                        this.androidIdTimeout = null;
                    }
                }, 3000);
                
                try {
                    const success = NativeBridge.sendToNative('getAndroidId', '');
                    if (!success && typeof native !== 'undefined' && native.bridge) {
                        native.bridge.sendToNative('getAndroidId', '');
                    }
                } catch (error) {
                    if (this.androidIdTimeout) {
                        clearTimeout(this.androidIdTimeout);
                        this.androidIdTimeout = null;
                    }
                    warn('发送获取Android ID请求失败:', error);
                    reject(error);
                    this.resolveAndroidIdPromise = null;
                    this.rejectAndroidIdPromise = null;
                    this.androidIdPromise = null;
                }
            });
            
            return this.androidIdPromise;
        }
        warn('非Android原生环境，无法获取Android ID');
        return '';
    }

    public async getSimInfo(): Promise<string> {
        if (sys.platform === sys.Platform.ANDROID && sys.isNative) {
            return new Promise((resolve) => {
                const originalHandler = native.bridge.onNative;
                const timeout = setTimeout(() => {
                    warn('获取SIM信息超时');
                    resolve('');
                    native.bridge.onNative = originalHandler;
                }, 3000);

                native.bridge.onNative = (command: string, data: string) => {
                    if (command === 'simInfoResult') {
                        clearTimeout(timeout);
                        resolve(data || '');
                        native.bridge.onNative = originalHandler;
                    } else if (originalHandler) {
                        originalHandler(command, data);
                    }
                };
                
                try {
                    const success = NativeBridge.sendToNative('getSimInfo', '');
                    if (!success && typeof native !== 'undefined' && native.bridge) {
                        native.bridge.sendToNative('getSimInfo', '');
                    }
                } catch (error) {
                    clearTimeout(timeout);
                    warn('发送获取SIM信息请求失败:', error);
                    resolve('');
                    native.bridge.onNative = originalHandler;
                }
            });
        }
        warn('非Android原生环境，无法获取SIM信息');
        return '';
    }

    /**
     * 发送设备信息到服务器
     */
    public async sendDeviceInfoToServer(): Promise<boolean> {
        try {
            log('准备发送设备信息到服务器...');
            
            // 如果没有缓存的设备信息，先收集
            if (!this.cachedDeviceInfo) {
                await this.collectDeviceInfo();
            }

            // 准备发送的数据
            const deviceLogData = {
                logLevel: 'INFO',
                logMessage: '设备信息上报',
                eventType: 'DEVICE_INFO_UPLOAD',
                userId: 'system',
                timestamp: Date.now(),
                ...this.cachedDeviceInfo
            };

            // 发送到服务器
            await this.sendRequest('/base/saveDeviceLog', deviceLogData);

            log('设备信息发送成功！');
            return true;
        } catch (error) {
            warn('设备信息发送失败:', error);
            return false;
        }
    }

    /**
     * 发送HTTP请求
     * @param endpoint API端点
     * @param data 请求数据
     */
    private async sendRequest(endpoint: string, data: any): Promise<any> {
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
                            const response = JSON.parse(xhr.responseText);
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
            
            xhr.send(JSON.stringify(data));
        });
    }

    /**
     * 获取平台信息
     */
    private getPlatform(): string {
        switch (sys.platform) {
            case sys.Platform.ANDROID:
                return 'Android';
            case sys.Platform.IOS:
                return 'iOS';
            case sys.Platform.DESKTOP_BROWSER:
                return 'Browser';
            case sys.Platform.MOBILE_BROWSER:
                return 'Mobile Browser';
            default:
                return 'Unknown';
        }
    }

    /**
     * 获取缓存的设备信息
     */
    public getCachedDeviceInfo(): DeviceInfo | null {
        return this.cachedDeviceInfo;
    }

    /**
     * 清除缓存的设备信息
     */
    public clearCache(): void {
        this.cachedDeviceInfo = null;
        this.deviceInfoPromise = null;
        this.resolveDeviceInfoPromise = null;
        this.rejectDeviceInfoPromise = null;
        log('设备信息缓存已清除');
    }
}