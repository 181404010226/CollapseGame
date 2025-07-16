import { _decorator, Component, Label, log, warn, director } from 'cc';
import { ApiConfig, LocalGameProgress, GameSceneData } from '../API/ApiConfig';
import { DeviceInfoCollector } from '../API/DeviceInfoCollector';

const { ccclass, property } = _decorator;

/**
 * 保存游戏进度请求数据结构（新接口）
 */
export interface SaveGameProgressDto {
    androidId: string;
    deviceId: string;
    requestId: string;
    timeStamp: number;
    packageName?: string;
    times?: number;                // 合成次数
    goldNum?: number;              // 总金币数
    goldNumCompose?: number;       // 合成获得的金币数
    redBagNum?: number;            // 总红包数
    redBagNumCompose?: number;     // 合成获得的红包数
    exp?: number;                  // 经验值
    level?: number;                // 等级
    wealthNum?: number;            // 财神数
    drawNum?: number;              // 剩余抽奖次数
    progress?: string;             // 游戏进度JSON字符串
}

/**
 * 保存游戏进度响应数据结构（新接口）
 */
export interface SaveGameProgressVo {
    isOpenAd: boolean;
    goldNum: number;
    redBagNum: number;
    nextRewardTimes: number;
    wealthNum: number;
    exp: number;
    level: number;
}

/**
 * 查询游戏进度响应数据结构（新接口）
 */
export interface QueryGameProgressVo {
    goldNum: number;              // 总金币数
    goldNumCompose: number;       // 合成金币数
    redBagNum: number;            // 总红包数
    redBagNumCompose: number;     // 合成红包数
    wealthNum: number;            // 财神数
    exp: number;                  // 经验值
    progress: string;             // 游戏进度
    level: number;                // 等级
    drawNum: number;              // 剩余抽奖次数
}

/**
 * 查询游戏进度响应结构
 */
export interface QueryGameProgressResponse<T = any> {
    success: boolean;
    error?: boolean;
    warn?: boolean;
    empty?: boolean;
    msg?: string;
    code?: number;
    data?: T;
}

/**
 * API 响应统一结构
 */
interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

/**
 * 统一游戏进度管理器
 * 合并了 GameProgressService, ProgressLoader, SynthesisProgressReporter, RewardDisplayController 的功能
 */
@ccclass('GameProgressManager')
export class GameProgressManager extends Component {

    // ======== UI 绑定属性 ========
    @property({ type: Label, tooltip: '红包数量 Label' })
    redBagLabel: Label = null;

    @property({ type: Label, tooltip: '金币数量 Label' })
    goldLabel: Label = null;

    @property({ type: Label, tooltip: '合成财神数量 Label' })
    caishenLabel: Label = null;

    @property({ type: Label, tooltip: '剩余抽奖次数 Label' })
    drawNumLabel: Label = null;

    // ======== 配置属性 ========
    @property({
        displayName: '自动加载进度',
        tooltip: '是否在start时自动加载进度'
    })
    autoLoad: boolean = true;

    @property({
        displayName: '本地保存间隔(秒)',
        tooltip: '本地保存合成数据的间隔时间'
    })
    localSaveInterval: number = 2;

    @property({
        displayName: '服务器上报间隔(分钟)',
        tooltip: '向服务器上报进度的间隔时间'
    })
    serverReportInterval: number = 120;

    // ======== 私有属性 ========
    private deviceInfoCollector: DeviceInfoCollector = null;
    private localSaveTimer: number = null;
    private serverReportTimer: number = null;
    
    // API 端点
    private readonly QUERY_ENDPOINT = '/game/queryGameProgress';
    private readonly SAVE_ENDPOINT = '/game/saveGameProgress';

    // ======== 生命周期方法 ========
    protected onLoad(): void {
        // 设置为单例，确保全局只有一个实例
        const existingManager = director.getScene()?.getComponentInChildren(GameProgressManager);
        if (existingManager && existingManager !== this) {
            warn('GameProgressManager: 检测到重复实例，销毁当前实例');
            this.destroy();
            return;
        }

        // 获取设备信息收集器
        this.deviceInfoCollector = this.getComponent(DeviceInfoCollector);
        if (!this.deviceInfoCollector) {
            this.deviceInfoCollector = this.addComponent(DeviceInfoCollector);
        }

        // 设置场景切换监听器，确保任何时候进入场景都会初始化
        this.setupSceneChangeListener();
    }

    /**
     * 设置场景切换监听器
     */
    private setupSceneChangeListener(): void {
        // 使用定时器定期检查场景变化，而不是依赖事件
        this.scheduleOnce(() => {
            log('GameProgressManager: 场景切换监听器已设置');
        }, 0.1);
    }

    /**
     * 场景加载完成回调
     */
    private async onSceneLoaded(): Promise<void> {
        try {
            // 延迟一小段时间，确保场景完全初始化
            setTimeout(async () => {
                log('GameProgressManager: 检测到场景切换，开始自动初始化...');
                await this.initializeGameProgress();
            }, 150);
        } catch (error) {
            warn('GameProgressManager: 场景切换后自动初始化失败:', error);
        }
    }

    protected async start(): Promise<void> {
        log('GameProgressManager: 启动统一游戏进度管理器');
        
        // 使用新的初始化方法
        await this.initializeGameProgress();
    }

    // ======== 新增：公共初始化方法 ========
    /**
     * 初始化游戏进度（可在任何时候调用）
     */
    public async initializeGameProgress(): Promise<void> {
        try {
            log('GameProgressManager: 开始初始化游戏进度...');
            
            // 1. 加载本地缓存的进度数据
            this.loadLocalProgress();
            
            // 2. 启动定时器（如果尚未启动）
            if (!this.localSaveTimer || !this.serverReportTimer) {
                this.startTimers();
            }
            
            // 3. 检查用户登录状态并加载服务器进度
            const userData = ApiConfig.getUserData();
            if (userData && userData.access_token) {
                log('GameProgressManager: 检测到用户已登录，开始加载服务器进度');
                try {
                    await this.loadServerProgress();
                    log('GameProgressManager: 服务器进度加载成功');
                } catch (error) {
                    warn('GameProgressManager: 服务器进度加载失败，使用本地数据:', error);
                }
            } else {
                log('GameProgressManager: 用户未登录，跳过服务器进度加载');
            }
            
            // 4. 更新UI显示
            this.updateDisplay();
            this.updateAllSceneDisplays();
            
            // 5. 尝试恢复场景中的物品状态
            await this.restoreSceneItemsState();
            
            log('GameProgressManager: 游戏进度初始化完成');
            
        } catch (error) {
            warn('GameProgressManager: 初始化游戏进度时发生错误:', error);
            // 即使初始化失败，也要更新UI显示
            this.updateDisplay();
        }
    }

    /**
     * 恢复场景中的物品状态
     */
    private async restoreSceneItemsState(): Promise<void> {
        try {
            log('GameProgressManager: 开始恢复场景中的物品状态...');
            
            const scene = director.getScene();
            if (!scene) {
                warn('GameProgressManager: 当前场景不存在，跳过物品状态恢复');
                return;
            }

            // 查找场景中的 ItemDropGame 组件
            const components = scene.getComponentsInChildren(Component);
            let foundItemDropGame = false;
            
            for (const comp of components) {
                if (comp.constructor.name === 'ItemDropGame') {
                    const itemDropGame = comp as any;
                    foundItemDropGame = true;
                    
                    if (typeof itemDropGame.tryRestoreSceneState === 'function') {
                        log('GameProgressManager: 找到 ItemDropGame 组件，触发场景状态恢复...');
                        
                        // 等待一小段时间确保 ItemDropGame 完全初始化
                        await new Promise(resolve => setTimeout(resolve, 200));
                        
                        // 手动调用场景状态恢复
                        itemDropGame.tryRestoreSceneState();
                        log('GameProgressManager: 场景物品状态恢复已触发');
                    } else {
                        warn('GameProgressManager: ItemDropGame 组件缺少 tryRestoreSceneState 方法');
                    }
                    break;
                }
            }
            
            if (!foundItemDropGame) {
                log('GameProgressManager: 当前场景中没有找到 ItemDropGame 组件，跳过物品状态恢复');
            }
            
        } catch (error) {
            warn('GameProgressManager: 恢复场景物品状态时发生错误:', error);
        }
    }

    /**
     * 静态方法：初始化当前场景中的所有 GameProgressManager
     */
    public static async initializeAllInScene(): Promise<void> {
        try {
            const scene = director.getScene();
            if (!scene) {
                warn('GameProgressManager: 当前场景不存在，跳过初始化');
                return;
            }

            const managers = scene.getComponentsInChildren(GameProgressManager);
            if (managers.length === 0) {
                log('GameProgressManager: 当前场景中没有找到 GameProgressManager 组件');
                return;
            }

            log(`GameProgressManager: 发现 ${managers.length} 个 GameProgressManager 组件，开始初始化...`);
            
            // 并行初始化所有管理器
            const initPromises = managers.map(manager => manager.initializeGameProgress());
            await Promise.all(initPromises);
            
            log('GameProgressManager: 所有 GameProgressManager 组件初始化完成');
            
        } catch (error) {
            warn('GameProgressManager: 初始化场景中的 GameProgressManager 时发生错误:', error);
        }
    }

    /**
     * 统一的游戏数据同步和恢复方法
     * 不管是登录后进入首页还是其他方式返回首页，都使用这个方法
     */
    public static async syncAndRestoreGameData(): Promise<void> {
        try {
            log('GameProgressManager: 开始统一的游戏数据同步和恢复...');
            
            const scene = director.getScene();
            if (!scene) {
                warn('GameProgressManager: 当前场景不存在，跳过数据同步');
                return;
            }

            // 1. 先初始化所有GameProgressManager
            await GameProgressManager.initializeAllInScene();

            // 2. 获取主要的GameProgressManager实例
            const managers = scene.getComponentsInChildren(GameProgressManager);
            const primaryManager = managers[0];
            
            if (!primaryManager) {
                warn('GameProgressManager: 没有找到GameProgressManager实例');
                return;
            }

            // 3. 如果用户已登录，同步服务端数据
            const userData = ApiConfig.getUserData();
            if (userData && userData.access_token) {
                log('GameProgressManager: 检测到用户已登录，开始同步服务端数据...');
                try {
                    await primaryManager.loadServerProgress();
                    log('GameProgressManager: 服务端数据同步成功');
                } catch (error) {
                    warn('GameProgressManager: 服务端数据同步失败，使用本地数据:', error);
                }
            } else {
                log('GameProgressManager: 用户未登录，跳过服务端数据同步');
            }

            // 4. 恢复场景中的物品状态
            await primaryManager.restoreSceneItemsState();

            // 5. 通知所有ItemDropGame组件进行数据恢复
            const itemDropGames = scene.getComponentsInChildren(Component).filter(comp => 
                comp.constructor.name === 'ItemDropGame'
            );
            
            for (const itemDropGame of itemDropGames) {
                if (typeof (itemDropGame as any).unifiedDataRestore === 'function') {
                    log('GameProgressManager: 触发ItemDropGame的统一数据恢复...');
                    (itemDropGame as any).unifiedDataRestore();
                }
            }

            log('GameProgressManager: 统一的游戏数据同步和恢复完成');
            
        } catch (error) {
            warn('GameProgressManager: 统一数据同步和恢复失败:', error);
        }
    }

    /**
     * 强制重新初始化（用于场景切换后的刷新）
     */
    public async forceReinitialize(): Promise<void> {
        log('GameProgressManager: 强制重新初始化');
        
        // 停止现有定时器
        this.stopTimers();
        
        // 重新初始化
        await this.initializeGameProgress();
    }

    /**
     * 手动触发场景物品状态恢复（外部调用）
     */
    public async manualRestoreSceneItems(): Promise<void> {
        log('GameProgressManager: 手动触发场景物品状态恢复');
        await this.restoreSceneItemsState();
    }

    protected onDestroy(): void {
        this.stopTimers();
        // 最后一次保存本地数据
        this.saveLocalProgress();
    }

    // ======== 定时器管理 ========
    private startTimers(): void {
        // 本地保存定时器（每2秒）
        this.localSaveTimer = window.setInterval(() => {
            this.saveLocalProgress();
        }, this.localSaveInterval * 1000);

        // 服务器上报定时器（每120分钟）
        this.serverReportTimer = window.setInterval(() => {
            this.reportToServer();
        }, this.serverReportInterval * 60 * 1000);

        log(`GameProgressManager: 定时器已启动 - 本地保存间隔: ${this.localSaveInterval}秒, 服务器上报间隔: ${this.serverReportInterval}分钟`);
    }

    public stopTimers(): void {
        if (this.localSaveTimer) {
            clearInterval(this.localSaveTimer);
            this.localSaveTimer = null;
        }
        if (this.serverReportTimer) {
            clearInterval(this.serverReportTimer);
            this.serverReportTimer = null;
        }
        log('GameProgressManager: 定时器已停止');
    }

    // ======== 数据管理 ========
    private loadLocalProgress(): void {
        const localProgress = ApiConfig.loadLocalProgressFromStorage();
        if (!localProgress) {
            log('GameProgressManager: 本地进度数据不存在，初始化默认数据');
            ApiConfig.initializeDefaultProgress();
        } else {
            log('GameProgressManager: 成功加载本地进度数据', localProgress);
        }
    }

    private saveLocalProgress(): void {
        // 如果场景中有ItemDropGame组件，获取当前场景状态并保存
        try {
            const scene = director.getScene();
            if (scene) {
                // 查找ItemDropGame组件
                const components = scene.getComponentsInChildren(Component);
                for (const comp of components) {
                    if (comp.constructor.name === 'ItemDropGame') {
                        const itemDropGame = comp as any;
                        if (typeof itemDropGame.getCurrentSceneData === 'function') {
                            const sceneData = itemDropGame.getCurrentSceneData();
                            if (sceneData) {
                                ApiConfig.updateLocalSceneData(sceneData);
                                log('GameProgressManager: 本地场景数据已同步保存');
                            }
                        }
                        break;
                    }
                }
            }
        } catch (error) {
            // 静默处理错误，不影响正常的数据保存
        }
        
        ApiConfig.saveLocalProgressToStorage();
        log('GameProgressManager: 本地进度数据已保存');
    }

    // ======== 服务器交互 ========
    /**
     * 从服务器加载游戏进度
     */
    public async loadServerProgress(): Promise<any> {
        try {
            log('GameProgressManager: 开始从服务器加载游戏进度...');

            // 检查是否已登录
            const userData = ApiConfig.getUserData();
            if (!userData || !userData.access_token) {
                warn('GameProgressManager: 用户未登录，无法加载进度');
                throw new Error('用户未登录');
            }

            // 查询服务器进度
            const serverData = await this.queryGameProgress();
            log('GameProgressManager: 成功从服务器获取进度数据:', serverData);

            // 更新服务端数据缓存
            this.updateServerDataCache(serverData);

            // 解析并保存服务端场景数据
            this.parseAndSaveServerSceneData(serverData);

            // 更新本地数据
            ApiConfig.updateServerProgress(serverData);
            
            // 更新UI显示
            this.updateDisplay();
            this.updateAllSceneDisplays();

            return serverData;

        } catch (error) {
            warn('GameProgressManager: 从服务器加载进度失败:', error);
            throw error;
        }
    }

    /**
     * 更新服务端数据缓存
     */
    private updateServerDataCache(serverData: any): void {
        if (serverData) {
            this.serverComposeGoldCache = serverData.goldNumCompose || 0;
            this.serverComposeRedBagCache = serverData.redBagNumCompose || 0;
            log(`GameProgressManager: 服务端数据缓存已更新 - 金币:${this.serverComposeGoldCache}, 红包:${this.serverComposeRedBagCache}`);
        }
    }

    /**
     * 解析并保存服务端场景数据
     */
    private parseAndSaveServerSceneData(serverData: any): void {
        if (serverData && serverData.progress) {
            try {
                const progressData = JSON.parse(serverData.progress);
                if (progressData && progressData.sceneData) {
                    // 保存服务端场景数据到本地
                    const localProgress = ApiConfig.getLocalGameProgress();
                    if (localProgress) {
                        localProgress.serverSceneData = progressData.sceneData;
                        ApiConfig.saveLocalProgressToStorage();
                        log('GameProgressManager: 服务端场景数据已保存到本地');
                    }
                }
            } catch (error) {
                warn('GameProgressManager: 解析服务端进度数据失败:', error);
            }
        }
    }

    /**
     * 查询游戏进度
     */
    private async queryGameProgress(): Promise<any> {
        const token = ApiConfig.getUserData()?.access_token;
        if (!token) {
            throw new Error('access_token 缺失');
        }

        const url = ApiConfig.getFullUrl(this.QUERY_ENDPOINT);
        const timeout = ApiConfig.getTimeout();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = timeout;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const response: QueryGameProgressResponse = JSON.parse(xhr.responseText);
                            
                            if (response.success) {
                                resolve(response.data ?? null);
                            } else {
                                const message = response.msg || '获取游戏进度失败';
                                
                                // 特殊处理成功但success=false的情况
                                if (message.includes('成功') || message.includes('success')) {
                                    warn('GameProgressManager: 响应矛盾，尝试使用返回数据');
                                    resolve(response.data ?? null);
                                } else {
                                    reject(new Error(message));
                                }
                            }
                        } catch (parseErr) {
                            reject(new Error('响应解析失败: ' + parseErr));
                        }
                    } else {
                        reject(new Error(`HTTP错误: ${xhr.status} ${xhr.statusText}`));
                    }
                }
            };

            xhr.onerror = () => reject(new Error('网络请求失败'));
            xhr.ontimeout = () => reject(new Error(`请求超时 (${timeout}ms)`));

            xhr.open('GET', url, true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            
            log('GameProgressManager: 发送查询请求到:', url);
            xhr.send();
        });
    }

    /**
     * 向服务器上报进度（仅上报合成获得的金币总数）
     */
    private async reportToServer(): Promise<void> {
        try {
            const localProgress = ApiConfig.getLocalGameProgress();
            if (!localProgress) {
                log('GameProgressManager: 本地进度数据为空，跳过上报');
                return;
            }

                    // 如果没有合成数据，跳过上报
        if (localProgress.goldNumCompose === 0 && 
            localProgress.redBagNumCompose === 0 && 
            localProgress.times === 0) {
            log('GameProgressManager: 没有新的合成数据，跳过上报');
            return;
        }

            log('GameProgressManager: 开始向服务器上报进度...');
            
            const response = await this.saveGameProgress();
            log('GameProgressManager: 进度上报成功:', response);
            
            // 上报成功后，清空本地合成数据计数器
            this.resetComposeCounters();
            
            // 更新UI显示
            this.updateDisplay();
            this.updateAllSceneDisplays();

        } catch (error) {
            warn('GameProgressManager: 进度上报失败:', error);
        }
    }

    /**
     * 保存游戏进度到服务器
     */
    private async saveGameProgress(): Promise<SaveGameProgressVo> {
        const token = ApiConfig.getUserData()?.access_token;
        if (!token) {
            throw new Error('access_token 缺失');
        }

        const localProgress = ApiConfig.getLocalGameProgress();
        if (!localProgress) {
            throw new Error('本地进度数据缺失');
        }

        // 获取设备信息
        const deviceInfo = await this.deviceInfoCollector.collectDeviceInfo();
        
        // 构建请求数据
        const dto: SaveGameProgressDto = {
            androidId: deviceInfo.androidId || '',
            deviceId: deviceInfo.deviceId || '13974751124',
            requestId: `progress_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            timeStamp: Date.now(),
            packageName: ApiConfig.getPackageName(),
            times: localProgress.times,
            goldNum: localProgress.goldNumCompose + localProgress.goldNumOther,  // 总金币 = 合成金币 + 其他金币
            goldNumCompose: localProgress.goldNumCompose,  // 重点：只传合成获得的金币
            redBagNum: localProgress.redBagNumCompose + localProgress.redBagNumOther,  // 总红包 = 合成红包 + 其他红包
            redBagNumCompose: localProgress.redBagNumCompose,
            exp: localProgress.exp,
            level: localProgress.level,
            wealthNum: localProgress.wealthNum,
            drawNum: localProgress.drawNum,
            progress: this.buildProgressString()  // 包含场景数据的progress字符串
        };

        const url = ApiConfig.getFullUrl(this.SAVE_ENDPOINT);
        const timeout = ApiConfig.getTimeout();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = timeout;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const response: ApiResponse<SaveGameProgressVo> = JSON.parse(xhr.responseText);
                            
                            if (ApiConfig.isResponseSuccess(response.code)) {
                                // 更新服务器返回的数据
                                ApiConfig.updateServerProgress(response.data);
                                resolve(response.data);
                            } else {
                                reject(new Error(response.msg || '保存游戏进度失败'));
                            }
                        } catch (parseErr) {
                            reject(new Error('响应解析失败: ' + parseErr));
                        }
                    } else {
                        reject(new Error(`HTTP错误: ${xhr.status} ${xhr.statusText}`));
                    }
                }
            };

            xhr.onerror = () => reject(new Error('网络请求失败'));
            xhr.ontimeout = () => reject(new Error(`请求超时 (${timeout}ms)`));

            xhr.open('POST', url, true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.setRequestHeader('Content-Type', 'application/json');

            log('GameProgressManager: 发送保存请求到:', url, dto);
            xhr.send(JSON.stringify(dto));
        });
    }

    // ======== 合成奖励管理 ========
    /**
     * 记录合成获得的奖励
     * @param goldReward 金币奖励
     * @param redBagReward 红包奖励
     * @param isMaxLevel 是否为最高等级合成（财神）
     */
    public recordComposeReward(goldReward: number = 0, redBagReward: number = 0, isMaxLevel: boolean = false): void {
        const wealthReward = isMaxLevel ? 1 : 0;
        
        log(`GameProgressManager: 记录合成奖励 - 金币:${goldReward}, 红包:${redBagReward}, 财神:${wealthReward}`);
        
        // 添加到本地数据
        ApiConfig.addComposeReward(goldReward, redBagReward, wealthReward);
        
        // 立即更新UI显示
        this.updateDisplay();
        this.updateAllSceneDisplays();
    }

    /**
     * 重置合成计数器（上报成功后调用）
     */
    private resetComposeCounters(): void {
        const localProgress = ApiConfig.getLocalGameProgress();
        if (localProgress) {
            localProgress.goldNumCompose = 0;
            localProgress.redBagNumCompose = 0;
            localProgress.times = 0;
            ApiConfig.saveLocalProgressToStorage();
            log('GameProgressManager: 合成计数器已重置');
        }
    }

    // ======== UI 显示管理 ========
    /**
     * 更新当前组件的UI显示
     */
    private updateDisplay(): void {
        const progress = ApiConfig.getLocalGameProgress();
        if (!progress) return;

        // 计算总数（合成数据 + 其他数据）
        const totalGold = progress.goldNumCompose + progress.goldNumOther;
        const totalRedBag = progress.redBagNumCompose + progress.redBagNumOther;
        const totalWealth = progress.wealthNum;

        if (this.goldLabel) {
            this.goldLabel.string = this.formatNumber(totalGold);
        }
        if (this.redBagLabel) {
            this.redBagLabel.string = this.formatNumber(totalRedBag);
        }
        if (this.caishenLabel) {
            this.caishenLabel.string = this.formatNumber(totalWealth);
        }
        if (this.drawNumLabel) {
            // 显示剩余抽奖次数
            this.drawNumLabel.string = progress.drawNum.toString();
        }
    }

    /**
     * 更新当前场景中所有 GameProgressManager 的显示
     */
    private updateAllSceneDisplays(): void {
        try {
            const scene = director.getScene();
            if (!scene) return;

            const managers = scene.getComponentsInChildren(GameProgressManager);
            managers.forEach(manager => {
                if (manager !== this) {
                    manager.updateDisplay();
                }
            });
        } catch (error) {
            warn('GameProgressManager: 更新场景显示时发生错误', error);
        }
    }

    /**
     * 静态方法：更新当前场景中所有 GameProgressManager 的显示
     */
    public static updateAllDisplays(): void {
        try {
            const scene = director.getScene();
            if (!scene) return;

            const managers = scene.getComponentsInChildren(GameProgressManager);
            managers.forEach(manager => manager.updateDisplay());
            
            log('GameProgressManager: 已更新所有场景显示');
        } catch (error) {
            warn('GameProgressManager: 更新所有显示时发生错误', error);
        }
    }

    // ======== 公共接口 ========
    /**
     * 手动触发服务器进度加载
     */
    public async reloadServerProgress(): Promise<any> {
        return await this.loadServerProgress();
    }

    /**
     * 手动触发服务器进度上报
     */
    public async manualReportToServer(): Promise<void> {
        return await this.reportToServer();
    }

    /**
     * 获取当前进度数据
     */
    public getCurrentProgress(): LocalGameProgress | null {
        return ApiConfig.getLocalGameProgress();
    }

    /**
     * 检查是否已有进度数据
     */
    public hasProgressData(): boolean {
        return ApiConfig.getLocalGameProgress() !== null;
    }

    // ======== 场景数据管理 ========
    
    /**
     * 更新本地场景数据
     */
    public updateLocalSceneData(sceneData: GameSceneData): void {
        ApiConfig.updateLocalSceneData(sceneData);
        log('GameProgressManager: 本地场景数据已更新');
    }

    /**
     * 判断是否应该使用服务器场景数据
     * 根据合成金币和合成红包中的较大值来决定使用哪个数据源
     */
    public shouldUseServerSceneData(): boolean {
        const localProgress = ApiConfig.getLocalGameProgress();
        if (!localProgress) {
            return false;
        }

        const localComposeGold = localProgress.goldNumCompose;
        const localComposeRedBag = localProgress.redBagNumCompose;
        const serverSceneData = localProgress.serverSceneData;
        
        // 如果没有服务器场景数据，使用本地数据
        if (!serverSceneData) {
            log('GameProgressManager: 没有服务器场景数据，使用本地数据');
            return false;
        }
        
        // 如果没有本地场景数据，使用服务器数据
        if (!localProgress.localSceneData) {
            log('GameProgressManager: 没有本地场景数据，使用服务器数据');
            return true;
        }

        // 获取服务端数据（这里假设服务端数据已经存储在localProgress中）
        // 实际应该从API获取最新的服务端数据，这里简化处理
        const serverComposeGold = this.getServerComposeGold();
        const serverComposeRedBag = this.getServerComposeRedBag();
        
        // 计算本地和服务端的较大值
        const localMaxValue = Math.max(localComposeGold, localComposeRedBag);
        const serverMaxValue = Math.max(serverComposeGold, serverComposeRedBag);
        
        const shouldUseServer = serverMaxValue > localMaxValue;
                               
        log(`GameProgressManager: 数据对比 - 本地合成金币:${localComposeGold}, 本地合成红包:${localComposeRedBag}, 本地最大值:${localMaxValue}`);
        log(`GameProgressManager: 服务端合成金币:${serverComposeGold}, 服务端合成红包:${serverComposeRedBag}, 服务端最大值:${serverMaxValue}`);
        log(`GameProgressManager: ${shouldUseServer ? '使用服务端数据' : '使用本地数据'}`);
        
        return shouldUseServer;
    }

    /**
     * 获取服务端合成金币数量
     */
    private getServerComposeGold(): number {
        // 从API获取最新的服务端数据进行比较
        // 这里需要调用查询API获取服务端的当前合成金币数
        // 暂时返回0，实际应该通过queryGameProgress获取
        return this.serverComposeGoldCache || 0;
    }

    /**
     * 获取服务端合成红包数量
     */
    private getServerComposeRedBag(): number {
        // 从API获取最新的服务端数据进行比较
        // 这里需要调用查询API获取服务端的当前合成红包数
        // 暂时返回0，实际应该通过queryGameProgress获取
        return this.serverComposeRedBagCache || 0;
    }

    // 服务端数据缓存
    private serverComposeGoldCache: number = 0;
    private serverComposeRedBagCache: number = 0;

    /**
     * 获取要恢复的场景数据
     */
    public getSceneDataToRestore(): GameSceneData | null {
        const localProgress = ApiConfig.getLocalGameProgress();
        if (!localProgress) {
            return null;
        }

        if (this.shouldUseServerSceneData()) {
            return localProgress.serverSceneData;
        } else {
            return localProgress.localSceneData;
        }
    }

    /**
     * 构建包含场景数据的progress字符串
     */
    private buildProgressString(): string {
        const localSceneData = ApiConfig.getLocalSceneData();
        const progressData = {
            timestamp: Date.now(),
            version: ApiConfig.getCurrentVersion(),
            sceneData: localSceneData
        };
        
        return JSON.stringify(progressData);
    }

    // ======== 工具方法 ========
    private formatNumber(num: number): string {
        return num.toString();
    }
} 