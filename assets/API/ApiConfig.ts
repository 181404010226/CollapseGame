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
    
    // 时间戳
    lastServerSyncTime: number;  // 上次服务器同步时间
    lastLocalSaveTime: number;   // 上次本地保存时间
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
            this.LOCAL_GAME_PROGRESS.wealthNum = serverData.wealthNum || 0;
            this.LOCAL_GAME_PROGRESS.exp = serverData.exp || 0;
            this.LOCAL_GAME_PROGRESS.level = serverData.level || 1;
            this.LOCAL_GAME_PROGRESS.drawNum = serverData.drawNum || 0;
            this.LOCAL_GAME_PROGRESS.progress = serverData.progress || '';
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
        
        // 游戏相关
        QUERY_GAME_PROGRESS: '/game/queryGameProgress',
        SAVE_GAME_PROGRESS: '/game/saveGameProgress',
        
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
} 