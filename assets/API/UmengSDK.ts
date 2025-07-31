import { _decorator, Component, Node, native } from 'cc';
const { ccclass, property } = _decorator;

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
    
    public static getInstance(): UmengSDK {
        if (!UmengSDK.instance) {
            UmengSDK.instance = new UmengSDK();
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
                    'com/umeng/analytics/MobclickAgent',
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
                    'com/umeng/analytics/MobclickAgent',
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
                    // 带属性的事件统计
                    const attributesJson = JSON.stringify(attributes);
                    native.reflection.callStaticMethod(
                        'com/umeng/analytics/MobclickAgent',
                        'onEventValue',
                        '(Landroid/content/Context;Ljava/lang/String;Ljava/util/Map;)V',
                        eventId,
                        attributesJson
                    );
                } else {
                    // 简单事件统计
                    native.reflection.callStaticMethod(
                        'com/umeng/analytics/MobclickAgent',
                        'onEvent',
                        '(Landroid/content/Context;Ljava/lang/String;)V',
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
     * 设置用户ID
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
                    'com/umeng/analytics/MobclickAgent',
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
                    'com/umeng/analytics/MobclickAgent',
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
}

// 导出单例实例
export const umengSDK = UmengSDK.getInstance();