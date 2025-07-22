/**
 * API配置文件
 * 集中管理所有API相关的配置信息
 */

export interface ApiEnvironment {
    name: string;
    baseUrl: string;
    timeout: number;
    description: string;
}

export interface AppConfig {
    packageName: string;
    currentVersion: number;
    versionName: string;
}

export interface WeChatConfig {
    appId: string;
    scope: string;
}

export interface UserData {
    openid: string | null;
    wechatNickname: string | null;
    wechatAvatar: string | null;
    isRealName: boolean;
    access_token: string;
    expire_in: number;
    client_id: string | null;
}

/**
 * 场景物品数据结构
 */
export interface SceneItemData {
    level: number;           // 物品等级
    position: { x: number, y: number, z: number };  // 物品位置
    prefabIndex: number;     // 预制体索引
}

/**
 * 完整的游戏场景数据
 */
export interface GameSceneData {
    items: SceneItemData[];         // 场景中的物品
    timestamp: number;              // 保存时间戳
    version: string;                // 数据版本
}

/**
 * 本地游戏进度数据结构
 */
export interface LocalGameProgress {
    // 金币相关（区分合成金币和其他金币）
    goldNumCompose: number;    // 合成获得的金币数（以客户端为准）
    goldNumOther: number;      // 其他金币数（以服务端为准）
    
    // 红包相关
    redBagNumCompose: number;  // 合成获得的红包数
    redBagNumOther: number;    // 其他红包数（以服务端为准）
    
    // 其他游戏数据
    wealthNum: number;         // 财神数
    exp: number;               // 经验值
    level: number;             // 等级
    drawNum: number;           // 剩余抽奖次数
    progress: string;          // 游戏进度
    
    // 合成统计
    times: number;             // 合成次数
    
    // 抽奖相关
    nextLotteryLayer: number;  // 下次抽奖次数下发层数
    
    // 场景数据
    localSceneData: GameSceneData | null;   // 本地场景数据
    serverSceneData: GameSceneData | null;  // 服务器场景数据
    
    // 时间戳
    lastServerSyncTime: number;  // 上次服务器同步时间
    lastLocalSaveTime: number;   // 上次本地保存时间
}

/**
 * 抽奖物品数据结构
 */
export interface LotteryItem {
    id: number;
    isWin: boolean;
    rewardType: string;
    rewardNum: number;
}

/**
 * 基础请求参数
 * 输入内容：所有API请求的基础字段
 */
export interface BaseReq {
    androidId: string;      // 安卓设备ID
    deviceId: string;       // 设备唯一标识
    requestId: string;      // 请求唯一标识
    timeStamp: number;      // 请求时间戳
    packageName?: string;   // 应用包名
}

/**
 * Ajax请求结果基础结构
 * 返回内容：通用的响应状态标识
 */
export interface AjaxResult {
    error: boolean;   // 是否有错误
    success: boolean; // 是否成功
    warn: boolean;    // 是否有警告
    empty: boolean;   // 是否为空结果
}

/**
 * 微信登录请求参数
 * 输入内容：微信授权码和设备信息
 */
export interface WeChatLoginRequest extends BaseReq {
    code: string;           // 微信授权码
    encryptedData?: string; // 加密数据
    iv?: string;           // 初始向量
}

/**
 * 微信登录响应数据
 * 返回内容：用户信息和访问令牌
 */
export interface WeChatLoginResponse {
    access_token: string;   // 访问令牌
    expire_in: number;      // 过期时间
    openid: string;         // 用户openid
    nickname?: string;      // 用户昵称
    avatar?: string;        // 用户头像
}

/**
 * 游戏进度查询请求参数
 * 输入内容：用户身份验证信息
 */
export interface QueryGameProgressRequest {
    // 通过Authorization header传递token，无需额外参数
}

/**
 * 游戏进度查询响应数据
 * 返回内容：完整的游戏进度信息
 */
export interface QueryGameProgressResponse {
    goldNum: number;           // 总金币数
    goldNumCompose: number;    // 合成金币数
    redBagNum: number;         // 总红包数
    redBagNumCompose: number;  // 合成红包数
    wealthNum: number;         // 财神数
    exp: number;               // 经验值
    level: number;             // 等级
    drawNum: number;           // 抽奖次数
    progress: string;          // 游戏进度JSON字符串
    nextLotteryLayer: number;  // 下次抽奖层数
}

/**
 * 游戏进度保存请求参数
 * 输入内容：完整的游戏进度数据
 */
export interface SaveGameProgressRequest extends BaseReq {
    goldNumCompose: number;    // 合成金币数
    redBagNumCompose: number;  // 合成红包数
    wealthNum: number;         // 财神数
    times: number;             // 合成次数
    progress: string;          // 游戏进度JSON字符串
}

/**
 * 游戏进度保存响应数据
 * 返回内容：保存操作结果
 */
export interface SaveGameProgressResponse {
    success: boolean;          // 是否保存成功
    message?: string;          // 响应消息
}

/**
 * 抽奖数据查询请求参数
 * 输入内容：用户身份验证信息
 */
export interface LotteryDataRequest {
    // 通过Authorization header传递token，无需额外参数
}

/**
 * 抽奖数据查询响应数据
 * 返回内容：抽奖详情和剩余次数
 */
export interface LotteryDataResponse {
    detail: LotteryItem[];     // 抽奖物品详情数组
    count: number;             // 剩余抽奖次数
    resetTime?: number;        // 重置时间戳
}

/**
 * 抽奖请求参数
 * 输入内容：设备信息和基础请求参数
 */
export interface PrizeDrawRequest extends BaseReq {
    // 继承BaseReq的所有字段
}

/**
 * 抽奖响应数据
 * 返回内容：中奖结果信息
 */
export interface PrizeDrawResponse {
    prizeId: number;           // 中奖物品ID
    rewardType: string;        // 奖励类型
    rewardNum: number;         // 奖励数量
    success: boolean;          // 是否抽奖成功
    remainingDraws: number;    // 剩余抽奖次数
}

/**
 * 获取下次抽奖层数请求参数
 * 输入内容：无需额外参数，通过Authorization header传递token
 */
export interface GetNextLotteryLayerRequest {
    // 无需额外参数，使用BaseReq的基础字段
}

/**
 * 获取下次抽奖层数响应数据结构
 * 返回内容：包含下次抽奖层数信息
 */
export interface GetNextLotteryLayerResponse {
    nextLayer: number;  // 下次抽奖层数
}

/**
 * 增加抽奖次数请求参数
 * 输入内容：设备信息和基础请求参数
 */
export interface AddLotteryRequest extends BaseReq {
    // 继承BaseReq的所有字段：androidId, deviceId, requestId, timeStamp, packageName
}

/**
 * 增加抽奖次数响应数据结构
 * 返回内容：更新后的抽奖次数和操作结果
 */
export interface AddLotteryResponse {
    drawNum: number;    // 更新后的抽奖次数
    success: boolean;   // 是否成功
    resetTime?: number; // 重置时间戳（可选）
}

export interface OpTgcfIllustration {
    id: number;
    imgUrl: string;
    name: string;
    code: string;
    exp: number;
    showOrder: number;
    createTime: string;
    updateTime: string;
}

export interface QueryUserAccountVo {
    nickname: string;
    avatar: string;
    expPercent: string;
    idNo: number;
    level: number;
    illustrationList: OpTgcfIllustration[];
}

/**
 * API配置类
 */
export class ApiConfig {
    
    // API环境配置
    public static readonly ENVIRONMENTS: Record<string, ApiEnvironment> = {
        // 生产环境
        production: {
            name: 'production',
            baseUrl: 'http://101.133.145.244:7071',
            timeout: 10000,
            description: '生产环境'
        },
        
        // 测试环境
        development: {
            name: 'development', 
            baseUrl: 'http://101.133.145.244:7071',
            timeout: 15000,
            description: '开发测试环境'
        },
        
        // 本地环境
        local: {
            name: 'local',
            baseUrl: 'http://192.168.1.100:7071',
            timeout: 20000,
            description: '本地开发环境'
        }
    };

    // 当前使用的环境
    public static readonly CURRENT_ENV: string = 'production';

    // 开发模式配置
    public static readonly DEV_MODE = {
        ENABLE_MOCK_LOGIN: false,  // 启用模拟登录（网络失败时）
        ENABLE_DEBUG_LOGS: true,  // 启用详细调试日志
        SKIP_REAL_API: false     // 完全跳过真实API调用（仅用于UI测试）
    };

    // 应用配置
    public static readonly APP_CONFIG: AppConfig = {
        packageName: 'com.schanyin.tgcf',
        currentVersion: 100,
        versionName: '1.0.0'
    };

    // 微信配置
    public static readonly WECHAT_CONFIG: WeChatConfig = {
        appId: 'wx7870c770371205e4',
        scope: 'snsapi_userinfo'
    };

    // === 新增：当前登录用户数据 ===
    public static USER_DATA: UserData | null = null;

    /**
     * 保存（覆盖）当前用户数据
     */
    public static setUserData(data: UserData): void {
        this.USER_DATA = data;
    }

    /**
     * 获取当前用户数据
     */
    public static getUserData(): UserData | null {
        return this.USER_DATA;
    }

    // === 修改：游戏进度数据管理 ===
    public static LOCAL_GAME_PROGRESS: LocalGameProgress | null = null;

    /**
     * 设置本地游戏进度数据
     */
    public static setLocalGameProgress(data: LocalGameProgress): void {
        this.LOCAL_GAME_PROGRESS = data;
        this.saveLocalProgressToStorage();
    }

    /**
     * 获取本地游戏进度数据
     */
    public static getLocalGameProgress(): LocalGameProgress | null {
        return this.LOCAL_GAME_PROGRESS;
    }

    /**
     * 初始化默认游戏进度
     */
    public static initializeDefaultProgress(): LocalGameProgress {
        const defaultProgress: LocalGameProgress = {
            goldNumCompose: 0,
            goldNumOther: 0,
            redBagNumCompose: 0,
            redBagNumOther: 0,
            wealthNum: 0,
            exp: 0,
            level: 1,
            drawNum: 0,
            progress: '',
            times: 0,
            nextLotteryLayer: 1,
            localSceneData: null,
            serverSceneData: null,
            lastServerSyncTime: 0,
            lastLocalSaveTime: Date.now()
        };
        this.setLocalGameProgress(defaultProgress);
        return defaultProgress;
    }

    /**
     * 从本地存储加载游戏进度
     */
    public static loadLocalProgressFromStorage(): LocalGameProgress | null {
        try {
            const stored = localStorage.getItem('game_progress');
            if (stored) {
                const progress = JSON.parse(stored) as LocalGameProgress;
                this.LOCAL_GAME_PROGRESS = progress;
                return progress;
            }
        } catch (error) {
            console.warn('加载本地进度失败:', error);
        }
        return null;
    }

    /**
     * 保存游戏进度到本地存储
     */
    public static saveLocalProgressToStorage(): void {
        try {
            if (this.LOCAL_GAME_PROGRESS) {
                this.LOCAL_GAME_PROGRESS.lastLocalSaveTime = Date.now();
                localStorage.setItem('game_progress', JSON.stringify(this.LOCAL_GAME_PROGRESS));
            }
        } catch (error) {
            console.warn('保存本地进度失败:', error);
        }
    }

    /**
     * 更新服务器数据（从服务器响应更新）
     */
    public static updateServerProgress(serverData: any): void {
        if (!this.LOCAL_GAME_PROGRESS) {
            this.initializeDefaultProgress();
        }
        
        if (this.LOCAL_GAME_PROGRESS && serverData) {
            // 计算其他金币数量：总金币 - 合成金币
            const serverTotalGold = serverData.goldNum || 0;
            const serverComposeGold = serverData.goldNumCompose || 0;
            this.LOCAL_GAME_PROGRESS.goldNumOther = Math.max(0, serverTotalGold - serverComposeGold);
            
            // 合成金币取本地和服务端的高值
            this.LOCAL_GAME_PROGRESS.goldNumCompose = Math.max(
                this.LOCAL_GAME_PROGRESS.goldNumCompose, 
                serverComposeGold
            );
            
            // 计算其他红包数量：总红包 - 合成红包
            const serverTotalRedBag = serverData.redBagNum || 0;
            const serverComposeRedBag = serverData.redBagNumCompose || 0;
            this.LOCAL_GAME_PROGRESS.redBagNumOther = Math.max(0, serverTotalRedBag - serverComposeRedBag);
            
            // 合成红包取本地和服务端的高值
            this.LOCAL_GAME_PROGRESS.redBagNumCompose = Math.max(
                this.LOCAL_GAME_PROGRESS.redBagNumCompose, 
                serverComposeRedBag
            );
            
            // 更新其他数据
            this.LOCAL_GAME_PROGRESS.wealthNum = Math.max(this.LOCAL_GAME_PROGRESS.wealthNum, serverData.wealthNum || 0);
            this.LOCAL_GAME_PROGRESS.exp = serverData.exp || 0;
            this.LOCAL_GAME_PROGRESS.level = serverData.level || 1;
            this.LOCAL_GAME_PROGRESS.drawNum = serverData.drawNum || 0;
            this.LOCAL_GAME_PROGRESS.progress = serverData.progress || '';
            this.LOCAL_GAME_PROGRESS.nextLotteryLayer = serverData.nextLotteryLayer || 1;
            
            // 解析服务器场景数据
            if (serverData.progress) {
                try {
                    const progressData = JSON.parse(serverData.progress);
                    if (progressData.sceneData) {
                        this.LOCAL_GAME_PROGRESS.serverSceneData = progressData.sceneData;
                        console.log('ApiConfig: 已解析服务器场景数据', progressData.sceneData);
                    }
                } catch (error) {
                    console.warn('ApiConfig: 解析服务器progress数据失败:', error);
                }
            }
            
            this.LOCAL_GAME_PROGRESS.lastServerSyncTime = Date.now();
            
            this.saveLocalProgressToStorage();
        }
    }

    /**
     * 增加合成奖励
     */
    public static addComposeReward(goldReward: number, redBagReward: number, wealthReward: number): void {
        if (!this.LOCAL_GAME_PROGRESS) {
            this.initializeDefaultProgress();
        }
        
        if (this.LOCAL_GAME_PROGRESS) {
            this.LOCAL_GAME_PROGRESS.goldNumCompose += goldReward;
            this.LOCAL_GAME_PROGRESS.redBagNumCompose += redBagReward;
            this.LOCAL_GAME_PROGRESS.wealthNum += wealthReward;
            this.LOCAL_GAME_PROGRESS.times += 1;
            
            // 不立即保存到本地存储，由定时器统一保存
        }
    }

    /**
     * 更新本地场景数据
     */
    public static updateLocalSceneData(sceneData: GameSceneData): void {
        if (!this.LOCAL_GAME_PROGRESS) {
            this.initializeDefaultProgress();
        }
        
        if (this.LOCAL_GAME_PROGRESS) {
            this.LOCAL_GAME_PROGRESS.localSceneData = sceneData;
            // 立即保存本地数据，因为场景变化频繁
            this.saveLocalProgressToStorage();
        }
    }

    /**
     * 更新服务器场景数据
     */
    public static updateServerSceneData(sceneData: GameSceneData): void {
        if (!this.LOCAL_GAME_PROGRESS) {
            this.initializeDefaultProgress();
        }
        
        if (this.LOCAL_GAME_PROGRESS) {
            this.LOCAL_GAME_PROGRESS.serverSceneData = sceneData;
            this.saveLocalProgressToStorage();
        }
    }

    /**
     * 获取本地场景数据
     */
    public static getLocalSceneData(): GameSceneData | null {
        return this.LOCAL_GAME_PROGRESS?.localSceneData || null;
    }

    /**
     * 获取服务器场景数据
     */
    public static getServerSceneData(): GameSceneData | null {
        return this.LOCAL_GAME_PROGRESS?.serverSceneData || null;
    }

    /**
     * 判断是否应该使用服务器场景数据
     */
    public static shouldUseServerSceneData(): boolean {
        if (!this.LOCAL_GAME_PROGRESS) {
            return false;
        }

        const localProgress = this.LOCAL_GAME_PROGRESS;
        const serverData = this.LOCAL_GAME_PROGRESS.serverSceneData;
        
        // 如果没有服务器数据，使用本地数据
        if (!serverData) {
            return false;
        }
        
        // 如果没有本地数据，使用服务器数据
        if (!localProgress.localSceneData) {
            return true;
        }

        // 比较合成金币和红包数量，如果服务端数据更多，使用服务端数据
        // 这个逻辑在GameProgressManager中实现
        return false; // 默认使用本地数据
    }

    // 移除旧的游戏进度方法
    // public static GAME_PROGRESS: any | null = null;
    // public static setGameProgress(data: any): void
    // public static getGameProgress(): any | null

    // 发布渠道配置
    public static readonly RELEASE_CHANNEL = {
        DEFAULT: 'juliang',  // 默认发布渠道
        AVAILABLE: ['juliang', 'huawei', 'xiaomi', 'oppo', 'vivo'] // 可用的发布渠道
    };

    // API端点配置
    public static readonly ENDPOINTS = {
        // 版本相关
        GET_VERSION: '/home/getVersion',
        
        // 用户相关
        WECHAT_LOGIN: '/base/login',
        USER_INFO: '/user/info',
        
        // 设备相关
        DEVICE_REPORT: '/device/report',
        
        // 风控相关
        RISK_DETECTION: '/safe/riskDetection',
        
        // 账户相关
        GET_ACCOUNT_INFO: '/home/getAccountInfo',
        QUERY_USER_ACCOUNT: '/account/queryUserAccount',
        
        // 游戏相关
        QUERY_GAME_PROGRESS: '/game/queryGameProgress',
        SAVE_GAME_PROGRESS: '/game/saveGameProgress',
        LOTTERY: '/game/lottery',
        PRIZE: '/game/prize',
        GET_NEXT_LOTTERY_LAYER: '/game/getNextLotteryLayer',
        ADD_LOTTERY: '/game/addLottery',
        
        // 其他端点...
    };

    // === 新增：游戏进度数据 ===
    // public static GAME_PROGRESS: any | null = null;

    /**
     * 保存（覆盖）游戏进度数据
     */
    // public static setGameProgress(data: any): void {
    //     this.GAME_PROGRESS = data;
    // }

    /**
     * 获取当前游戏进度数据
     */
    // public static getGameProgress(): any | null {
    //     return this.GAME_PROGRESS;
    // }

    // HTTP状态码
    public static readonly HTTP_STATUS = {
        SUCCESS: 200,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        SERVER_ERROR: 500
    };

    // 业务状态码
    public static readonly BUSINESS_CODE = {
        SUCCESS: 200,
        FAIL: 500,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403
    };

    /**
     * 获取当前环境配置
     */
    public static getCurrentEnvironment(): ApiEnvironment {
        return this.ENVIRONMENTS[this.CURRENT_ENV] || this.ENVIRONMENTS.production;
    }

    /**
     * 获取API基础URL
     */
    public static getBaseUrl(): string {
        return this.getCurrentEnvironment().baseUrl;
    }

    /**
     * 获取超时时间
     */
    public static getTimeout(): number {
        return this.getCurrentEnvironment().timeout;
    }

    /**
     * 获取完整的API地址
     * @param endpoint 端点路径
     */
    public static getFullUrl(endpoint: string): string {
        const baseUrl = this.getBaseUrl();
        // 确保不会有双斜杠
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
        return baseUrl + cleanEndpoint;
    }

    /**
     * 获取包名
     */
    public static getPackageName(): string {
        return this.APP_CONFIG.packageName;
    }

    /**
     * 获取当前版本号
     */
    public static getCurrentVersion(): number {
        return this.APP_CONFIG.currentVersion;
    }

    /**
     * 获取版本名称
     */
    public static getVersionName(): string {
        return this.APP_CONFIG.versionName;
    }

    /**
     * 获取微信AppID
     */
    public static getWeChatAppId(): string {
        return this.WECHAT_CONFIG.appId;
    }

    /**
     * 获取微信授权范围
     */
    public static getWeChatScope(): string {
        return this.WECHAT_CONFIG.scope;
    }

    /**
     * 获取发布渠道
     */
    public static getReleaseChannel(): string {
        return this.RELEASE_CHANNEL.DEFAULT;
    }

    /**
     * 检查响应是否成功
     * @param code 响应状态码
     */
    public static isResponseSuccess(code: number): boolean {
        return code === this.BUSINESS_CODE.SUCCESS;
    }

    /**
     * 打印当前配置信息（用于调试）
     */
    public static printCurrentConfig(): void {
        const env = this.getCurrentEnvironment();
        console.log('=== API配置信息 ===');
        console.log(`当前环境: ${env.name} (${env.description})`);
        console.log(`API地址: ${env.baseUrl}`);
        console.log(`超时时间: ${env.timeout}ms`);
        console.log(`应用包名: ${this.getPackageName()}`);
        console.log(`发布渠道: ${this.getReleaseChannel()}`);
        console.log(`应用版本: ${this.getVersionName()} (${this.getCurrentVersion()})`);
        console.log(`微信AppID: ${this.getWeChatAppId()}`);
        console.log('==================');
    }

    /**
     * 切换环境（用于开发调试）
     * @param envName 环境名称
     */
    public static switchEnvironment(envName: string): boolean {
        if (this.ENVIRONMENTS[envName]) {
            // 注意：这里不能直接修改CURRENT_ENV，因为它是readonly
            // 实际使用时可以通过其他方式来切换环境
            console.log(`准备切换到环境: ${envName}`);
            return true;
        } else {
            console.warn(`环境 ${envName} 不存在`);
            return false;
        }
    }

    /**
     * 获取所有可用环境
     */
    public static getAvailableEnvironments(): string[] {
        return Object.keys(this.ENVIRONMENTS);
    }

    /**
     * 获取默认设备信息
     * 提供基础的设备信息，避免依赖DeviceInfoCollector组件
     */
    public static getDefaultDeviceInfo(): { androidId: string; deviceId: string } {
        return {
            androidId: this.generateMockAndroidId(),
            deviceId: '13974751124' // 使用固定的设备ID，与其他地方保持一致
        };
    }

    /**
     * 生成模拟的Android ID
     * 用于在无法获取真实设备信息时提供默认值
     */
    private static generateMockAndroidId(): string {
        // 生成16位随机字符串作为模拟Android ID
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}