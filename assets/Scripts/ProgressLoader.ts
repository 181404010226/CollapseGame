import { _decorator, Component, log, warn } from 'cc';
import { GameProgressService } from '../API/GameProgressService';
import { ApiConfig } from '../API/ApiConfig';
import { RewardDisplayController } from './RewardDisplayController';

const { ccclass, property } = _decorator;

/**
 * 游戏进度加载器
 * 用于在游戏启动时加载服务器的游戏进度数据
 */
@ccclass('ProgressLoader')
export class ProgressLoader extends Component {

    @property({
        displayName: '自动加载进度',
        tooltip: '是否在start时自动加载进度'
    })
    autoLoad: boolean = true;

    private gps: GameProgressService;

    async start() {
        // 添加 GameProgressService 组件
        this.gps = this.node.addComponent(GameProgressService);

        if (this.autoLoad) {
            try {
                await this.loadProgress();
            } catch (error) {
                // 在start方法中捕获并处理加载错误，防止未处理的Promise拒绝
                warn('启动时加载游戏进度失败:', error);
                // 错误已在 loadProgress 方法中详细处理，这里仅记录日志
            }
        }
    }

    /**
     * 加载游戏进度
     * 可以从外部调用此方法手动加载进度
     */
    public async loadProgress(): Promise<any> {
        try {
            log('开始加载游戏进度...');

            // 检查是否已登录
            const userData = ApiConfig.getUserData();
            if (!userData || !userData.access_token) {
                warn('用户未登录，无法加载进度');
                throw new Error('用户未登录');
            }

            // 拉取服务器进度
            const progressData = await this.gps.queryGameProgress();
            log('成功拉取到的进度数据：', progressData);

            // 验证数据已保存到全局缓存
            const cachedProgress = ApiConfig.getGameProgress();
            log('全局缓存的进度数据：', cachedProgress);

            // TODO: 根据 progressData 初始化游戏状态
            this.initializeGameWithProgress(progressData);

            return progressData;

        } catch (error) {
            warn('加载游戏进度失败：', error);
            
            // 可以在这里处理失败逻辑，比如使用本地缓存或默认进度
            this.handleLoadProgressError(error);
            throw error;
        }
    }

    /**
     * 根据进度数据初始化游戏
     * @param progressData 服务器返回的进度数据
     */
    private initializeGameWithProgress(progressData: any): void {
        if (!progressData) {
            log('进度数据为空，使用默认设置');
            return;
        }

        log('正在根据进度数据初始化游戏...');
        
        // TODO: 在这里添加具体的游戏初始化逻辑
        // 例如：
        // - 设置玩家等级
        // - 恢复游戏关卡
        // - 加载背包物品
        // - 设置游戏设置等
        
        // 示例代码：
        // if (progressData.level) {
        //     this.gameManager.setPlayerLevel(progressData.level);
        // }
        // if (progressData.currentStage) {
        //     this.gameManager.setCurrentStage(progressData.currentStage);
        // }
        
        log('游戏初始化完成');

        // 更新当前场景的UI显示
        try {
            log('游戏进度加载后开始更新当前场景UI...');
            RewardDisplayController.updateCurrentSceneDisplay();
            log('游戏进度加载后场景UI更新完成');
        } catch (uiError) {
            warn('游戏进度加载后UI更新失败:', uiError);
        }
    }

    /**
     * 处理加载进度失败的情况
     * @param error 错误信息
     */
    private handleLoadProgressError(error: any): void {
        warn('进度加载失败的详细错误：', error);
        warn('错误类型：', typeof error);
        warn('错误消息：', error?.message || '未知错误');
        
        log('处理进度加载失败，可能的处理方案：');
        log('1. 使用本地缓存的进度');
        log('2. 使用默认的新手进度');
        log('3. 提示用户重试');
        
        // 检查用户登录状态
        const userData = ApiConfig.getUserData();
        if (!userData) {
            warn('用户未登录，这可能是失败的原因');
        } else {
            log('用户已登录，token:', userData.access_token ? '存在' : '缺失');
        }
        
        // TODO: 根据实际需求选择合适的处理方案
        // 例如：
        // const localProgress = this.getLocalProgress();
        // if (localProgress) {
        //     this.initializeGameWithProgress(localProgress);
        // } else {
        //     this.initializeGameWithProgress(this.getDefaultProgress());
        // }
    }

    /**
     * 重新加载进度（可供外部调用）
     */
    public async reloadProgress(): Promise<any> {
        log('重新加载游戏进度...');
        return await this.loadProgress();
    }

    /**
     * 获取当前缓存的进度数据
     */
    public getCurrentProgress(): any {
        return ApiConfig.getGameProgress();
    }

    /**
     * 检查是否已加载进度
     */
    public hasProgressLoaded(): boolean {
        return ApiConfig.getGameProgress() !== null;
    }
} 