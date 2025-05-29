import { _decorator, Component, sys, log } from 'cc';
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

    start() {
        // 获取或添加DeviceLogAPI组件
        this.deviceLogAPI = this.getComponent(DeviceLogAPI);
        if (!this.deviceLogAPI) {
            this.deviceLogAPI = this.addComponent(DeviceLogAPI);
        }
        
        log('DeviceInfoCollector组件已启动，准备收集设备信息');
    }

    /**
     * 收集完整的设备信息
     */
    public async collectDeviceInfo(): Promise<DeviceInfo> {
        log('开始收集设备信息...');
        
        const deviceInfo: DeviceInfo = {
            // 设备标识信息
            androidId: this.getAndroidId(),
            simCard: this.getSimCardInfo(),
            idfa: this.getIDFA(),
            deviceId: this.getDeviceId(),
            
            // 设备硬件信息
            brand: this.getDeviceBrand(),
            model: this.getDeviceModel(),
            osVersion: this.getOSVersion(),
            platform: this.getPlatform(),
            
            // 网络和位置信息
            ipAddress: await this.getIPAddress(),
            ipLocation: await this.getIPLocation(),
            channel: this.getChannel(),
            
            // 设备状态信息
            hasGyroscope: this.hasGyroscope(),
            debug: this.isDebugMode(),
            root: this.isRooted(),
            charging: this.isCharging(),
            vpn: this.isVPNConnected(),
            cleanData: this.isCleanData(),
            network: this.hasNetworkConnection(),
            wifi: this.isWiFiConnected(),
            
            // 其他信息
            lianScore: this.getLianScore(),
            updateTime: new Date().toISOString()
        };

        this.cachedDeviceInfo = deviceInfo;
        log('设备信息收集完成:', deviceInfo);
        return deviceInfo;
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
            log('设备信息发送失败:', error);
            return false;
        }
    }

    /**
     * 获取Android ID
     */
    private getAndroidId(): string {
        if (sys.platform === sys.Platform.ANDROID) {
            // 在实际项目中，需要通过原生插件获取
            // 这里返回模拟数据
            return this.generateMockId('android');
        }
        return '';
    }

    /**
     * 获取SIM卡信息
     */
    private getSimCardInfo(): string {
        if (sys.isMobile) {
            // 在实际项目中，需要通过原生插件获取SIM卡信息
            // 这里返回模拟数据
            const simProviders = ['中国移动', '中国联通', '中国电信'];
            return simProviders[Math.floor(Math.random() * simProviders.length)];
        }
        return '';
    }

    /**
     * 获取iOS IDFA
     */
    private getIDFA(): string {
        if (sys.platform === sys.Platform.IOS) {
            // 在实际项目中，需要通过原生插件获取IDFA
            // 这里返回模拟数据
            return this.generateMockId('idfa');
        }
        return '';
    }

    /**
     * 获取设备ID
     */
    private getDeviceId(): string {
        // 使用Cocos Creator的设备ID获取方法
        return sys.getSafeAreaRect().toString() + '_' + Date.now();
    }

    /**
     * 获取设备品牌
     */
    private getDeviceBrand(): string {
        if (sys.platform === sys.Platform.ANDROID) {
            // 在实际项目中，通过原生插件获取
            const brands = ['华为', '小米', 'OPPO', 'vivo', '三星', '一加'];
            return brands[Math.floor(Math.random() * brands.length)];
        } else if (sys.platform === sys.Platform.IOS) {
            return 'Apple';
        }
        return 'Unknown';
    }

    /**
     * 获取设备型号
     */
    private getDeviceModel(): string {
        if (sys.platform === sys.Platform.ANDROID) {
            const models = ['P50 Pro', 'Mi 13', 'Find X6', 'X90 Pro', 'Galaxy S23', 'OnePlus 11'];
            return models[Math.floor(Math.random() * models.length)];
        } else if (sys.platform === sys.Platform.IOS) {
            const models = ['iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro', 'iPhone 13'];
            return models[Math.floor(Math.random() * models.length)];
        }
        return 'Unknown Model';
    }

    /**
     * 获取操作系统版本
     */
    private getOSVersion(): string {
        return sys.osVersion || 'Unknown';
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
     * 获取渠道信息
     */
    private getChannel(): string {
        // 在实际项目中，这通常在打包时配置
        const channels = ['官方', '应用宝', '华为商店', 'App Store', '小米商店'];
        return channels[Math.floor(Math.random() * channels.length)];
    }

    /**
     * 获取IP地址
     */
    private async getIPAddress(): Promise<string> {
        try {
            // 在实际项目中，可以通过网络请求获取公网IP
            // 这里返回模拟数据
            return `192.168.1.${Math.floor(Math.random() * 255)}`;
        } catch (error) {
            log('获取IP地址失败:', error);
            return 'Unknown';
        }
    }

    /**
     * 获取IP位置信息
     */
    private async getIPLocation(): Promise<string> {
        try {
            // 在实际项目中，通过IP定位服务获取
            const locations = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市'];
            return locations[Math.floor(Math.random() * locations.length)];
        } catch (error) {
            log('获取IP位置失败:', error);
            return 'Unknown';
        }
    }

    /**
     * 检测是否有陀螺仪
     */
    private hasGyroscope(): boolean {
        // 在实际项目中，需要通过原生插件检测
        return sys.isMobile; // 移动设备通常都有陀螺仪
    }

    /**
     * 检测是否为调试模式
     */
    private isDebugMode(): boolean {
        // 简单的调试模式检测，在实际项目中可以根据需要调整
        return sys.platform === sys.Platform.DESKTOP_BROWSER || 
               sys.platform === sys.Platform.MOBILE_BROWSER;
    }

    /**
     * 检测设备是否已Root/越狱
     */
    private isRooted(): boolean {
        // 在实际项目中，需要通过原生插件检测
        return Math.random() > 0.8; // 模拟20%的设备已Root
    }

    /**
     * 检测是否正在充电
     */
    private isCharging(): boolean {
        // 在实际项目中，需要通过原生插件获取电池状态
        return Math.random() > 0.5; // 模拟50%概率正在充电
    }

    /**
     * 检测是否连接VPN
     */
    private isVPNConnected(): boolean {
        // 在实际项目中，需要通过原生插件检测网络状态
        return Math.random() > 0.9; // 模拟10%概率使用VPN
    }

    /**
     * 检测数据是否清洁（无篡改）
     */
    private isCleanData(): boolean {
        // 在实际项目中，通过完整性检查
        return Math.random() > 0.1; // 模拟90%数据清洁
    }

    /**
     * 检测网络连接状态
     */
    private hasNetworkConnection(): boolean {
        // Cocos Creator可以检测网络状态
        return true; // 假设有网络连接
    }

    /**
     * 检测WiFi连接状态
     */
    private isWiFiConnected(): boolean {
        // 在实际项目中，需要通过原生插件检测
        return Math.random() > 0.3; // 模拟70%概率连接WiFi
    }

    /**
     * 获取联分（信用分数）
     */
    private getLianScore(): number {
        // 模拟信用分数 0-1000
        return Math.floor(Math.random() * 1000);
    }

    /**
     * 生成模拟ID
     */
    private generateMockId(type: string): string {
        const chars = '0123456789abcdef';
        let result = '';
        const length = type === 'android' ? 16 : 36;
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
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
        log('设备信息缓存已清除');
    }
} 