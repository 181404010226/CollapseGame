import { _decorator, Component, log, warn } from 'cc';
import { RiskDetectionService } from '../API/RiskDetectionService';
import { RiskDetectionUtils } from '../API/RiskDetectionExample';

const { ccclass, property } = _decorator;

/**
 * 风控上报测试脚本
 * 可以直接挂载到场景节点上进行测试
 */
@ccclass('RiskDetectionTest')
export class RiskDetectionTest extends Component {
    
    @property({
        tooltip: '是否在启动时自动测试'
    })
    private autoTestOnStart: boolean = true;
    
    @property({
        tooltip: '是否使用模拟数据测试'
    })
    private useMockData: boolean = true;
    
    @property({
        tooltip: '测试间隔（秒）'
    })
    private testInterval: number = 10;

    private riskService: RiskDetectionService = null;

    start() {
        log('=== 风控上报测试脚本启动 ===');
        
        // 创建风控服务
        this.riskService = this.addComponent(RiskDetectionService);
        
        if (this.autoTestOnStart) {
            this.scheduleOnce(() => {
                this.runTests();
            }, 1); // 延迟1秒执行，确保服务初始化完成
        }
    }

    /**
     * 运行所有测试
     */
    private async runTests(): Promise<void> {
        log('=== 开始风控上报测试 ===');
        
        try {
            // 测试1: 模拟数据测试
            if (this.useMockData) {
                await this.testMockData();
            }
            
            // 测试2: 真实设备信息测试  
            await this.testRealDeviceData();
            
            // 测试3: 工具函数测试
            await this.testUtilityFunctions();
            
            // 测试4: 自动上报测试
            await this.testAutoReport();
            
            log('=== 所有测试完成 ===');
            
        } catch (error) {
            warn('测试过程中发生错误:', error);
        }
    }

    /**
     * 测试模拟数据上报
     */
    private async testMockData(): Promise<void> {
        log('--- 测试1: 模拟数据上报 ---');
        
        try {
            const response = await this.riskService.performRiskDetectionWithMockData();
            log('✅ 模拟数据测试成功:', response);
            
            // 验证响应格式
            this.validateResponse(response, '模拟数据测试');
            
        } catch (error) {
            warn('❌ 模拟数据测试失败:', error);
        }
    }

    /**
     * 测试真实设备信息上报
     */
    private async testRealDeviceData(): Promise<void> {
        log('--- 测试2: 真实设备信息上报 ---');
        
        try {
            const response = await this.riskService.performRiskDetection();
            log('✅ 真实设备测试成功:', response);
            
            // 验证响应格式
            this.validateResponse(response, '真实设备测试');
            
        } catch (error) {
            warn('❌ 真实设备测试失败:', error);
        }
    }

    /**
     * 测试工具函数
     */
    private async testUtilityFunctions(): Promise<void> {
        log('--- 测试3: 工具函数测试 ---');
        
        try {
            // 测试快速模拟检测
            const mockResult = await RiskDetectionUtils.quickMockRiskDetection();
            log('✅ 快速模拟检测成功:', mockResult);
            
            // 测试快速真实检测
            const realResult = await RiskDetectionUtils.quickRiskDetection();
            log('✅ 快速真实检测成功:', realResult);
            
        } catch (error) {
            warn('❌ 工具函数测试失败:', error);
        }
    }

    /**
     * 测试自动上报功能
     */
    private async testAutoReport(): Promise<void> {
        log('--- 测试4: 自动上报功能 ---');
        
        try {
            // 设置较短的测试间隔
            this.riskService.setAutoReportInterval(this.testInterval * 1000);
            
            // 启动自动上报
            this.riskService.startAutoReport();
            log('✅ 自动上报已启动，间隔:', this.testInterval, '秒');
            
            // 等待一段时间后停止
            this.scheduleOnce(() => {
                this.riskService.stopAutoReport();
                log('✅ 自动上报已停止');
            }, this.testInterval * 2);
            
        } catch (error) {
            warn('❌ 自动上报测试失败:', error);
        }
    }

    /**
     * 验证响应格式
     */
    private validateResponse(response: any, testName: string): void {
        if (!response) {
            warn(`${testName}: 响应为空`);
            return;
        }
        
        const requiredFields = ['error', 'success', 'warn', 'empty'];
        const missingFields = requiredFields.filter(field => 
            typeof response[field] !== 'boolean'
        );
        
        if (missingFields.length > 0) {
            warn(`${testName}: 缺少字段:`, missingFields);
        } else {
            log(`${testName}: 响应格式验证通过`);
        }
        
        // 分析响应状态
        this.analyzeResponseStatus(response, testName);
    }

    /**
     * 分析响应状态
     */
    private analyzeResponseStatus(response: any, testName: string): void {
        const statuses = [];
        
        if (response.success) statuses.push('✅ 成功');
        if (response.error) statuses.push('❌ 错误');
        if (response.warn) statuses.push('⚠️ 警告');
        if (response.empty) statuses.push('📋 空数据');
        
        const statusText = statuses.length > 0 ? statuses.join(' | ') : '状态未知';
        log(`${testName} 状态:`, statusText);
    }

    /**
     * 手动执行测试（可通过编辑器按钮调用）
     */
    public async manualTest(): Promise<void> {
        await this.runTests();
    }

    /**
     * 手动执行单个模拟数据测试
     */
    public async testMockDataOnly(): Promise<void> {
        await this.testMockData();
    }

    /**
     * 手动执行单个真实数据测试
     */
    public async testRealDataOnly(): Promise<void> {
        await this.testRealDeviceData();
    }

    /**
     * 获取最后上报时间
     */
    public getLastReportTime(): string {
        const timestamp = this.riskService?.getLastReportTime() || 0;
        if (timestamp === 0) {
            return '尚未上报';
        }
        return new Date(timestamp).toLocaleString();
    }

    /**
     * 检查是否需要上报
     */
    public checkShouldReport(): boolean {
        return this.riskService?.shouldReport() || false;
    }

    /**
     * 打印当前状态信息
     */
    public printStatus(): void {
        log('=== 风控上报状态信息 ===');
        log('最后上报时间:', this.getLastReportTime());
        log('是否需要上报:', this.checkShouldReport());
        log('自动测试启用:', this.autoTestOnStart);
        log('使用模拟数据:', this.useMockData);
        log('测试间隔:', this.testInterval, '秒');
    }
}

/**
 * 全局测试工具函数
 */
export class GlobalRiskTestUtils {
    
    /**
     * 执行完整的风控测试套件
     */
    public static async runFullTestSuite(): Promise<void> {
        log('=== 执行全局风控测试套件 ===');
        
        try {
            // 1. 快速模拟测试
            log('执行快速模拟测试...');
            const mockResult = await RiskDetectionUtils.quickMockRiskDetection();
            log('快速模拟测试结果:', mockResult);
            
            // 2. 快速真实测试
            log('执行快速真实测试...');
            const realResult = await RiskDetectionUtils.quickRiskDetection();
            log('快速真实测试结果:', realResult);
            
            log('=== 全局测试套件完成 ===');
            
        } catch (error) {
            warn('全局测试套件执行失败:', error);
            throw error;
        }
    }
    
    /**
     * 生成测试报告
     */
    public static generateTestReport(results: any[]): string {
        const report = [];
        report.push('=== 风控上报测试报告 ===');
        report.push(`测试时间: ${new Date().toLocaleString()}`);
        report.push(`测试数量: ${results.length}`);
        
        results.forEach((result, index) => {
            report.push(`测试${index + 1}: ${result.success ? '✅ 成功' : '❌ 失败'}`);
            if (result.error) {
                report.push(`  错误: ${result.error}`);
            }
        });
        
        report.push('=== 报告结束 ===');
        return report.join('\n');
    }
} 