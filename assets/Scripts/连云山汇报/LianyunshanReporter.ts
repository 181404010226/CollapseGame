import { _decorator, Component, Node, Button, log, warn, Enum } from 'cc';
import { LianyunshanSDK } from '../../API/LianyunshanSDK';

const { ccclass, property } = _decorator;

/**
 * 连云山场景上报器
 * 用于在特定场景下向连云山SDK上报数据
 */
@ccclass('LianyunshanReporter')
export class LianyunshanReporter extends Component {
    
    @property({
        type: Button,
        tooltip: '绑定的按钮组件'
    })
    public targetButton: Button = null;
    
    @property({
        type: Enum({
            GOLD_WITHDRAW: 0,
            RED_BAG_WITHDRAW: 1,
            WEALTH_WITHDRAW: 2
        }),
        tooltip: '选择提现场景类型'
    })
    public sceneType: number = 0;
    
    // 场景名称映射
    private sceneNameMap: string[] = [
        'gold_with_draw',      // 金币提现
        'red_bag_with_draw',   // 红包提现
        'weath_with_draw'      // 财神提现
    ];
    
    private lianyunshanSDK: LianyunshanSDK = null;
    
    start() {
        // 获取连云山SDK实例
        this.lianyunshanSDK = LianyunshanSDK.getInstance();
        
        // 如果绑定了按钮，添加点击事件监听
        if (this.targetButton) {
            this.targetButton.node.on(Button.EventType.CLICK, this.onButtonClick, this);
            log(`[LianyunshanReporter] 已绑定按钮点击事件，场景名称: ${this.getSceneName()}`);
        } else {
            warn(`[LianyunshanReporter] 未绑定按钮组件，场景名称: ${this.getSceneName()}`);
        }
    }
    
    onDestroy() {
        // 移除按钮点击事件监听
        if (this.targetButton) {
            this.targetButton.node.off(Button.EventType.CLICK, this.onButtonClick, this);
        }
    }
    
    /**
     * 按钮点击事件处理
     */
    private onButtonClick(): void {
        const sceneName = this.getSceneName();
        log(`[LianyunshanReporter] 按钮被点击，准备上报场景: ${sceneName}`);
        this.reportScene(sceneName);
    }
    
    /**
     * 上报场景到连云山SDK
     * @param sceneName 场景名称
     */
    public async reportScene(sceneName: string): Promise<void> {
        if (!sceneName || sceneName.trim().length === 0) {
            warn('[LianyunshanReporter] 场景名称不能为空');
            return;
        }
        
        if (!this.lianyunshanSDK) {
            warn('[LianyunshanReporter] 连云山SDK实例未初始化');
            return;
        }
        
        try {
            log(`[LianyunshanReporter] 开始上报场景: ${sceneName}`);
            
            const success = await this.lianyunshanSDK.reportScene(sceneName);
            
            if (success) {
                log(`[LianyunshanReporter] 场景上报成功: ${sceneName}`);
            } else {
                warn(`[LianyunshanReporter] 场景上报失败: ${sceneName}`);
            }
        } catch (error) {
            warn(`[LianyunshanReporter] 场景上报异常: ${sceneName}`, error);
        }
    }
    
    /**
     * 手动触发场景上报（供外部调用）
     */
    public triggerReport(): void {
        this.reportScene(this.getSceneName());
    }
    
    /**
     * 设置场景类型
     * @param sceneType 新的场景类型索引
     */
    public setSceneType(sceneType: number): void {
        if (sceneType >= 0 && sceneType < this.sceneNameMap.length) {
            this.sceneType = sceneType;
            log(`[LianyunshanReporter] 场景类型已更新为: ${this.getSceneName()}`);
        } else {
            warn(`[LianyunshanReporter] 无效的场景类型索引: ${sceneType}`);
        }
    }
    
    /**
     * 获取当前场景名称
     */
    public getSceneName(): string {
        if (this.sceneType >= 0 && this.sceneType < this.sceneNameMap.length) {
            return this.sceneNameMap[this.sceneType];
        }
        return this.sceneNameMap[0]; // 默认返回金币提现
    }
    
    /**
     * 获取当前场景类型
     */
    public getSceneType(): number {
        return this.sceneType;
    }
    
    /**
     * 静态方法：快速上报场景（不依赖组件实例）
     * @param sceneName 场景名称
     */
    public static async quickReport(sceneName: string): Promise<void> {
        try {
            const sdk = LianyunshanSDK.getInstance();
            if (sdk) {
                await sdk.reportScene(sceneName);
                log(`[LianyunshanReporter] 快速上报成功: ${sceneName}`);
            } else {
                warn('[LianyunshanReporter] 连云山SDK实例不可用');
            }
        } catch (error) {
            warn(`[LianyunshanReporter] 快速上报失败: ${sceneName}`, error);
        }
    }
}

/**
 * 提现场景名称常量（注册场景由SDK自动处理）
 */
export const WITHDRAW_SCENE_NAMES = {
    GOLD_WITHDRAW: 'gold_with_draw',       // 金币提现
    RED_BAG_WITHDRAW: 'red_bag_with_draw', // 红包提现
    WEALTH_WITHDRAW: 'weath_with_draw'     // 财神提现
} as const;

/**
 * 提现场景名称类型
 */
export type WithdrawSceneName = typeof WITHDRAW_SCENE_NAMES[keyof typeof WITHDRAW_SCENE_NAMES];