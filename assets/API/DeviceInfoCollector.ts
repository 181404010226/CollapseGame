import { _decorator, Component, sys, log, native, warn } from 'cc';
import { DeviceLogAPI } from './DeviceLogAPI';

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
export class DeviceInfoCollector extends Component {
    
    private deviceLogAPI: DeviceLogAPI = null;
    private cachedDeviceInfo: DeviceInfo = null;
    private deviceInfoPromise: Promise<DeviceInfo> = null;
    private resolveDeviceInfoPromise: (value: DeviceInfo) => void = null;
    private rejectDeviceInfoPromise: (reason?: any) => void = null;

    start() {
        console.error('=== DeviceInfoCollector start 开始 ===');
        console.error('当前平台:', sys.platform);
        console.error('是否原生:', sys.isNative);
        
        // 获取或添加DeviceLogAPI组件
        this.deviceLogAPI = this.getComponent(DeviceLogAPI);
        if (!this.deviceLogAPI) {
            this.deviceLogAPI = this.addComponent(DeviceLogAPI);
            console.error('DeviceLogAPI组件已添加');
        } else {
            console.error('DeviceLogAPI组件已存在');
        }
        
        // 初始化JsbBridge通信
        this.initNativeBridge();
        
        console.error('=== DeviceInfoCollector start 完成 ===');
        log('DeviceInfoCollector组件已启动，准备收集设备信息');
    }

    /**
     * 初始化与原生的通信桥梁
     */
    private initNativeBridge(): void {
        console.error('开始初始化原生通信桥梁...');
        console.error('检查平台:', sys.platform === sys.Platform.ANDROID ? 'Android' : '其他平台');
        console.error('检查原生环境:', sys.isNative ? '是原生' : '非原生');
        
        if (sys.platform === sys.Platform.ANDROID && sys.isNative) {
            console.error('满足Android原生条件，设置JsbBridge回调...');
            
            try {
                // 检查native.bridge是否可用
                if (typeof native !== 'undefined' && native.bridge) {
                    console.error('native.bridge 可用');
                    
                    // 设置接收原生消息的回调
                    native.bridge.onNative = (command: string, data: string) => {
                        console.error(`收到原生消息: ${command}, 数据: ${data}`);
                        log(`收到原生消息: ${command}, 数据: ${data}`);
                        this.handleNativeResponse(command, data);
                    };
                    
                    console.error('JsbBridge回调设置成功');
                } else {
                    console.error('native.bridge 不可用');
                }
            } catch (error) {
                console.error('设置JsbBridge回调失败:', error);
            }
        } else {
            console.error('不满足Android原生条件，跳过JsbBridge初始化');
        }
        
        console.error('原生通信桥梁初始化完成');
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
                log('Android ID:', data);
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
            }, 5000); // 5秒超时
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
            native.bridge.sendToNative('getDeviceInfo', '');
            log('已发送设备信息请求到Android原生');
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
            return new Promise((resolve) => {
                const originalHandler = native.bridge.onNative;
                const timeout = setTimeout(() => {
                    warn('获取Android ID超时');
                    resolve('');
                    native.bridge.onNative = originalHandler;
                }, 3000);

                native.bridge.onNative = (command: string, data: string) => {
                    if (command === 'androidIdResult') {
                        clearTimeout(timeout);
                        resolve(data || '');
                        native.bridge.onNative = originalHandler;
                    } else if (originalHandler) {
                        originalHandler(command, data);
                    }
                };
                
                try {
                    native.bridge.sendToNative('getAndroidId', '');
                } catch (error) {
                    clearTimeout(timeout);
                    warn('发送获取Android ID请求失败:', error);
                    resolve('');
                    native.bridge.onNative = originalHandler;
                }
            });
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
                    native.bridge.sendToNative('getSimInfo', '');
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

            // 发送到服务器
            await this.deviceLogAPI.saveDeviceLog({
                logLevel: 'INFO',
                logMessage: '设备信息上报',
                eventType: 'DEVICE_INFO_UPLOAD',
                userId: 'system',
                ...this.cachedDeviceInfo
            });

            log('设备信息发送成功！');
            return true;
        } catch (error) {
            warn('设备信息发送失败:', error);
            return false;
        }
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