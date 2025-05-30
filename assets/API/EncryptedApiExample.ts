import { _decorator, Component, Node, Button, Label, log, warn } from 'cc';
import { EncryptedApiClient, GetVersionResponse } from './EncryptedApiClient';

const { ccclass, property } = _decorator;

@ccclass('EncryptedApiExample')
export class EncryptedApiExample extends Component {
    
    @property(Button)
    getVersionButton: Button = null;
    
    @property(Label)
    resultLabel: Label = null;
    
    private apiClient: EncryptedApiClient = null;

    start() {
        log('EncryptedApiExample 已启动');
        
        // 获取或创建API客户端
        this.apiClient = this.getComponent(EncryptedApiClient);
        if (!this.apiClient) {
            this.apiClient = this.addComponent(EncryptedApiClient);
        }

        // 绑定按钮事件
        this.bindButtonEvents();
        
        // 初始化显示
        this.updateResultDisplay('准备就绪，可以开始测试加密通信功能');
    }

    /**
     * 绑定按钮事件
     */
    private bindButtonEvents(): void {
        if (this.getVersionButton) {
            this.getVersionButton.node.on(Button.EventType.CLICK, this.onGetVersion, this);
        }
    }

    /**
     * 获取版本信息
     */
    private async onGetVersion(): Promise<void> {
        try {
            log('用户点击获取版本信息按钮');
            this.updateResultDisplay('正在获取版本信息...');
            
            // 调用获取版本信息API
            const versionInfo: GetVersionResponse = await this.apiClient.getVersion();
            
            // 格式化显示结果
            const resultText = this.formatVersionInfo(versionInfo);
            this.updateResultDisplay(resultText);
            
            log('版本信息获取成功，已更新显示');
        } catch (error) {
            warn('获取版本信息失败:', error);
            this.updateResultDisplay(`获取版本信息失败: ${error.message}`);
        }
    }

    /**
     * 格式化版本信息显示
     */
    private formatVersionInfo(versionInfo: GetVersionResponse): string {
        return `版本信息获取成功:
平台: ${versionInfo.platform}
版本名称: ${versionInfo.versionName}
版本号: ${versionInfo.versionCode}
更新模式: ${versionInfo.updateMode}
发布渠道: ${versionInfo.releaseChannel}
审核状态: ${versionInfo.reviewStatus}
包名: ${versionInfo.packageName}
更新描述: ${versionInfo.updateDescription}
下载链接: ${versionInfo.downloadUrl}`;
    }

    /**
     * 更新结果显示
     */
    private updateResultDisplay(text: string): void {
        if (this.resultLabel) {
            this.resultLabel.string = text;
        }
        log('显示结果:', text);
    }

    /**
     * 手动配置API客户端（可选）
     */
    public configureApiClient(baseUrl?: string, packageName?: string, version?: number): void {
        if (baseUrl) {
            this.apiClient.setApiBaseUrl(baseUrl);
        }
        
        if (packageName) {
            this.apiClient.setPackageName(packageName);
        }
        
        if (version) {
            this.apiClient.setCurrentVersion(version);
        }
        
        this.updateResultDisplay('API客户端配置已更新');
    }

    /**
     * 一键测试所有功能
     */
    public async testAllFeatures(): Promise<void> {
        try {
            this.updateResultDisplay('开始API测试...');
            
            // 测试API调用
            log('=== 测试: 获取版本信息 ===');
            await this.onGetVersion();
            
            this.updateResultDisplay('API测试完成');
        } catch (error) {
            warn('API测试失败:', error);
            this.updateResultDisplay(`API测试失败: ${error.message}`);
        }
    }

    /**
     * 延迟工具函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    onDestroy() {
        // 清理按钮事件
        if (this.getVersionButton) {
            this.getVersionButton.node.off(Button.EventType.CLICK, this.onGetVersion, this);
        }
    }
} 