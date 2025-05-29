import { _decorator, Component, Node, Button, log, Label } from 'cc';
import { DeviceLogAPI } from './DeviceLogAPI';
import { DeviceInfoCollector } from './DeviceInfoCollector';

const { ccclass, property } = _decorator;

@ccclass('APITestButtons')
export class APITestButtons extends Component {
    
    // 基础功能按钮 - 只保留前三个
    @property(Button)
    public testConnectionBtn: Button = null;
    
    @property(Button)
    public initDeviceInfoBtn: Button = null;
    
    @property(Button)
    public sendInfoLogBtn: Button = null;
    
    // 状态显示
    @property(Label)
    public statusLabel: Label = null;
    
    private deviceLogAPI: DeviceLogAPI = null;
    private deviceInfoCollector: DeviceInfoCollector = null;
    private testCounter: number = 0;

    start() {
        // 获取或添加DeviceLogAPI组件
        this.deviceLogAPI = this.getComponent(DeviceLogAPI);
        if (!this.deviceLogAPI) {
            this.deviceLogAPI = this.addComponent(DeviceLogAPI);
        }
        
        // 获取或添加DeviceInfoCollector组件
        this.deviceInfoCollector = this.getComponent(DeviceInfoCollector);
        if (!this.deviceInfoCollector) {
            this.deviceInfoCollector = this.addComponent(DeviceInfoCollector);
        }
        
        // 自动绑定按钮事件
        this.bindButtonEvents();
        
        this.updateStatus('API测试按钮组件已初始化，专注于设备信息API测试');
        log('APITestButtons组件已启动，暴露3个测试按钮，专注于设备信息API测试');
    }

    /**
     * 自动绑定前三个按钮的点击事件
     */
    private bindButtonEvents() {
        // 基础功能按钮
        if (this.testConnectionBtn) {
            this.testConnectionBtn.node.on(Button.EventType.CLICK, this.onTestConnection, this);
            log('已绑定测试连接按钮事件');
        }
        
        if (this.initDeviceInfoBtn) {
            this.initDeviceInfoBtn.node.on(Button.EventType.CLICK, this.onInitDeviceInfo, this);
            log('已绑定设备信息按钮事件');
        }
        
        if (this.sendInfoLogBtn) {
            this.sendInfoLogBtn.node.on(Button.EventType.CLICK, this.onSendInfoLog, this);
            log('已绑定INFO日志按钮事件');
        }
        
        log('前三个按钮的事件绑定完成');
    }

    /**
     * 更新状态显示
     */
    private updateStatus(message: string) {
        if (this.statusLabel) {
            this.statusLabel.string = `状态: ${message}`;
        }
        log(`[APITest] ${message}`);
    }

    // ==================== 基础功能测试 ====================
    
    /**
     * 测试API连接
     */
    public async onTestConnection() {
        this.updateStatus('正在测试API连接...');
        try {
            const success = await this.deviceLogAPI.testConnection();
            this.updateStatus(success ? 'API连接测试成功！' : 'API连接测试失败！');
        } catch (error) {
            this.updateStatus(`API连接异常: ${error.message}`);
        }
    }

    /**
     * 初始化设备信息测试 - 专门测试保存设备信息API
     */
    public async onInitDeviceInfo() {
        this.updateStatus('正在收集并保存完整设备信息到服务器...');
        try {
            // 使用DeviceInfoCollector收集完整的设备信息
            const success = await this.deviceInfoCollector.sendDeviceInfoToServer();
            
            if (success) {
                this.updateStatus('完整设备信息收集并保存成功！');
                
                // 显示收集到的设备信息摘要
                const deviceInfo = this.deviceInfoCollector.getCachedDeviceInfo();
                if (deviceInfo) {
                    log('设备信息摘要:', {
                        platform: deviceInfo.platform,
                        brand: deviceInfo.brand,
                        model: deviceInfo.model,
                        osVersion: deviceInfo.osVersion,
                        hasGyroscope: deviceInfo.hasGyroscope,
                        network: deviceInfo.network,
                        wifi: deviceInfo.wifi
                    });
                }
            } else {
                this.updateStatus('设备信息保存失败，请检查网络连接');
            }
        } catch (error) {
            this.updateStatus(`设备信息保存失败: ${error.message}`);
        }
    }

    /**
     * 发送INFO级别日志 - 测试基础日志保存
     */
    public async onSendInfoLog() {
        this.testCounter++;
        this.updateStatus('正在发送INFO日志到服务器...');
        try {
            await this.deviceLogAPI.logInfo(`这是第${this.testCounter}条INFO日志，测试设备日志保存API`, 'INFO');
            this.updateStatus('INFO日志保存成功！');
        } catch (error) {
            this.updateStatus(`INFO日志保存失败: ${error.message}`);
        }
    }

    /**
     * 组件销毁时清理事件监听
     */
    onDestroy() {
        // 清理前三个按钮事件
        if (this.testConnectionBtn) {
            this.testConnectionBtn.node.off(Button.EventType.CLICK, this.onTestConnection, this);
        }
        
        if (this.initDeviceInfoBtn) {
            this.initDeviceInfoBtn.node.off(Button.EventType.CLICK, this.onInitDeviceInfo, this);
        }
        
        if (this.sendInfoLogBtn) {
            this.sendInfoLogBtn.node.off(Button.EventType.CLICK, this.onSendInfoLog, this);
        }
        
        log('APITestButtons组件事件监听已清理');
    }
} 