import { native } from 'cc';

/**
 * 巨量引擎转化SDK接口类
 * 用于处理启动事件上报和转化追踪
 */
export class OceanEngineSDK {
    private static readonly TAG = 'OceanEngineSDK';

    /**
     * 获取Android ID
     * @returns Android设备ID
     */
    public static getAndroidId(): string {
        try {
            if (native.reflection && native.reflection.callStaticMethod) {
                return native.reflection.callStaticMethod(
                    'com/schanyin/tgcf/App',
                    'getAndroidId',
                    '(Landroid/content/Context;)Ljava/lang/String;',
                    native.reflection.callStaticMethod(
                        'com/cocos/lib/CocosActivity',
                        'getContext',
                        '()Landroid/content/Context;'
                    )
                ) || '';
            }
        } catch (error) {
            console.error(`${this.TAG} 获取Android ID失败:`, error);
        }
        return '';
    }

    /**
     * 手动发送启动事件
     * 用于测试SDK集成是否正常
     */
    public static sendLaunchEvent(): void {
        try {
            if (native.reflection && native.reflection.callStaticMethod) {
                // 获取当前Activity作为Context
                const activity = native.reflection.callStaticMethod(
                    'com/cocos/lib/CocosActivity',
                    'getContext',
                    '()Landroid/content/Context;'
                );
                
                native.reflection.callStaticMethod(
                    'com/schanyin/tgcf/App',
                    'sendLaunchEvent',
                    '(Landroid/content/Context;)V',
                    activity
                );
                console.log(`${this.TAG} 手动发送启动事件成功`);
            }
        } catch (error) {
            console.error(`${this.TAG} 手动发送启动事件失败:`, error);
        }
    }

    /**
     * 测试巨量SDK集成
     * 输出相关信息用于调试
     */
    public static testIntegration(): void {
        console.log(`${this.TAG} === 巨量引擎转化SDK集成测试 ===`);
        
        // 获取Android ID
        const androidId = this.getAndroidId();
        console.log(`${this.TAG} Android ID: ${androidId}`);
        
        // 发送启动事件
        this.sendLaunchEvent();
        
        console.log(`${this.TAG} === 测试完成，请查看原生日志确认SDK状态 ===`);
    }

    /**
     * 初始化巨量SDK测试
     * 在游戏启动后调用此方法进行测试
     */
    public static init(): void {
        console.log(`${this.TAG} 巨量引擎转化SDK TypeScript接口初始化`);
        
        // 延迟执行测试，确保原生SDK已完全初始化
        setTimeout(() => {
            this.testIntegration();
        }, 3000);
    }
}

// 导出单例
export default OceanEngineSDK;