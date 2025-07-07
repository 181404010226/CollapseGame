import { _decorator, Component, log } from 'cc';
import { GameUIUpdater } from './GameUIUpdater';

const { ccclass, property } = _decorator;

/**
 * 场景UI初始化器
 * 将此组件挂载到需要自动更新UI的场景的根节点上
 * 场景加载完成后会自动更新相应的UI显示
 * 
 * 支持的场景：
 * - 首页：更新 BalanceLabel1（红包）、BalanceLabel2（金币）
 * - Withdraw：更新 CoinAmount（金币）
 * - WithDraw2：更新 CoinAmountLabel（红包）
 * - My：更新 CurrentProgressLabel（经验值）
 */
@ccclass('SceneUIInitializer')
export class SceneUIInitializer extends Component {

    @property({ 
        tooltip: '是否在场景启动时自动更新UI' 
    })
    public autoUpdateOnStart: boolean = true;

    @property({ 
        range: [0, 2000, 50],
        tooltip: '延迟更新时间（毫秒），用于确保场景完全加载后再更新UI' 
    })
    public updateDelay: number = 200;

    start() {
        if (this.autoUpdateOnStart) {
            this.updateSceneUI();
        }
    }

    /**
     * 更新当前场景的UI
     */
    public updateSceneUI(): void {
        try {
            log(`SceneUIInitializer: 开始更新场景UI，延迟 ${this.updateDelay}ms`);
            
            // 延迟更新以确保场景完全加载
            setTimeout(() => {
                GameUIUpdater.updateCurrentSceneUI();
                log('SceneUIInitializer: 场景UI更新完成');
            }, this.updateDelay);
            
        } catch (error) {
            console.error('SceneUIInitializer: 更新场景UI时出错:', error);
        }
    }

    /**
     * 手动触发UI更新（可以绑定到按钮等）
     */
    public manualUpdateUI(): void {
        log('SceneUIInitializer: 手动更新UI');
        GameUIUpdater.updateCurrentSceneUI();
    }
} 