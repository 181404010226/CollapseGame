import { _decorator, Component, Button, Label, log, warn, Node } from 'cc';
import { RiskDetectionService, RiskDetectionResponse } from './RiskDetectionService';

const { ccclass, property } = _decorator;

/**
 * 风控上报示例脚本
 * 演示如何使用RiskDetectionService进行风控检测
 */
@ccclass('RiskDetectionExample')
export class RiskDetectionExample extends Component {
    
    @property(Button)
    private testRiskDetectionButton: Button = null;
    
    @property(Button) 
    private testMockDataButton: Button = null;
    
    @property(Button)
    private startAutoReportButton: Button = null;
    
    @property(Button)
    private stopAutoReportButton: Button = null;
    
    @property(Label)
    private statusLabel: Label = null;
    
    @property(Label)
    private resultLabel: Label = null;

    private riskDetectionService: RiskDetectionService = null;

    start() {
        log('RiskDetectionExample 已启动');
        
        // 获取或创建风控上报服务
        this.riskDetectionService = this.getComponent(RiskDetectionService);
        if (!this.riskDetectionService) {
            this.riskDetectionService = this.addComponent(RiskDetectionService);
        }
        
        // 绑定按钮事件
        this.bindButtonEvents();
        
        // 初始化UI状态
        this.updateStatusUI();
    }

    /**
     * 绑定按钮事件
     */
    private bindButtonEvents(): void {
        if (this.testRiskDetectionButton) {
            this.testRiskDetectionButton.node.on(Button.EventType.CLICK, this.onTestRiskDetection, this);
        }
        
        if (this.testMockDataButton) {
            this.testMockDataButton.node.on(Button.EventType.CLICK, this.onTestMockData, this);
        }
        
        if (this.startAutoReportButton) {
            this.startAutoReportButton.node.on(Button.EventType.CLICK, this.onStartAutoReport, this);
        }
        
        if (this.stopAutoReportButton) {
            this.stopAutoReportButton.node.on(Button.EventType.CLICK, this.onStopAutoReport, this);
        }
    }

    /**
     * 测试真实设备信息风控上报
     */
    private async onTestRiskDetection(): Promise<void> {
        try {
            this.updateStatus('正在进行风控检测...');
            this.updateResult('');
            
            log('开始测试真实设备风控上报');
            
            const response = await this.riskDetectionService.performRiskDetection();
            
            this.handleSuccessResponse(response);
            
        } catch (error) {
            this.handleErrorResponse(error);
        }
    }

    /**
     * 测试模拟数据风控上报
     */
    private async onTestMockData(): Promise<void> {
        try {
            this.updateStatus('正在进行模拟数据风控检测...');
            this.updateResult('');
            
            log('开始测试模拟数据风控上报');
            
            const response = await this.riskDetectionService.performRiskDetectionWithMockData();
            
            this.handleSuccessResponse(response);
            
        } catch (error) {
            this.handleErrorResponse(error);
        }
    }

    /**
     * 启动自动风控上报
     */
    private onStartAutoReport(): void {
        try {
            this.riskDetectionService.startAutoReport();
            this.updateStatus('自动风控上报已启动');
            this.updateButtonStates();
            
            log('用户启动了自动风控上报');
            
        } catch (error) {
            this.handleErrorResponse(error);
        }
    }

    /**
     * 停止自动风控上报
     */
    private onStopAutoReport(): void {
        try {
            this.riskDetectionService.stopAutoReport();
            this.updateStatus('自动风控上报已停止');
            this.updateButtonStates();
            
            log('用户停止了自动风控上报');
            
        } catch (error) {
            this.handleErrorResponse(error);
        }
    }

    /**
     * 处理成功响应
     */
    private handleSuccessResponse(response: RiskDetectionResponse): void {
        const resultText = this.formatResponse(response);
        this.updateResult(`上报成功！\n${resultText}`);
        this.updateStatus('风控检测完成');
        
        log('风控上报成功:', response);
        
        // 根据响应状态显示不同的提示
        if (response.success) {
            this.updateStatus('✅ 风控检测通过');
        } else if (response.error) {
            this.updateStatus('❌ 风控检测发现异常');
        } else if (response.warn) {
            this.updateStatus('⚠️ 风控检测发现警告');
        } else {
            this.updateStatus('ℹ️ 风控检测完成');
        }
    }

    /**
     * 处理错误响应
     */
    private handleErrorResponse(error: any): void {
        const errorText = error?.message || error?.toString() || '未知错误';
        this.updateResult(`上报失败：${errorText}`);
        this.updateStatus('❌ 风控检测失败');
        
        warn('风控上报失败:', error);
    }

    /**
     * 格式化响应数据
     */
    private formatResponse(response: RiskDetectionResponse): string {
        const parts = [];
        
        if (response.success) parts.push('✅ 成功');
        if (response.error) parts.push('❌ 错误');
        if (response.warn) parts.push('⚠️ 警告');
        if (response.empty) parts.push('📋 空数据');
        
        return parts.length > 0 ? parts.join(' | ') : '状态未知';
    }

    /**
     * 更新状态显示
     */
    private updateStatus(status: string): void {
        if (this.statusLabel) {
            this.statusLabel.string = status;
        }
        log('状态更新:', status);
    }

    /**
     * 更新结果显示
     */
    private updateResult(result: string): void {
        if (this.resultLabel) {
            this.resultLabel.string = result;
        }
    }

    /**
     * 更新UI状态
     */
    private updateStatusUI(): void {
        this.updateButtonStates();
        
        // 显示最后上报时间
        const lastReportTime = this.riskDetectionService?.getLastReportTime() || 0;
        if (lastReportTime > 0) {
            const lastReportDate = new Date(lastReportTime);
            this.updateStatus(`最后上报：${lastReportDate.toLocaleString()}`);
        } else {
            this.updateStatus('尚未进行风控上报');
        }
    }

    /**
     * 更新按钮状态
     */
    private updateButtonStates(): void {
        // 这里可以根据实际状态启用/禁用按钮
        // 例如，如果自动上报正在运行，可以禁用启动按钮，启用停止按钮
    }

    /**
     * 定时更新UI（每秒调用一次）
     */
    update(deltaTime: number): void {
        // 定期检查是否需要更新UI状态
        // 可以显示自动上报的倒计时等信息
    }

    /**
     * 手动触发一次风控检测（供外部调用）
     */
    public async triggerRiskDetection(): Promise<RiskDetectionResponse> {
        return await this.riskDetectionService.performRiskDetection();
    }

    /**
     * 手动触发模拟数据风控检测（供外部调用）
     */
    public async triggerMockRiskDetection(): Promise<RiskDetectionResponse> {
        return await this.riskDetectionService.performRiskDetectionWithMockData();
    }

    /**
     * 获取风控服务实例
     */
    public getRiskDetectionService(): RiskDetectionService {
        return this.riskDetectionService;
    }

    /**
     * 设置自动上报间隔
     */
    public setAutoReportInterval(intervalMs: number): void {
        this.riskDetectionService.setAutoReportInterval(intervalMs);
        this.updateStatus(`自动上报间隔已设置为 ${intervalMs/1000} 秒`);
    }

    onDestroy() {
        // 清理按钮事件监听
        if (this.testRiskDetectionButton) {
            this.testRiskDetectionButton.node.off(Button.EventType.CLICK, this.onTestRiskDetection, this);
        }
        
        if (this.testMockDataButton) {
            this.testMockDataButton.node.off(Button.EventType.CLICK, this.onTestMockData, this);
        }
        
        if (this.startAutoReportButton) {
            this.startAutoReportButton.node.off(Button.EventType.CLICK, this.onStartAutoReport, this);
        }
        
        if (this.stopAutoReportButton) {
            this.stopAutoReportButton.node.off(Button.EventType.CLICK, this.onStopAutoReport, this);
        }
    }
}

/**
 * 静态工具函数：快速执行风控检测
 */
export class RiskDetectionUtils {
    
    /**
     * 快速执行一次风控检测（使用真实设备信息）
     */
    public static async quickRiskDetection(): Promise<RiskDetectionResponse> {
        try {
            // 创建临时的风控服务实例
            const tempNode = new Node('TempRiskDetection');
            const service = tempNode.addComponent(RiskDetectionService);
            
            // 执行检测
            const result = await service.performRiskDetection();
            
            // 清理临时节点
            tempNode.destroy();
            
            return result;
        } catch (error) {
            warn('快速风控检测失败:', error);
            throw error;
        }
    }
    
    /**
     * 快速执行一次风控检测（使用模拟数据）
     */
    public static async quickMockRiskDetection(): Promise<RiskDetectionResponse> {
        try {
            // 创建临时的风控服务实例
            const tempNode = new Node('TempMockRiskDetection');
            const service = tempNode.addComponent(RiskDetectionService);
            
            // 执行检测
            const result = await service.performRiskDetectionWithMockData();
            
            // 清理临时节点
            tempNode.destroy();
            
            return result;
        } catch (error) {
            warn('快速模拟风控检测失败:', error);
            throw error;
        }
    }
} 