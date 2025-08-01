import { _decorator, Component, Node, native } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 埋点事件配置接口
 */
interface TrackEventConfig {
    eventId: string;
    eventName: string;
    description: string;
    defaultAttributes?: Record<string, string>;
}

/**
 * 埋点事件类型枚举
 */
export enum TrackEventType {
    // 登录相关埋点 (1-10)
    LOGIN_PAGE_EXPOSURE = 'login_page_exposure',
    LOGIN_ACCESS_MODE_CLICK = 'login_access_mode_click', 
    LOGIN_AUTHORISATION_GRANT_CLICK = 'login_authorisation_grant_click',
    LOGIN_AGREEMENT_CLICK = 'login_agreement_click',
    LOGIN_SUCCESS = 'login_success',
    LOGIN_FAILED = 'login_failed',
    LOGOUT = 'logout',
    
    // 首页相关埋点 (11-20)
    HOME_PAGE_EXPOSURE = 'home_page_exposure',
    HOME_GAME_START_CLICK = 'home_game_start_click',
    HOME_TASK_CENTER_CLICK = 'home_task_center_click',
    HOME_MINE_CLICK = 'home_mine_click',
    HOME_WITHDRAW_CLICK = 'home_withdraw_click',
    HOME_SIGN_IN_CLICK = 'home_sign_in_click',
    HOME_AD_CLICK = 'home_ad_click',
    
    // 游戏相关埋点 (21-30)
    GAME_START = 'game_start',
    GAME_END = 'game_end',
    GAME_PAUSE = 'game_pause',
    GAME_RESUME = 'game_resume',
    GAME_LEVEL_UP = 'game_level_up',
    GAME_ITEM_USE = 'game_item_use',
    GAME_REWARD_GET = 'game_reward_get',
    
    // 任务中心相关埋点 (31-40)
    TASK_CENTER_EXPOSURE = 'task_center_exposure',
    TASK_CLAIM_CLICK = 'task_claim_click',
    TASK_COMPLETE = 'task_complete',
    DAILY_TASK_VIEW = 'daily_task_view',
    ACHIEVEMENT_VIEW = 'achievement_view',
    
    // 提现相关埋点 (41-50)
    WITHDRAW_PAGE_EXPOSURE = 'withdraw_page_exposure',
    WITHDRAW_AMOUNT_INPUT = 'withdraw_amount_input',
    WITHDRAW_METHOD_SELECT = 'withdraw_method_select',
    WITHDRAW_SUBMIT_CLICK = 'withdraw_submit_click',
    WITHDRAW_SUCCESS = 'withdraw_success',
    WITHDRAW_FAILED = 'withdraw_failed',
    
    // 个人中心相关埋点 (51-60)
    MINE_PAGE_EXPOSURE = 'mine_page_exposure',
    PROFILE_EDIT_CLICK = 'profile_edit_click',
    SETTINGS_CLICK = 'settings_click',
    HELP_CENTER_CLICK = 'help_center_click',
    ABOUT_US_CLICK = 'about_us_click',
    
    // 广告相关埋点 (61-70)
    AD_REQUEST = 'ad_request',
    AD_SHOW = 'ad_show',
    AD_CLICK = 'ad_click',
    AD_CLOSE = 'ad_close',
    AD_REWARD_GET = 'ad_reward_get',
    AD_FAILED = 'ad_failed',
    
    // 其他功能埋点 (71-80)
    SHARE_CLICK = 'share_click',
    FEEDBACK_SUBMIT = 'feedback_submit',
    NOTIFICATION_CLICK = 'notification_click',
    SEARCH_CLICK = 'search_click',
    FILTER_CLICK = 'filter_click',
    SORT_CLICK = 'sort_click',
    REFRESH_CLICK = 'refresh_click',
    BACK_CLICK = 'back_click',
    CLOSE_CLICK = 'close_click',
    CONFIRM_CLICK = 'confirm_click'
}

/**
 * 友盟SDK管理器
 * 提供友盟统计分析功能的TypeScript接口
 */
@ccclass('UmengSDK')
export class UmengSDK {
    private static instance: UmengSDK;
    private isInitialized: boolean = false;
    
    // 友盟SDK配置
    private static readonly UMENG_APPKEY = '6840ffc079267e02107a4583';
    private static readonly UMENG_CHANNEL = 'default';
    
    // 埋点事件配置映射
    private static readonly TRACK_EVENT_CONFIGS: Record<TrackEventType, TrackEventConfig> = {
        // 登录相关埋点
        [TrackEventType.LOGIN_PAGE_EXPOSURE]: {
            eventId: 'LoginPage_Exposure',
            eventName: '登录页_曝光',
            description: '用户进入登录页面时触发',
            defaultAttributes: { 
                page_name: 'page_name',
                timestamp: 'timestamp'
            }
        },
        [TrackEventType.LOGIN_ACCESS_MODE_CLICK]: {
            eventId: 'LoginPage_AccessMode_Click',
            eventName: '登录页_访问模式_点击',
            description: '用户点击登录方式时触发',
            defaultAttributes: {
                access_mode: 'access_mode',
                mode_text: 'mode_text',
                timestamp: 'timestamp'
            }
        },
        [TrackEventType.LOGIN_AUTHORISATION_GRANT_CLICK]: {
            eventId: 'LoginPage_AuthorisationGrant_Click',
            eventName: '登录页_授权_点击',
            description: '用户点击授权勾选框时触发',
            defaultAttributes: {
                action: 'action',
                is_checked: 'is_checked',
                timestamp: 'timestamp'
            }
        },
        [TrackEventType.LOGIN_AGREEMENT_CLICK]: {
            eventId: 'LoginPage_Agreement_Click',
            eventName: '登录页_协议_点击',
            description: '用户点击协议链接时触发',
            defaultAttributes: {
                agreement_text: 'agreement_text',
                agreement_type: 'agreement_type',
                timestamp: 'timestamp'
            }
        },
        [TrackEventType.LOGIN_SUCCESS]: {
            eventId: 'Login_Success',
            eventName: '登录_成功',
            description: '用户登录成功时触发'
        },
        [TrackEventType.LOGIN_FAILED]: {
            eventId: 'Login_Failed',
            eventName: '登录_失败',
            description: '用户登录失败时触发'
        },
        [TrackEventType.LOGOUT]: {
            eventId: 'Logout',
            eventName: '登出',
            description: '用户登出时触发'
        },
        
        // 首页相关埋点
        [TrackEventType.HOME_PAGE_EXPOSURE]: {
            eventId: 'HomePage_Exposure',
            eventName: '首页_曝光',
            description: '用户进入首页时触发',
            defaultAttributes: { page_name: '首页' }
        },
        [TrackEventType.HOME_GAME_START_CLICK]: {
            eventId: 'HomePage_GameStart_Click',
            eventName: '首页_开始游戏_点击',
            description: '用户点击开始游戏按钮时触发'
        },
        [TrackEventType.HOME_TASK_CENTER_CLICK]: {
            eventId: 'HomePage_TaskCenter_Click',
            eventName: '首页_任务中心_点击',
            description: '用户点击任务中心按钮时触发'
        },
        [TrackEventType.HOME_MINE_CLICK]: {
            eventId: 'HomePage_Mine_Click',
            eventName: '首页_个人中心_点击',
            description: '用户点击个人中心按钮时触发'
        },
        [TrackEventType.HOME_WITHDRAW_CLICK]: {
            eventId: 'HomePage_Withdraw_Click',
            eventName: '首页_提现_点击',
            description: '用户点击提现按钮时触发'
        },
        [TrackEventType.HOME_SIGN_IN_CLICK]: {
            eventId: 'HomePage_SignIn_Click',
            eventName: '首页_签到_点击',
            description: '用户点击签到按钮时触发'
        },
        [TrackEventType.HOME_AD_CLICK]: {
            eventId: 'HomePage_Ad_Click',
            eventName: '首页_广告_点击',
            description: '用户点击首页广告时触发'
        },
        
        // 游戏相关埋点
        [TrackEventType.GAME_START]: {
            eventId: 'Game_Start',
            eventName: '游戏_开始',
            description: '游戏开始时触发'
        },
        [TrackEventType.GAME_END]: {
            eventId: 'Game_End',
            eventName: '游戏_结束',
            description: '游戏结束时触发'
        },
        [TrackEventType.GAME_PAUSE]: {
            eventId: 'Game_Pause',
            eventName: '游戏_暂停',
            description: '游戏暂停时触发'
        },
        [TrackEventType.GAME_RESUME]: {
            eventId: 'Game_Resume',
            eventName: '游戏_恢复',
            description: '游戏恢复时触发'
        },
        [TrackEventType.GAME_LEVEL_UP]: {
            eventId: 'Game_LevelUp',
            eventName: '游戏_升级',
            description: '游戏升级时触发'
        },
        [TrackEventType.GAME_ITEM_USE]: {
            eventId: 'Game_ItemUse',
            eventName: '游戏_道具使用',
            description: '使用游戏道具时触发'
        },
        [TrackEventType.GAME_REWARD_GET]: {
            eventId: 'Game_RewardGet',
            eventName: '游戏_奖励获得',
            description: '获得游戏奖励时触发'
        },
        
        // 任务中心相关埋点
        [TrackEventType.TASK_CENTER_EXPOSURE]: {
            eventId: 'TaskCenter_Exposure',
            eventName: '任务中心_曝光',
            description: '用户进入任务中心时触发',
            defaultAttributes: { page_name: '任务中心' }
        },
        [TrackEventType.TASK_CLAIM_CLICK]: {
            eventId: 'TaskCenter_Claim_Click',
            eventName: '任务中心_领取_点击',
            description: '用户点击任务领取按钮时触发'
        },
        [TrackEventType.TASK_COMPLETE]: {
            eventId: 'Task_Complete',
            eventName: '任务_完成',
            description: '任务完成时触发'
        },
        [TrackEventType.DAILY_TASK_VIEW]: {
            eventId: 'DailyTask_View',
            eventName: '每日任务_查看',
            description: '查看每日任务时触发'
        },
        [TrackEventType.ACHIEVEMENT_VIEW]: {
            eventId: 'Achievement_View',
            eventName: '成就_查看',
            description: '查看成就时触发'
        },
        
        // 提现相关埋点
        [TrackEventType.WITHDRAW_PAGE_EXPOSURE]: {
            eventId: 'WithdrawPage_Exposure',
            eventName: '提现页_曝光',
            description: '用户进入提现页面时触发',
            defaultAttributes: { page_name: '提现页' }
        },
        [TrackEventType.WITHDRAW_AMOUNT_INPUT]: {
            eventId: 'Withdraw_AmountInput',
            eventName: '提现_金额输入',
            description: '用户输入提现金额时触发'
        },
        [TrackEventType.WITHDRAW_METHOD_SELECT]: {
            eventId: 'Withdraw_MethodSelect',
            eventName: '提现_方式选择',
            description: '用户选择提现方式时触发'
        },
        [TrackEventType.WITHDRAW_SUBMIT_CLICK]: {
            eventId: 'Withdraw_Submit_Click',
            eventName: '提现_提交_点击',
            description: '用户点击提现提交按钮时触发'
        },
        [TrackEventType.WITHDRAW_SUCCESS]: {
            eventId: 'Withdraw_Success',
            eventName: '提现_成功',
            description: '提现成功时触发'
        },
        [TrackEventType.WITHDRAW_FAILED]: {
            eventId: 'Withdraw_Failed',
            eventName: '提现_失败',
            description: '提现失败时触发'
        },
        
        // 个人中心相关埋点
        [TrackEventType.MINE_PAGE_EXPOSURE]: {
            eventId: 'MinePage_Exposure',
            eventName: '个人中心_曝光',
            description: '用户进入个人中心时触发',
            defaultAttributes: { page_name: '个人中心' }
        },
        [TrackEventType.PROFILE_EDIT_CLICK]: {
            eventId: 'Profile_Edit_Click',
            eventName: '个人资料_编辑_点击',
            description: '用户点击编辑个人资料时触发'
        },
        [TrackEventType.SETTINGS_CLICK]: {
            eventId: 'Settings_Click',
            eventName: '设置_点击',
            description: '用户点击设置按钮时触发'
        },
        [TrackEventType.HELP_CENTER_CLICK]: {
            eventId: 'HelpCenter_Click',
            eventName: '帮助中心_点击',
            description: '用户点击帮助中心时触发'
        },
        [TrackEventType.ABOUT_US_CLICK]: {
            eventId: 'AboutUs_Click',
            eventName: '关于我们_点击',
            description: '用户点击关于我们时触发'
        },
        
        // 广告相关埋点
        [TrackEventType.AD_REQUEST]: {
            eventId: 'Ad_Request',
            eventName: '广告_请求',
            description: '请求广告时触发'
        },
        [TrackEventType.AD_SHOW]: {
            eventId: 'Ad_Show',
            eventName: '广告_展示',
            description: '广告展示时触发'
        },
        [TrackEventType.AD_CLICK]: {
            eventId: 'Ad_Click',
            eventName: '广告_点击',
            description: '用户点击广告时触发'
        },
        [TrackEventType.AD_CLOSE]: {
            eventId: 'Ad_Close',
            eventName: '广告_关闭',
            description: '用户关闭广告时触发'
        },
        [TrackEventType.AD_REWARD_GET]: {
            eventId: 'Ad_RewardGet',
            eventName: '广告_奖励获得',
            description: '观看广告获得奖励时触发'
        },
        [TrackEventType.AD_FAILED]: {
            eventId: 'Ad_Failed',
            eventName: '广告_失败',
            description: '广告加载或播放失败时触发'
        },
        
        // 其他功能埋点
        [TrackEventType.SHARE_CLICK]: {
            eventId: 'Share_Click',
            eventName: '分享_点击',
            description: '用户点击分享按钮时触发'
        },
        [TrackEventType.FEEDBACK_SUBMIT]: {
            eventId: 'Feedback_Submit',
            eventName: '反馈_提交',
            description: '用户提交反馈时触发'
        },
        [TrackEventType.NOTIFICATION_CLICK]: {
            eventId: 'Notification_Click',
            eventName: '通知_点击',
            description: '用户点击通知时触发'
        },
        [TrackEventType.SEARCH_CLICK]: {
            eventId: 'Search_Click',
            eventName: '搜索_点击',
            description: '用户点击搜索时触发'
        },
        [TrackEventType.FILTER_CLICK]: {
            eventId: 'Filter_Click',
            eventName: '筛选_点击',
            description: '用户点击筛选时触发'
        },
        [TrackEventType.SORT_CLICK]: {
            eventId: 'Sort_Click',
            eventName: '排序_点击',
            description: '用户点击排序时触发'
        },
        [TrackEventType.REFRESH_CLICK]: {
            eventId: 'Refresh_Click',
            eventName: '刷新_点击',
            description: '用户点击刷新时触发'
        },
        [TrackEventType.BACK_CLICK]: {
            eventId: 'Back_Click',
            eventName: '返回_点击',
            description: '用户点击返回按钮时触发'
        },
        [TrackEventType.CLOSE_CLICK]: {
            eventId: 'Close_Click',
            eventName: '关闭_点击',
            description: '用户点击关闭按钮时触发'
        },
        [TrackEventType.CONFIRM_CLICK]: {
            eventId: 'Confirm_Click',
            eventName: '确认_点击',
            description: '用户点击确认按钮时触发'
        }
    };
    
    public static getInstance(): UmengSDK {
        if (!UmengSDK.instance) {
            UmengSDK.instance = new UmengSDK();
            // Android端友盟SDK已在Application中初始化，这里自动标记为已初始化
            UmengSDK.instance.isInitialized = true;
            console.log('[UmengSDK] 友盟SDK实例创建完成，Android端已在Application中初始化');
        }
        return UmengSDK.instance;
    }
    
    /**
     * 初始化友盟SDK
     * 注意：Android端已在Application中自动初始化
     */
    public init(): void {
        console.log(`[UmengSDK] 友盟SDK初始化，AppKey: ${UmengSDK.UMENG_APPKEY}`);
        this.isInitialized = true;
        
        // Android端已在App.java中初始化，这里只是标记状态
        if (native.reflection && native.reflection.callStaticMethod) {
            console.log('[UmengSDK] Android端友盟SDK已在Application中初始化');
        }
    }
    
    /**
     * 获取友盟AppKey
     */
    public static getAppKey(): string {
        return UmengSDK.UMENG_APPKEY;
    }
    
    /**
     * 获取友盟渠道
     */
    public static getChannel(): string {
        return UmengSDK.UMENG_CHANNEL;
    }
    
    /**
     * 页面开始统计
     * @param pageName 页面名称
     */
    public onPageStart(pageName: string): void {
        if (!this.isInitialized) {
            console.warn('[UmengSDK] SDK未初始化，请先调用init()');
            return;
        }
        
        console.log(`[UmengSDK] 页面开始: ${pageName}`);
        
        if (native.reflection && native.reflection.callStaticMethod) {
            try {
                native.reflection.callStaticMethod(
                    'com/schanyin/tgcf/UmengHelper',
                    'onPageStart',
                    '(Ljava/lang/String;)V',
                    pageName
                );
            } catch (error) {
                console.error('[UmengSDK] 页面开始统计失败:', error);
            }
        }
    }
    
    /**
     * 页面结束统计
     * @param pageName 页面名称
     */
    public onPageEnd(pageName: string): void {
        if (!this.isInitialized) {
            console.warn('[UmengSDK] SDK未初始化，请先调用init()');
            return;
        }
        
        console.log(`[UmengSDK] 页面结束: ${pageName}`);
        
        if (native.reflection && native.reflection.callStaticMethod) {
            try {
                native.reflection.callStaticMethod(
                    'com/schanyin/tgcf/UmengHelper',
                    'onPageEnd',
                    '(Ljava/lang/String;)V',
                    pageName
                );
            } catch (error) {
                console.error('[UmengSDK] 页面结束统计失败:', error);
            }
        }
    }
    
    /**
     * 自定义事件统计
     * @param eventId 事件ID
     * @param attributes 事件属性（可选）
     */
    public onEvent(eventId: string, attributes?: Record<string, string>): void {
        if (!this.isInitialized) {
            console.warn('[UmengSDK] SDK未初始化，请先调用init()');
            return;
        }
        
        console.log(`[UmengSDK] 自定义事件: ${eventId}`, attributes);
        
        if (native.reflection && native.reflection.callStaticMethod) {
            try {
                if (attributes && Object.keys(attributes).length > 0) {
                    // 带属性的事件统计 - 使用自定义的静态方法
                    const attributesJson = JSON.stringify(attributes);
                    native.reflection.callStaticMethod(
                        'com/schanyin/tgcf/UmengHelper',
                        'onEventWithAttributes',
                        '(Ljava/lang/String;Ljava/lang/String;)V',
                        eventId,
                        attributesJson
                    );
                } else {
                    // 简单事件统计 - 使用自定义的静态方法
                    native.reflection.callStaticMethod(
                        'com/schanyin/tgcf/UmengHelper',
                        'onEvent',
                        '(Ljava/lang/String;)V',
                        eventId
                    );
                }
            } catch (error) {
                console.error('[UmengSDK] 自定义事件统计失败:', error);
            }
        }
    }
    
    /**
     * 计数事件统计
     * @param eventId 事件ID
     * @param count 计数值
     */
    public onEventValue(eventId: string, count: number): void {
        if (!this.isInitialized) {
            console.warn('[UmengSDK] SDK未初始化，请先调用init()');
            return;
        }
        
        console.log(`[UmengSDK] 计数事件: ${eventId}, 计数: ${count}`);
        
        if (native.reflection && native.reflection.callStaticMethod) {
            try {
                native.reflection.callStaticMethod(
                    'com/umeng/analytics/MobclickAgent',
                    'onEventValue',
                    '(Landroid/content/Context;Ljava/lang/String;I)V',
                    eventId,
                    count
                );
            } catch (error) {
                console.error('[UmengSDK] 计数事件统计失败:', error);
            }
        }
    }
    
    /**
     * 设置用户ID（用户登录）
     * @param userId 用户ID
     */
    public setUserId(userId: string): void {
        if (!this.isInitialized) {
            console.warn('[UmengSDK] SDK未初始化，请先调用init()');
            return;
        }
        
        console.log(`[UmengSDK] 设置用户ID: ${userId}`);
        
        if (native.reflection && native.reflection.callStaticMethod) {
            try {
                native.reflection.callStaticMethod(
                    'com/schanyin/tgcf/UmengHelper',
                    'onProfileSignIn',
                    '(Ljava/lang/String;)V',
                    userId
                );
            } catch (error) {
                console.error('[UmengSDK] 设置用户ID失败:', error);
            }
        }
    }
    
    /**
     * 设置用户ID（带提供商）
     * @param provider 账号来源（如：WX、QQ等）
     * @param userId 用户ID
     */
    public setUserIdWithProvider(provider: string, userId: string): void {
        if (!this.isInitialized) {
            console.warn('[UmengSDK] SDK未初始化，请先调用init()');
            return;
        }
        
        console.log(`[UmengSDK] 设置用户ID(带提供商): ${provider}, ${userId}`);
        
        if (native.reflection && native.reflection.callStaticMethod) {
            try {
                native.reflection.callStaticMethod(
                    'com/schanyin/tgcf/UmengHelper',
                    'onProfileSignInWithProvider',
                    '(Ljava/lang/String;Ljava/lang/String;)V',
                    provider,
                    userId
                );
            } catch (error) {
                console.error('[UmengSDK] 设置用户ID(带提供商)失败:', error);
            }
        }
    }
    
    /**
     * 用户登出
     */
    public signOut(): void {
        if (!this.isInitialized) {
            console.warn('[UmengSDK] SDK未初始化，请先调用init()');
            return;
        }
        
        console.log('[UmengSDK] 用户登出');
        
        if (native.reflection && native.reflection.callStaticMethod) {
            try {
                native.reflection.callStaticMethod(
                    'com/schanyin/tgcf/UmengHelper',
                    'onProfileSignOff',
                    '()V'
                );
            } catch (error) {
                console.error('[UmengSDK] 用户登出失败:', error);
            }
        }
    }
    
    /**
     * 获取SDK状态
     */
    public isSDKInitialized(): boolean {
        return this.isInitialized;
    }
    
    /**
     * 统一埋点追踪方法（简化调用接口）
     * @param eventType 埋点事件类型
     * @param customAttributes 自定义属性（可选）
     */
    public track(eventType: TrackEventType, customAttributes?: Record<string, string>): void {
        const config = UmengSDK.TRACK_EVENT_CONFIGS[eventType];
        if (!config) {
            console.error(`[UmengSDK] 未找到埋点配置: ${eventType}`);
            return;
        }
        
        // 合并默认属性和自定义属性
        const attributes = {
            ...config.defaultAttributes,
            ...customAttributes,
            timestamp: Date.now().toString()
        };
        
        // 调用原有的事件统计方法
        this.onEvent(config.eventId, attributes);
        
        console.log(`[友盟埋点] ${config.eventName} (${config.eventId})`, attributes);
    }
    
    /**
     * 获取埋点配置信息
     * @param eventType 埋点事件类型
     */
    public getTrackEventConfig(eventType: TrackEventType): TrackEventConfig | null {
        return UmengSDK.TRACK_EVENT_CONFIGS[eventType] || null;
    }
    
    /**
     * 获取所有埋点配置
     */
    public getAllTrackEventConfigs(): Record<TrackEventType, TrackEventConfig> {
        return UmengSDK.TRACK_EVENT_CONFIGS;
    }
    
    /**
     * 批量埋点追踪
     * @param events 埋点事件数组
     */
    public trackBatch(events: Array<{ eventType: TrackEventType; attributes?: Record<string, string> }>): void {
        events.forEach(event => {
            this.track(event.eventType, event.attributes);
        });
    }
    
    // ==================== 登录页面专用埋点方法 ====================
    
    /**
     * 登录页面曝光埋点
     * @param pageName 页面名称
     */
    public trackLoginPageExposure(pageName: string = '登录页'): void {
        this.track(TrackEventType.LOGIN_PAGE_EXPOSURE, {
            page_name: pageName,
            timestamp: Date.now().toString()
        });
    }
    
    /**
     * 登录页面访问模式点击埋点
     * @param accessMode 访问模式（如：微信登录、手机号登录等）
     * @param modeText 模式显示文本
     */
    public trackLoginAccessModeClick(accessMode: string, modeText: string): void {
        this.track(TrackEventType.LOGIN_ACCESS_MODE_CLICK, {
            access_mode: accessMode,
            mode_text: modeText,
            timestamp: Date.now().toString()
        });
    }
    
    /**
     * 登录页面授权点击埋点
     * @param action 操作类型（如：check、uncheck）
     * @param isChecked 是否已勾选（true/false）
     */
    public trackLoginAuthorizationGrantClick(action: string, isChecked: boolean): void {
        this.track(TrackEventType.LOGIN_AUTHORISATION_GRANT_CLICK, {
            action: action,
            is_checked: isChecked.toString(),
            timestamp: Date.now().toString()
        });
    }
    
    /**
     * 登录页面协议点击埋点
     * @param agreementText 协议文本
     * @param agreementType 协议类型（如：privacy、terms、user_agreement）
     */
    public trackLoginAgreementClick(agreementText: string, agreementType: string): void {
        this.track(TrackEventType.LOGIN_AGREEMENT_CLICK, {
            agreement_text: agreementText,
            agreement_type: agreementType,
            timestamp: Date.now().toString()
        });
    }
}

// 导出单例实例
export const umengSDK = UmengSDK.getInstance();

// 导出简化的埋点方法，支持直接调用
export const track = (eventType: TrackEventType, attributes?: Record<string, string>) => {
    umengSDK.track(eventType, attributes);
};

// 导出批量埋点方法
export const trackBatch = (events: Array<{ eventType: TrackEventType; attributes?: Record<string, string> }>) => {
    umengSDK.trackBatch(events);
};

// 导出获取配置的方法
export const getTrackEventConfig = (eventType: TrackEventType) => {
    return umengSDK.getTrackEventConfig(eventType);
};

// 导出所有配置
export const getAllTrackEventConfigs = () => {
    return umengSDK.getAllTrackEventConfigs();
};

// ==================== 导出登录页面专用埋点方法 ====================

/**
 * 登录页面曝光埋点
 * @param pageName 页面名称
 */
export const trackLoginPageExposure = (pageName?: string) => {
    umengSDK.trackLoginPageExposure(pageName);
};

/**
 * 登录页面访问模式点击埋点
 * @param accessMode 访问模式
 * @param modeText 模式显示文本
 */
export const trackLoginAccessModeClick = (accessMode: string, modeText: string) => {
    umengSDK.trackLoginAccessModeClick(accessMode, modeText);
};

/**
 * 登录页面授权点击埋点
 * @param action 操作类型
 * @param isChecked 是否已勾选
 */
export const trackLoginAuthorizationGrantClick = (action: string, isChecked: boolean) => {
    umengSDK.trackLoginAuthorizationGrantClick(action, isChecked);
};

/**
 * 登录页面协议点击埋点
 * @param agreementText 协议文本
 * @param agreementType 协议类型
 */
export const trackLoginAgreementClick = (agreementText: string, agreementType: string) => {
    umengSDK.trackLoginAgreementClick(agreementText, agreementType);
};