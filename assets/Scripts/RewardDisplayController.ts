import { _decorator, Component, Label, log, warn, director } from 'cc';
import { ApiConfig } from '../API/ApiConfig';

const { ccclass, property } = _decorator;

/**
 * RewardDisplayController
 * 负责在场景中展示并更新——红包、金币、财神数量、下次奖励次数等信息。
 * 将此脚本挂载到包含对应 Label 的节点上，并在编辑器中拖拽绑定。
 *
 * 1. 可直接通过实例方法 updateDisplay 设置具体数值。
 * 2. 也可使用静态方法 updateCurrentSceneDisplay / updateCurrentSceneDisplayDelayed
 *    根据 ApiConfig 中缓存的游戏进度数据批量更新当前场景的所有 RewardDisplayController 组件。
 */
@ccclass('RewardDisplayController')
export class RewardDisplayController extends Component {

    @property({ type: Label, tooltip: '红包数量 Label' })
    redBagLabel: Label = null;

    @property({ type: Label, tooltip: '金币数量 Label' })
    goldLabel: Label = null;

    @property({ type: Label, tooltip: '合成财神数量 Label' })
    caishenLabel: Label = null;

    @property({ type: Label, tooltip: '下次奖励次数 Label' })
    nextRewardTimesLabel: Label = null;

    /**
     * 使用提供的数值更新界面
     */
    public updateDisplay(redBagNum: number, goldNum: number, caishenNum: number, nextRewardTimes: number): void {
        if (this.redBagLabel) {
            this.redBagLabel.string = this.formatNumber(redBagNum);
        }
        if (this.goldLabel) {
            this.goldLabel.string = this.formatNumber(goldNum);
        }
        if (this.caishenLabel) {
            this.caishenLabel.string = this.formatNumber(caishenNum);
        }
        if (this.nextRewardTimesLabel) {
            this.nextRewardTimesLabel.string = nextRewardTimes.toString();
        }
    }

    /**
     * 根据游戏进度对象更新显示
     */
    public updateDisplayWithProgress(progress: any): void {
        if (!progress) {
            warn('RewardDisplayController: 进度数据为空，无法更新显示');
            return;
        }
        const redBagNum = this.parseNumberValue(progress.redBagNum || 0);
        const goldNum = this.parseNumberValue(progress.goldNum || 0);
        const caishenNum = this.parseNumberValue(progress.composeTgcfNum || 0);
        const nextRewardTimes = this.parseNumberValue(progress.nextRewardTimes || 0);

        this.updateDisplay(redBagNum, goldNum, caishenNum, nextRewardTimes);
    }

    /**
     * 静态：立即更新当前场景中所有 RewardDisplayController
     */
    public static updateCurrentSceneDisplay(): void {
        try {
            const scene = director.getScene();
            if (!scene) {
                warn('RewardDisplayController: 无法获取当前场景');
                return;
            }

            const comps = scene.getComponentsInChildren(RewardDisplayController);
            if (!comps || comps.length === 0) {
                warn('RewardDisplayController: 当前场景没有挂载此组件');
                return;
            }

            const progress = ApiConfig.getGameProgress();
            comps.forEach(c => c.updateDisplayWithProgress(progress));
            log('RewardDisplayController: 已更新当前场景显示');
        } catch (e) {
            warn('RewardDisplayController: 更新显示时发生错误', e);
        }
    }

    /**
     * 静态：延迟更新当前场景显示
     */
    public static updateCurrentSceneDisplayDelayed(delay: number = 300): void {
        setTimeout(() => {
            RewardDisplayController.updateCurrentSceneDisplay();
        }, delay);
    }

    // ---------- 工具方法 ----------
    private formatNumber(num: number): string {
        return num.toString();
    }

    private parseNumberValue(value: string | number): number {
        if (typeof value === 'number') return value;
        const parsed = parseFloat(value as string);
        return isNaN(parsed) ? 0 : parsed;
    }
} 