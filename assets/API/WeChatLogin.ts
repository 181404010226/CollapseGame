import { _decorator, Component, log, warn, director } from 'cc';
import { native } from 'cc';
import { NativeBridge, INativeMessageHandler } from './NativeBridgeManager';
import { ApiConfig } from './ApiConfig';

const { ccclass, property } = _decorator;

// 微信登录结果接口
export interface WeChatLoginResult {
    success: boolean;
    openid?: string;
    access_token?: string;
    expire_in?: number;
    client_id?: string;
    error?: string;
    code?: string; // 微信返回的code
}

// 微信授权结果接口（从原生端返回）
interface WeChatAuthResult {
    success: boolean;
    code?: string;
    error?: string;
    message?: string;
    timestamp?: number;
}

// 后端API响应接口
interface LoginApiResponse {
    msg: string;
    code: number;
    data: {
        openid: string;
        wechatNickname: string;
        wechatAvatar: string;
        isRealName: boolean | null;
        access_token: string;
        expire_in: number;
        client_id: string | null;
    };
}

/**
 * 微信登录管理类
 * 用于在Cocos Creator中调用微信登录功能
 */
@ccclass('WeChatLogin')
export class WeChatLogin extends Component implements INativeMessageHandler {

    private loginCallback: ((result: WeChatLoginResult) => void) | null = null;
    private isInitialized: boolean = false;
    private isLoginInProgress: boolean = false; // 防止重复调用回调
    
    onLoad() {
        log('=== 微信登录管理器初始化 ===');
        log(`使用微信AppID: ${ApiConfig.getWeChatAppId()}`);
        log(`API地址: ${ApiConfig.getBaseUrl()}`);
        log(`登录端点: ${ApiConfig.ENDPOINTS.WECHAT_LOGIN}`);
        
        // 注册到统一原生桥接管理器
        this.registerToNativeBridge();
    }

    start() {
        // 延迟初始化原生监听器，确保场景完全加载
        this.initializeNativeListeners();
    }

    onDestroy() {
        log('=== 微信登录管理器销毁 ===');
        
        // 从统一原生桥接管理器注销
        try {
            NativeBridge.unregisterHandler('WeChatLogin');
            log('WeChatLogin已从统一原生桥接管理器注销');
        } catch (error) {
            warn('从统一原生桥接管理器注销失败:', error);
        }
        
        this.removeNativeListeners();
        this.loginCallback = null;
    }

    /**
     * 注册到统一原生桥接管理器
     */
    private registerToNativeBridge() {
        log('注册WeChatLogin到统一原生桥接管理器...');
        
        try {
            // 确保原生桥接管理器已初始化
            const bridgeManager = NativeBridge.ensureInitialized();
            
            // 注册消息处理器
            NativeBridge.registerHandler('WeChatLogin', this);
            
            log('WeChatLogin已注册到统一原生桥接管理器');
        } catch (error) {
            console.error('注册到原生桥接管理器失败:', error);
        }
    }
    
    /**
     * 初始化原生监听器
     */
    private initializeNativeListeners(): void {
        if (this.isInitialized) {
            log('原生监听器已初始化，跳过重复初始化');
            return;
        }

        try {
            log('=== 开始初始化原生监听器 ===');
            
            // 检查原生环境
            if (typeof native !== 'undefined' && native.bridge) {
                log('原生环境检测成功，设置监听器');
                this.setupNativeBridgeListener();
            } else if (typeof jsb !== 'undefined' && (jsb as any).bridge) {
                log('JSB环境检测成功，设置监听器');
                this.setupJSBBridgeListener();
            } else {
                warn('非原生环境，跳过监听器设置');
            }
            
            this.isInitialized = true;
            log('原生监听器初始化完成');
            
        } catch (error) {
            warn('初始化原生监听器失败:', error);
        }
    }

    /**
     * 设置 native.bridge 监听器
     */
    private setupNativeBridgeListener(): void {
        if (!native.bridge) return;

        // 保存原有的处理器
        const originalHandler = native.bridge.onNative;
        
        // 设置新的处理器
        native.bridge.onNative = (command: string, data: string) => {
            // 先调用原有处理器
            if (originalHandler && typeof originalHandler === 'function') {
                originalHandler.call(native.bridge, command, data);
            }
            
            // 处理微信登录相关消息
            this.handleNativeMessage(command, data);
        };
        
        log('✅ native.bridge 监听器设置完成');
    }

    /**
     * 设置 jsb.bridge 监听器
     */
    private setupJSBBridgeListener(): void {
        try {
            const jsbBridge: any = (jsb as any).bridge;
            if (!jsbBridge) return;

            // 方式1: 通过 setCallback 设置
            if (jsbBridge.setCallback) {
                const callbackObj = {
                    onScript: (command: string, data: string) => {
                        this.handleNativeMessage(command, data);
                    }
                };
                jsbBridge.setCallback(callbackObj);
                log('✅ jsb.bridge.setCallback 监听器设置完成');
            }
            
            // 方式2: 直接设置 onNative
            if (jsbBridge.onNative) {
                const originalHandler = jsbBridge.onNative;
                jsbBridge.onNative = (command: string, data: string) => {
                    if (originalHandler && typeof originalHandler === 'function') {
                        originalHandler.call(jsbBridge, command, data);
                    }
                    this.handleNativeMessage(command, data);
                };
                log('✅ jsb.bridge.onNative 监听器设置完成');
            }
            
        } catch (error) {
            warn('设置 jsb.bridge 监听器失败:', error);
        }
    }

    /**
     * 实现INativeMessageHandler接口 - 处理原生消息
     */
    public handleNativeMessage(command: string, data: string): boolean {
        // 只处理微信登录相关的消息
        if (!this.isWeChatLoginCommand(command)) {
            return false; // 不是微信登录相关消息，不处理
        }
        
        log(`WeChatLogin处理原生消息: ${command} -> ${data}`);
        this.handleWeChatNativeMessage(command, data);
        return true; // 消息已处理
    }
    
    /**
     * 检查是否是微信登录相关的命令
     */
    private isWeChatLoginCommand(command: string): boolean {
        const wechatCommands = [
            'wechatLoginResult',
            'wechatLoginError'
        ];
        return wechatCommands.includes(command);
    }
    
    /**
      * 处理微信原生消息
      */
    private handleWeChatNativeMessage(command: string, data: string): void {
        log(`=== 收到原生消息: ${command} ===`);
        
        switch (command) {
            case 'wechatLoginResult':
                log('>>> 处理微信登录结果 <<<');
                this.handleWeChatAuthResult(data);
                break;
            case 'wechatLoginError':
                log('>>> 处理微信登录错误 <<<');
                this.handleWeChatLoginError(data);
                break;
            default:
                // 不是微信登录相关的消息，忽略
                break;
        }
    }

    /**
     * 移除原生监听器
     */
    private removeNativeListeners(): void {
        try {
            if (typeof native !== 'undefined' && native.bridge) {
                // 注意：这里不能简单设置为null，因为可能有其他组件也在使用
                // 在实际项目中，应该使用更复杂的消息路由机制
                log('保留原生监听器，避免影响其他组件');
            }
        } catch (error) {
            warn('移除原生监听器失败:', error);
        }
    }

    /**
     * 处理微信授权结果
     */
    private async handleWeChatAuthResult(data: string): Promise<void> {
        try {
            log('=== 处理微信授权结果 ===');
            log('原始数据:', data);
            
            const authResult: WeChatAuthResult = JSON.parse(data);
            log('解析后的授权结果:', authResult);
            
            if (authResult.success && authResult.code) {
                log('>>> 微信授权成功，获取用户信息 <<<');
                log('授权码:', authResult.code);
                
                // 调用后端API获取用户信息
                await this.loginWithCode(authResult.code);
            } else {
                log('>>> 微信授权失败 <<<');
                warn('授权失败原因:', authResult.error || '未知错误');
                
                this.callLoginCallback({
                    success: false,
                    error: authResult.error || '微信授权失败'
                });
            }
        } catch (error) {
             warn('=== 解析微信授权结果失败 ===', error);
             warn('原始数据:', data);
            
            this.callLoginCallback({
                success: false,
                error: '解析授权结果失败: ' + error.message
            });
         }
     }

     /**
      * 发送命令到原生端
      */
    private sendToNative(command: string, data: string) {
         // 优先使用统一原生桥接管理器
         const success = NativeBridge.sendToNative(command, data);
         if (success) {
             log(`通过统一桥接管理器发送到原生端: ${command} -> ${data}`);
             return;
         }
         
         // 备用方案：直接使用原生桥接
         if (typeof native !== 'undefined' && native.bridge) {
             try {
                 native.bridge.sendToNative(command, data);
                 log(`直接发送到原生端 (native.bridge): ${command} -> ${data}`);
                 return;
             } catch (e) {
                 console.error('native.bridge发送失败:', e);
             }
         }
         
         // 方法2: 尝试使用jsb.bridge作为备用
         try {
             if (typeof jsb !== 'undefined' && (jsb as any).bridge) {
                 (jsb as any).bridge.sendToNative(command, data);
                 log(`发送到原生端 (jsb.bridge): ${command} -> ${data}`);
                 return;
             }
         } catch (e) {
             console.error('jsb.bridge发送失败:', e);
         }
         
         warn('当前平台不支持原生桥接');
     }

     /**
     * 使用code调用后端API登录
     */
    private async loginWithCode(code: string, retryCount: number = 0): Promise<void> {
        const maxRetries = 2; // 最大重试次数
        const retryDelay = 1000; // 重试延迟（毫秒）
        
        try {
            log('=== 开始调用后端API ===');
            log(`授权码: ${code}`);
            if (retryCount > 0) {
                log(`重试次数: ${retryCount}/${maxRetries}`);
            }
            
            // 构建API URL和请求参数
            const packageName = ApiConfig.getPackageName();
            const releaseChannel = ApiConfig.getReleaseChannel();
            const apiUrl = ApiConfig.getFullUrl(ApiConfig.ENDPOINTS.WECHAT_LOGIN);
            
            // 构建POST请求体
            const requestBody = {
                code: code,
                packageName: packageName,
                releaseChannel: releaseChannel
            };
            
            log(`请求URL: ${apiUrl}`);
            log(`请求参数:`, requestBody);
            
            // 发起HTTP POST请求
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'CocosCreator-WeChat-Login',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(requestBody)
            });
            
            log(`HTTP响应状态: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const responseText = await response.text();
                log('响应内容:', responseText);
                
                const apiResult: LoginApiResponse = JSON.parse(responseText);
                log('解析后的API结果:', apiResult);
                
                // 检查后端返回的状态码
                if (apiResult.code === 200 && apiResult.data) {
                    // 登录成功
                    const userData = apiResult.data;
                    log(`获得openid: ${userData.openid}`);
                    log(`微信昵称: ${userData.wechatNickname}`);
                    log(`微信头像: ${userData.wechatAvatar}`);
                    log(`是否实名: ${userData.isRealName}`);
                    log(`获得access_token: ${userData.access_token ? '已获取' : '未获取'}`);
                    log(`token过期时间: ${userData.expire_in}秒`);
                    log(`client_id: ${userData.client_id}`);
                    
                    log('>>> 准备调用成功回调 <<<');
                    const successResult = {
                        success: true,
                        openid: userData.openid,
                        access_token: userData.access_token,
                        expire_in: userData.expire_in,
                        client_id: userData.client_id,
                        code: code
                    };
                    log('成功结果对象:', successResult);
                    
                    this.callLoginCallback(successResult);
                    log('>>> 成功回调调用完成 <<<');
                } else {
                    // 后端返回的业务状态码不是200
                    warn(`后端业务逻辑失败: ${apiResult.code} - ${apiResult.msg}`);
                    this.callLoginCallback({
                        success: false,
                        error: `登录失败: ${apiResult.msg}`,
                        code: code
                    });
                }
            } else {
                // HTTP请求失败 - 检查是否需要重试
                const errorText = await response.text();
                warn(`HTTP请求失败: ${response.status} ${response.statusText}`);
                warn('错误响应:', errorText);
                
                // 对于500错误且还有重试次数，进行重试
                if (response.status === 500 && retryCount < maxRetries) {
                    warn(`服务器内部错误(500)，${retryDelay}ms后进行第${retryCount + 1}次重试`);
                    warn('服务器错误详情:', errorText);
                    setTimeout(() => {
                        this.loginWithCode(code, retryCount + 1);
                    }, retryDelay);
                    return;
                }
                
                // 构建更友好的错误信息
                let errorMessage = `请求失败: ${response.status} ${response.statusText}`;
                if (response.status === 500) {
                    errorMessage = '服务器暂时繁忙，请稍后重试';
                    if (retryCount > 0) {
                        errorMessage += `（已重试${retryCount}次）`;
                    }
                }
                
                this.callLoginCallback({
                    success: false,
                    error: errorMessage,
                    code: code
                });
            }
        } catch (error) {
            warn('=== 调用后端API失败 ===', error);
            
            // 对于网络错误且还有重试次数，进行重试
            if (retryCount < maxRetries) {
                warn(`网络请求异常，${retryDelay}ms后进行第${retryCount + 1}次重试`);
                setTimeout(() => {
                    this.loginWithCode(code, retryCount + 1);
                }, retryDelay);
                return;
            }
            
            // 开发模式下的模拟登录
            if (ApiConfig.DEV_MODE.ENABLE_MOCK_LOGIN) {
                warn('=== 启用开发模式模拟登录 ===');
                
                setTimeout(() => {
                    this.callLoginCallback({
                        success: true,
                        openid: 'mock_openid_' + Date.now(),
                        access_token: 'mock_access_token_' + Date.now(),
                        expire_in: 7200,
                        client_id: 'mock_client_id',
                        code: code
                    });
                }, 500);
                return;
            }
            
            this.callLoginCallback({
                success: false,
                error: `网络请求失败: ${error.message}`,
                code: code
            });
        }
    }

    /**
     * 处理微信登录错误
     */
    private handleWeChatLoginError(errorMsg: string): void {
        log('=== 处理微信登录错误 ===');
        warn('错误信息:', errorMsg);
        
        this.callLoginCallback({
            success: false,
            error: errorMsg
        });
    }

    /**
     * 调用登录回调
     */
    private callLoginCallback(result: WeChatLoginResult): void {
        log('=== 进入 callLoginCallback ===');
        log('回调状态检查: loginCallback =', this.loginCallback ? '存在' : '不存在');
        log('登录进行状态: isLoginInProgress =', this.isLoginInProgress);
        
        // 防止重复调用
        if (!this.isLoginInProgress) {
            warn('登录未在进行中，跳过回调调用');
            return;
        }
        
        if (this.loginCallback) {
            log('=== 调用登录回调 ===');
            log('登录结果:', result);
            
            const callback = this.loginCallback;
            this.loginCallback = null; // 清空回调，避免重复调用
            this.isLoginInProgress = false; // 标记登录结束
            
            log('>>> 即将执行回调函数 <<<');
            try {
                callback(result);
                log('>>> 回调函数执行完成 <<<');
            } catch (error) {
                warn('回调函数执行异常:', error);
            }
        } else {
            warn('登录回调不存在，可能已被清空或未设置');
            this.isLoginInProgress = false; // 确保状态重置
        }
    }

    /**
     * 发起微信登录
     */
    public login(): Promise<WeChatLoginResult> {
        return new Promise((resolve, reject) => {
            try {
                log('=== 开始微信登录流程 ===');
                
                // 检查是否已有登录请求在处理
                if (this.loginCallback || this.isLoginInProgress) {
                    const error = new Error('已有登录请求正在处理中');
                    warn('登录请求冲突:', error.message);
                    reject(error);
                    return;
                }

                // 设置回调和状态
                this.loginCallback = resolve;
                this.isLoginInProgress = true;
                log('登录回调已设置，登录状态已标记为进行中');

                // 确保监听器已初始化
                if (!this.isInitialized) {
                    this.initializeNativeListeners();
                }

                // 检查原生环境
                if (typeof native === 'undefined' || !native.bridge) {
                    warn('>>> 非原生环境 <<<');
                    
                    // 非原生环境返回错误
                    setTimeout(() => {
                        this.callLoginCallback({
                            success: false,
                            error: '当前环境不支持微信登录，请在真机上测试'
                        });
                    }, 100);
                    return;
                }

                log('>>> 发送微信登录请求到原生端 <<<');
                // 发送登录请求到原生端
                this.sendToNative('wechatLogin', '');
                log('微信登录请求已发送');

                // 设置超时处理
                const timeoutMs = ApiConfig.getTimeout() * 2;
                log(`设置超时时间: ${timeoutMs}ms`);
                
                const timeoutId = setTimeout(() => {
                    log('=== 超时定时器触发 ===');
                    log('超时检查: loginCallback =', this.loginCallback ? '存在' : '不存在');
                    
                    if (this.loginCallback) {
                        warn('=== 微信登录超时 ===');
                        this.callLoginCallback({
                            success: false,
                            error: `微信登录超时 (${timeoutMs}ms)`
                        });
                    } else {
                        log('登录已完成，跳过超时处理');
                    }
                }, timeoutMs);
                
                log('超时定时器已设置, ID:', timeoutId);

            } catch (error) {
                warn('=== 发起微信登录失败 ===', error);
                this.loginCallback = null;
                this.isLoginInProgress = false;
                reject(error);
            }
        });
    }

    /**
     * 检查微信是否已安装
     */
    public isWeChatInstalled(): Promise<boolean> {
        return new Promise((resolve) => {
            log('检查微信安装状态');
            
            // 检查原生环境
            if (typeof native === 'undefined' || !native.bridge) {
                log('非原生环境，返回false');
                resolve(false);
                return;
            }
            
            // 在实际项目中，可以发送消息到原生端检查微信安装状态
            // 这里简化处理，返回true
            log('原生环境，假设微信已安装');
            resolve(true);
        });
    }

    /**
     * 取消当前登录请求
     */
    public cancelLogin(): void {
        log('=== 取消微信登录请求 ===');
        
        if (this.loginCallback || this.isLoginInProgress) {
            this.callLoginCallback({
                success: false,
                error: '用户取消登录'
            });
            log('登录请求已取消');
        } else {
            log('没有进行中的登录请求');
        }
    }

    /**
     * 获取当前配置信息
     */
    public getCurrentConfig(): object {
        const config = {
            apiBaseUrl: ApiConfig.getBaseUrl(),
            wechatAppId: ApiConfig.getWeChatAppId(),
            wechatScope: ApiConfig.getWeChatScope(),
            releaseChannel: ApiConfig.getReleaseChannel(),
            loginEndpoint: ApiConfig.ENDPOINTS.WECHAT_LOGIN,
            fullLoginUrl: ApiConfig.getFullUrl(ApiConfig.ENDPOINTS.WECHAT_LOGIN),
            timeout: ApiConfig.getTimeout(),
            packageName: ApiConfig.getPackageName(),
            currentEnv: ApiConfig.getCurrentEnvironment().name
        };
        
        log('当前配置信息:', config);
        return config;
    }

    /**
     * 测试API连通性
     */
    public async testApiConnection(): Promise<boolean> {
        try {
            log('=== 测试API连通性 ===');
            const testUrl = ApiConfig.getBaseUrl() + '/';
            log(`测试URL: ${testUrl}`);
            
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'CocosCreator-API-Test'
                }
            });
            
            const isConnected = response.status < 500;
            log(`API连通性测试结果: ${response.status} ${response.statusText} - ${isConnected ? '连通' : '不连通'}`);
            return isConnected;
            
        } catch (error) {
            warn('API连通性测试失败:', error);
            return false;
        }
    }
}