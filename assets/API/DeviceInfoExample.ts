import { _decorator, Component, Node, Button, log, Label, warn } from 'cc';
import { DeviceInfoCollector } from './DeviceInfoCollector';

const { ccclass, property } = _decorator;

/**
 * 设备信息收集示例
 * 演示如何使用DeviceInfoCollector来获取真实的设备信息
 * 注意：只有在Android原生环境下才能获取到真实数据，其他环境将返回空值
 */
@ccclass('DeviceInfoExample')
export class DeviceInfoExample extends Component {

    @property(Button)
    collectButton: Button = null;

    @property(Button)
    getAndroidIdButton: Button = null;

    @property(Button)
    getSimInfoButton: Button = null;

    @property(Button)
    sendToServerButton: Button = null;

    @property(Label)
    resultLabel: Label = null;

    private deviceInfoCollector: DeviceInfoCollector = null;

    start() {
        // 获取DeviceInfoCollector组件
        this.deviceInfoCollector = this.getComponent(DeviceInfoCollector);
        if (!this.deviceInfoCollector) {
            this.deviceInfoCollector = this.addComponent(DeviceInfoCollector);
        }

        // 绑定按钮事件
        if (this.collectButton) {
            this.collectButton.node.on(Button.EventType.CLICK, this.onCollectDeviceInfo, this);
        }

        if (this.getAndroidIdButton) {
            this.getAndroidIdButton.node.on(Button.EventType.CLICK, this.onGetAndroidId, this);
        }

        if (this.getSimInfoButton) {
            this.getSimInfoButton.node.on(Button.EventType.CLICK, this.onGetSimInfo, this);
        }

        if (this.sendToServerButton) {
            this.sendToServerButton.node.on(Button.EventType.CLICK, this.onSendToServer, this);
        }

        log('设备信息示例组件已启动');
    }

    /**
     * 收集完整设备信息
     */
    private async onCollectDeviceInfo(): Promise<void> {
        try {
            this.updateResult('正在收集设备信息...');
            
            const deviceInfo = await this.deviceInfoCollector.collectDeviceInfo();
            
            // 检查是否获取到了真实数据
            const hasRealData = deviceInfo.androidId || deviceInfo.brand || deviceInfo.model;
            
            // 格式化显示结果
            let result = `设备信息收集完成：
平台: ${deviceInfo.platform}
品牌: ${deviceInfo.brand || '未获取'}
型号: ${deviceInfo.model || '未获取'}
系统版本: ${deviceInfo.osVersion || '未获取'}
Android ID: ${deviceInfo.androidId || '未获取'}
SIM卡: ${deviceInfo.simCard || '未获取'}
IP地址: ${deviceInfo.ipAddress || '未获取'}
位置: ${deviceInfo.ipLocation || '未获取'}
陀螺仪: ${deviceInfo.hasGyroscope ? '有' : '无'}
充电状态: ${deviceInfo.charging ? '充电中' : '未充电'}
网络: ${deviceInfo.network ? '已连接' : '未连接'}
WiFi: ${deviceInfo.wifi ? '已连接' : '未连接'}
VPN: ${deviceInfo.vpn ? '已连接' : '未连接'}
Root状态: ${deviceInfo.root ? '已Root' : '未Root'}
调试模式: ${deviceInfo.debug ? '是' : '否'}
联分: ${deviceInfo.lianScore}
更新时间: ${deviceInfo.updateTime}`;

            if (!hasRealData) {
                result += '\n\n⚠️ 注意：当前环境无法获取真实设备信息';
            }

            this.updateResult(result);
            log('设备信息:', deviceInfo);
            
        } catch (error) {
            const errorMsg = `收集设备信息失败: ${error.message}`;
            this.updateResult(errorMsg);
            warn(errorMsg, error);
        }
    }

    /**
     * 单独获取Android ID
     */
    private async onGetAndroidId(): Promise<void> {
        try {
            this.updateResult('正在获取Android ID...');
            
            const androidId = await this.deviceInfoCollector.getAndroidId();
            
            let result = `Android ID: ${androidId || '未获取'}`;
            if (!androidId) {
                result += '\n⚠️ 当前环境无法获取Android ID';
            }
            
            this.updateResult(result);
            log(result);
            
        } catch (error) {
            const errorMsg = `获取Android ID失败: ${error.message}`;
            this.updateResult(errorMsg);
            warn(errorMsg, error);
        }
    }

    /**
     * 单独获取SIM卡信息
     */
    private async onGetSimInfo(): Promise<void> {
        try {
            this.updateResult('正在获取SIM卡信息...');
            
            const simInfo = await this.deviceInfoCollector.getSimInfo();
            
            let result = `SIM卡信息: ${simInfo || '未获取'}`;
            if (!simInfo) {
                result += '\n⚠️ 当前环境无法获取SIM卡信息';
            }
            
            this.updateResult(result);
            log(result);
            
        } catch (error) {
            const errorMsg = `获取SIM卡信息失败: ${error.message}`;
            this.updateResult(errorMsg);
            warn(errorMsg, error);
        }
    }

    /**
     * 发送设备信息到服务器
     */
    private async onSendToServer(): Promise<void> {
        try {
            this.updateResult('正在发送设备信息到服务器...');
            
            const success = await this.deviceInfoCollector.sendDeviceInfoToServer();
            
            const result = success ? '设备信息发送成功！' : '设备信息发送失败！';
            this.updateResult(result);
            log(result);
            
        } catch (error) {
            const errorMsg = `发送设备信息失败: ${error.message}`;
            this.updateResult(errorMsg);
            warn(errorMsg, error);
        }
    }

    /**
     * 更新结果显示
     */
    private updateResult(text: string): void {
        if (this.resultLabel) {
            this.resultLabel.string = text;
        }
        log(text);
    }

    /**
     * 清除缓存
     */
    public clearCache(): void {
        this.deviceInfoCollector.clearCache();
        this.updateResult('设备信息缓存已清除');
    }

    /**
     * 获取缓存的设备信息
     */
    public getCachedInfo(): void {
        const cachedInfo = this.deviceInfoCollector.getCachedDeviceInfo();
        if (cachedInfo) {
            const hasRealData = cachedInfo.androidId || cachedInfo.brand || cachedInfo.model;
            let result = `缓存的设备信息: ${JSON.stringify(cachedInfo, null, 2)}`;
            if (!hasRealData) {
                result += '\n\n⚠️ 缓存中为默认信息，非真实设备数据';
            }
            this.updateResult(result);
        } else {
            this.updateResult('没有缓存的设备信息');
        }
    }
} 