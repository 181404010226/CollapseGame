import { _decorator, Component, log, warn, error } from 'cc';
import { native } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 穿山甲广告事件回调接口
 */
export interface PangleAdEventCallback {
    // SDK初始化回调
    onInitResult?: (success: boolean, message: string) => void;
    
    // 广告加载回调
    onAdLoadResult?: (success: boolean, message: string) => void;
    
    // 广告渲染回调
    onAdRenderResult?: (success: boolean, message: string) => void;
    
    // 广告展示回调
    onAdShowResult?: (success: boolean, message: string, ecpmInfo?: string) => void;
    
    // 广告点击回调
    onAdClick?: () => void;
    
    // 广告关闭回调
    onAdClose?: (closeType: number) => void;
}

/**
 * 穿山甲广告管理器
 * 负责与Android端的穿山甲广告SDK进行桥接通信
 */
@ccclass('PangleAdManager')
export class PangleAdManager extends Component {
    
    private static instance: PangleAdManager = null;
    private callback: PangleAdEventCallback = null;
    private isInitialized: boolean = false;
    
    public static getInstance(): PangleAdManager {
        if (!PangleAdManager.instance) {
            PangleAdManager.instance = new PangleAdManager();
        }
        return PangleAdManager.instance;
    }
    
    start() {
        // 设置全局实例
        PangleAdManager.instance = this;
        
        // 注册原生回调
        this.registerNativeCallbacks();
        
        log('PangleAdManager 已初始化');
    }
    
    /**
     * 注册原生回调
     */
    private registerNativeCallbacks() {
        // 使用 native.bridge.onNative 注册回调，这是Cocos Creator 3.8.x的正确方式
        if (typeof native !== 'undefined' && native.bridge) {
            native.bridge.onNative = (command: string, data: string) => {
                try {
                    log(`收到原生回调: ${command} -> ${data}`);
                    this.handleNativeCallback(command, data);
                } catch (e) {
                    error('处理原生回调失败:', e);
                }
            };
            
            log('原生回调已注册 (使用 native.bridge.onNative)');
        } else {
            // 备用方案：使用全局函数注册回调
            if (typeof window !== 'undefined') {
                (window as any).onPangleCallback = (command: string, data: string) => {
                    try {
                        log(`收到原生回调: ${command} -> ${data}`);
                        this.handleNativeCallback(command, data);
                    } catch (e) {
                        error('处理原生回调失败:', e);
                    }
                };
                
                warn('使用备用方案注册原生回调 (window.onPangleCallback)');
            } else {
                warn('当前平台不支持原生回调');
            }
        }
    }
    
    /**
     * 处理原生回调
     */
    private handleNativeCallback(command: string, data: string) {
        if (!this.callback) {
            log('未设置回调函数，忽略事件:', command);
            return;
        }
        
        let parsedData: any = {};
        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            warn('解析回调数据失败:', e, data);
        }
        
        switch (command) {
            case 'pangleInitResult':
                this.isInitialized = parsedData.success;
                this.callback.onInitResult?.(parsedData.success, parsedData.message);
                break;
                
            case 'pangleAdLoadResult':
                this.callback.onAdLoadResult?.(parsedData.success, parsedData.message);
                break;
                
            case 'pangleAdRenderResult':
                this.callback.onAdRenderResult?.(parsedData.success, parsedData.message);
                break;
                
            case 'pangleAdShowResult':
                this.callback.onAdShowResult?.(parsedData.success, parsedData.message, parsedData.ecpmInfo);
                break;
                
            case 'pangleAdClick':
                this.callback.onAdClick?.();
                break;
                
            case 'pangleAdClose':
                this.callback.onAdClose?.(parsedData.closeType);
                break;
                
            case 'pangleAdReady':
                // 这个回调是同步的，不需要在这里处理
                break;
                
            default:
                warn('未知的穿山甲广告回调:', command);
                break;
        }
    }
    
    /**
     * 设置事件回调
     */
    public setCallback(callback: PangleAdEventCallback) {
        this.callback = callback;
        log('穿山甲广告回调已设置');
    }
    
    /**
     * 初始化穿山甲SDK
     */
    public initSDK(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.isInitialized) {
                log('穿山甲SDK已经初始化');
                resolve(true);
                return;
            }
            
            // 设置临时回调
            const originalCallback = this.callback;
            this.callback = {
                ...originalCallback,
                onInitResult: (success: boolean, message: string) => {
                    log(`穿山甲SDK初始化结果: ${success ? '成功' : '失败'} - ${message}`);
                    originalCallback?.onInitResult?.(success, message);
                    resolve(success);
                }
            };
            
            // 发送初始化命令到Android端
            this.sendToNative('pangleInitSDK', '');
            
            // 超时处理
            setTimeout(() => {
                if (!this.isInitialized) {
                    this.callback = originalCallback;
                    reject(new Error('穿山甲SDK初始化超时'));
                }
            }, 10000);
        });
    }
    
    /**
     * 加载开屏广告
     */
    public loadSplashAd(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                reject(new Error('穿山甲SDK未初始化'));
                return;
            }
            
            // 设置临时回调
            const originalCallback = this.callback;
            let isResolved = false;
            
            this.callback = {
                ...originalCallback,
                onAdLoadResult: (success: boolean, message: string) => {
                    log(`开屏广告加载结果: ${success ? '成功' : '失败'} - ${message}`);
                    originalCallback?.onAdLoadResult?.(success, message);
                    if (!isResolved) {
                        isResolved = true;
                        resolve(success);
                    }
                },
                onAdRenderResult: (success: boolean, message: string) => {
                    log(`开屏广告渲染结果: ${success ? '成功' : '失败'} - ${message}`);
                    originalCallback?.onAdRenderResult?.(success, message);
                }
            };
            
            // 发送加载命令到Android端
            this.sendToNative('pangleLoadSplashAd', '');
            
            // 超时处理
            setTimeout(() => {
                if (!isResolved) {
                    this.callback = originalCallback;
                    reject(new Error('开屏广告加载超时'));
                }
            }, 10000);
        });
    }
    
    /**
     * 展示开屏广告
     */
    public showSplashAd(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                reject(new Error('穿山甲SDK未初始化'));
                return;
            }
            
            // 设置临时回调
            const originalCallback = this.callback;
            let isResolved = false;
            
            this.callback = {
                ...originalCallback,
                onAdShowResult: (success: boolean, message: string, ecpmInfo?: string) => {
                    log(`开屏广告展示结果: ${success ? '成功' : '失败'} - ${message}`);
                    if (ecpmInfo) {
                        log(`广告收益信息: ${ecpmInfo}`);
                    }
                    originalCallback?.onAdShowResult?.(success, message, ecpmInfo);
                    if (!isResolved) {
                        isResolved = true;
                        resolve(success);
                    }
                },
                onAdClick: () => {
                    log('开屏广告被点击');
                    originalCallback?.onAdClick?.();
                },
                onAdClose: (closeType: number) => {
                    log(`开屏广告关闭, 关闭类型: ${closeType}`);
                    originalCallback?.onAdClose?.(closeType);
                }
            };
            
            // 发送展示命令到Android端
            this.sendToNative('pangleShowSplashAd', '');
            
            // 超时处理
            setTimeout(() => {
                if (!isResolved) {
                    this.callback = originalCallback;
                    reject(new Error('开屏广告展示超时'));
                }
            }, 5000);
        });
    }
    
    /**
     * 检查广告是否准备好
     */
    public isAdReady(): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this.isInitialized) {
                resolve(false);
                return;
            }
            
            // 设置临时回调
            const originalCallback = this.callback;
            let isResolved = false;
            
            this.callback = {
                ...originalCallback,
                // 这里需要特殊处理，因为isAdReady是同步的
            };
            
            // 监听原生回调中的pangleAdReady事件
            const originalHandleNativeCallback = this.handleNativeCallback.bind(this);
            this.handleNativeCallback = (command: string, data: string) => {
                if (command === 'pangleAdReady' && !isResolved) {
                    isResolved = true;
                    try {
                        const result = JSON.parse(data);
                        resolve(result.isReady);
                    } catch (e) {
                        resolve(false);
                    }
                    // 恢复原来的回调处理
                    this.handleNativeCallback = originalHandleNativeCallback;
                    this.callback = originalCallback;
                } else {
                    originalHandleNativeCallback(command, data);
                }
            };
            
            // 发送检查命令到Android端
            this.sendToNative('pangleIsAdReady', '');
            
            // 超时处理
            setTimeout(() => {
                if (!isResolved) {
                    this.handleNativeCallback = originalHandleNativeCallback;
                    this.callback = originalCallback;
                    resolve(false);
                }
            }, 3000);
        });
    }
    
    /**
     * 销毁广告
     */
    public destroyAd() {
        this.sendToNative('pangleDestroyAd', '');
        log('销毁广告命令已发送');
    }
    
    /**
     * 获取SDK初始化状态
     */
    public getInitStatus(): boolean {
        return this.isInitialized;
    }
    
    /**
     * 发送命令到原生端
     */
    private sendToNative(command: string, data: string) {
        if (typeof native !== 'undefined' && native.bridge) {
            try {
                // 使用native.bridge.sendToNative方法，这是Cocos Creator 3.8.x的正确方式
                native.bridge.sendToNative(command, data);
                log(`发送到原生端: ${command} -> ${data}`);
            } catch (e) {
                error('发送到原生端失败:', e);
            }
        } else {
            warn('当前平台不支持原生桥接');
        }
    }
    
    onDestroy() {
        // 清理回调
        this.callback = null;
        
        // 如果是全局实例，则清空
        if (PangleAdManager.instance === this) {
            PangleAdManager.instance = null;
        }
    }
}

// 导出便捷的静态方法
export namespace PangleAd {
    /**
     * 获取穿山甲广告管理器实例
     */
    export function getInstance(): PangleAdManager {
        return PangleAdManager.getInstance();
    }
    
    /**
     * 快速初始化穿山甲SDK
     */
    export function init(callback?: PangleAdEventCallback): Promise<boolean> {
        const manager = PangleAdManager.getInstance();
        if (callback) {
            manager.setCallback(callback);
        }
        return manager.initSDK();
    }
    
    /**
     * 快速加载和展示开屏广告
     */
    export async function showSplashAd(callback?: PangleAdEventCallback): Promise<boolean> {
        const manager = PangleAdManager.getInstance();
        if (callback) {
            manager.setCallback(callback);
        }
        
        try {
            // 先检查SDK是否已初始化
            if (!manager.getInitStatus()) {
                log('SDK未初始化，先初始化SDK...');
                await manager.initSDK();
            }
            
            // 加载广告
            log('开始加载开屏广告...');
            await manager.loadSplashAd();
            
            // 展示广告
            log('开始展示开屏广告...');
            return await manager.showSplashAd();
        } catch (error) {
            error('展示开屏广告失败:', error);
            return false;
        }
    }
} 