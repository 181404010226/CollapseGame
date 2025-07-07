import { _decorator, Component, log, warn } from 'cc';
import { ApiConfig } from '../API/ApiConfig';
import { GameProgressService, SaveGameProgressDto, SaveGameProgressVo } from '../API/GameProgressService';
import { RewardDisplayController } from './RewardDisplayController';

const { ccclass, property } = _decorator;

/**
 * SynthesisProgressReporter
 * 负责在一定时间窗口（rewardMoveDuration 秒）内收集合成成功的物品名称，
 * 并在窗口结束时调用 /game/saveGameProgress 接口上报。
 * 仅维护一个定时器，防止重复创建。
 */
@ccclass('SynthesisProgressReporter')
export class SynthesisProgressReporter extends Component {

    /**
     * 与奖励飞行动画保持一致的周期（秒）。
     */
    @property({ displayName: '上报时间窗口（秒）' })
    public rewardMoveDuration: number = 2.0;

    private composedItems: string[] = [];
    private timerId: number | null = null;

    private gps: GameProgressService = null;

    protected onLoad(): void {
        // 确保存在 GameProgressService 组件
        this.gps = this.node.getComponent(GameProgressService);
        if (!this.gps) {
            this.gps = this.node.addComponent(GameProgressService);
        }
    }

    /**
     * 记录一次合成成功的物品
     * @param itemName 物品名称常量
     */
    public recordComposeItem(itemName: string): void {
        if (!itemName) return;
        this.composedItems.push(itemName);
        // 如果计时器尚未启动，则启动一次性计时器
        if (this.timerId === null) {
            this.timerId = window.setTimeout(() => {
                this.flush();
            }, this.rewardMoveDuration * 1000);
        }
    }

    /**
     * 立即发送保存进度请求，并清空缓存
     */
    private async flush(): Promise<void> {
        const itemsToReport = [...this.composedItems];
        this.composedItems.length = 0;
        this.timerId = null;

        if (itemsToReport.length === 0) return;

        // 组装请求 DTO
        const dto: SaveGameProgressDto = {
            androidId: '',
            deviceId: '',
            requestId: Date.now().toString(),
            timeStamp: Date.now(),
            packageName: ApiConfig.getPackageName(),
            times: itemsToReport.length,
            composeTgcfNum: itemsToReport.filter(name => name === 'GOD_OF_WEALTH').length,
            composeIllustrationCodeList: itemsToReport,
            progress: JSON.stringify(ApiConfig.getGameProgress() || {})
        };

        try {
            log('⏫ 上报合成进度:', dto);
            const response: SaveGameProgressVo = await this.gps.saveGameProgress(dto);
            log('✅ 进度上报成功:', response);
            // 更新全局数据显示
            RewardDisplayController.updateCurrentSceneDisplay();
        } catch (error) {
            warn('⚠️ 进度上报失败:', error);
        }
    }

    protected onDestroy(): void {
        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        this.composedItems.length = 0;
    }
} 