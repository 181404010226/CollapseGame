import { _decorator, Component, Button, Label, log } from 'cc';
import { GameUIUpdater } from './GameUIUpdater';
import { ApiConfig } from '../API/ApiConfig';

const { ccclass, property } = _decorator;

/**
 * 游戏UI更新器测试示例
 * 用于测试和验证GameUIUpdater的功能
 */
@ccclass('GameUIUpdaterExample')
export class GameUIUpdaterExample extends Component {

    @property(Button)
    testUpdateUIButton: Button = null;

    @property(Button)
    testDelayedUpdateUIButton: Button = null;

    @property(Button)
    setTestDataButton: Button = null;

    @property(Button)
    clearDataButton: Button = null;

    @property(Label)
    statusLabel: Label = null;

    start() {
        this.bindEvents();
        this.updateStatus("UI更新器测试就绪");
    }

    /**
     * 绑定按钮事件
     */
    private bindEvents(): void {
        if (this.testUpdateUIButton) {
            this.testUpdateUIButton.node.on(Button.EventType.CLICK, this.onTestUpdateUI, this);
        }

        if (this.testDelayedUpdateUIButton) {
            this.testDelayedUpdateUIButton.node.on(Button.EventType.CLICK, this.onTestDelayedUpdateUI, this);
        }

        if (this.setTestDataButton) {
            this.setTestDataButton.node.on(Button.EventType.CLICK, this.onSetTestData, this);
        }

        if (this.clearDataButton) {
            this.clearDataButton.node.on(Button.EventType.CLICK, this.onClearData, this);
        }
    }

    /**
     * 测试UI更新
     */
    private onTestUpdateUI(): void {
        try {
            log('=== 手动测试UI更新 ===');
            this.updateStatus("正在更新UI...");
            
            GameUIUpdater.updateCurrentSceneUI();
            
            this.updateStatus("UI更新完成");
            log('手动UI更新测试完成');
        } catch (error) {
            this.updateStatus(`UI更新失败: ${error.message}`);
            log('手动UI更新测试失败:', error);
        }
    }

    /**
     * 测试延迟UI更新
     */
    private onTestDelayedUpdateUI(): void {
        try {
            log('=== 手动测试延迟UI更新 ===');
            this.updateStatus("正在启动延迟UI更新...");
            
            GameUIUpdater.updateCurrentSceneUIDelayed(500);
            
            this.updateStatus("延迟UI更新已启动，等待500ms");
            log('延迟UI更新已启动');
            
            // 1秒后更新状态
            setTimeout(() => {
                this.updateStatus("延迟UI更新测试完成");
                log('延迟UI更新测试完成');
            }, 1000);
            
        } catch (error) {
            this.updateStatus(`延迟UI更新失败: ${error.message}`);
            log('延迟UI更新测试失败:', error);
        }
    }

    /**
     * 设置测试数据
     */
    private onSetTestData(): void {
        try {
            log('=== 设置测试游戏进度数据 ===');
            
            // 生成随机测试数据
            const redBagNum = Math.floor(Math.random() * 100000) + 1000;
            const goldNum = Math.floor(Math.random() * 50000) + 5000;
            const exp = Math.floor(Math.random() * 10000) + 500;
            
            const testData = {
                redBagNum: redBagNum,
                goldNum: goldNum,
                level: 1,
                exp: exp,
                composeNum: 5
            };
            
            ApiConfig.setGameProgress(testData);
            
            this.updateStatus(`已设置测试数据 - 红包:${redBagNum}, 金币:${goldNum}, 经验:${exp}`);
            log('测试数据已设置:', testData);
            
            // 自动更新UI
            setTimeout(() => {
                this.onTestUpdateUI();
            }, 500);
            
        } catch (error) {
            this.updateStatus(`设置测试数据失败: ${error.message}`);
            log('设置测试数据失败:', error);
        }
    }

    /**
     * 清除测试数据
     */
    private onClearData(): void {
        try {
            log('=== 清除游戏进度数据 ===');
            
            ApiConfig.setGameProgress(null);
            
            this.updateStatus("已清除游戏进度数据");
            log('游戏进度数据已清除');
            
        } catch (error) {
            this.updateStatus(`清除数据失败: ${error.message}`);
            log('清除数据失败:', error);
        }
    }

    /**
     * 更新状态显示
     */
    private updateStatus(message: string): void {
        if (this.statusLabel) {
            this.statusLabel.string = message;
        }
        log(`状态: ${message}`);
    }

    /**
     * 获取当前游戏进度数据（用于调试）
     */
    public getCurrentGameProgress(): any {
        return ApiConfig.getGameProgress();
    }

    /**
     * 快速测试方法（通过控制台调用）
     */
    public quickTest(): void {
        log('=== 快速测试开始 ===');
        
        // 1. 设置测试数据
        this.onSetTestData();
        
        // 2. 延迟更新UI
        setTimeout(() => {
            this.onTestUpdateUI();
        }, 1000);
        
        log('快速测试已启动，请查看UI变化');
    }
} 