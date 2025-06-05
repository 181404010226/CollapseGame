import { _decorator, Component, log, native, warn } from 'cc';
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
    openid: string;
    access_token: string;
    expire_in: number;
    client_id: string;
}

/**
 * 微信登录管理类
 * 用于在Cocos Creator中调用微信登录功能
 */
@ccclass('WeChatLogin')
export class WeChatLogin extends Component {

    private static instance: WeChatLogin = null;
    private loginCallback: ((result: WeChatLoginResult) => void) | null = null;
    
    onLoad() {
        // 设置为单例
        if (WeChatLogin.instance) {
            this.destroy();
            return;
        }
        WeChatLogin.instance = this;
        
        // 监听来自原生端的微信登录结果
        this.setupNativeListeners();
        
        log('=== 微信登录管理器初始化完成 ===');
        log(`使用微信AppID: ${ApiConfig.getWeChatAppId()}`);
        log(`API地址: ${ApiConfig.getBaseUrl()}`);
        log(`登录端点: ${ApiConfig.ENDPOINTS.WECHAT_LOGIN}`);
    }

    onDestroy() {
        if (WeChatLogin.instance === this) {
            WeChatLogin.instance = null;
        }
        this.removeNativeListeners();
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): WeChatLogin | null {
        return WeChatLogin.instance;
    }

    /**
     * 设置原生监听器
     * 修复：使用全局消息监听机制
     */
    private setupNativeListeners(): void {
        try {
            log('=== 开始设置原生监听器 ===');
            
            // 检查是否在原生环境
            if (typeof native !== 'undefined' && native.bridge) {
                log('原生环境检测成功，设置消息监听器');
                
                // 注册全局消息监听器
                native.bridge.onNative = (command: string, data: string) => {
                    log(`=== 收到原生消息 ===`);
                    log(`命令: ${command}`);
                    log(`数据: ${data}`);
                    
                    this.handleNativeMessage(command, data);
                };
                
                log('原生监听器设置完成');
            } else {
                warn('非原生环境，跳过监听器设置');
            }
        } catch (error) {
            warn('设置原生监听器失败:', error);
        }
    }

    /**
     * 处理原生消息
     */
    private handleNativeMessage(command: string, data: string): void {
        log(`=== 处理原生消息: ${command} ===`);
        
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
                log(`未知原生命令: ${command}`);
                break;
        }
    }

    /**
     * 移除原生监听器
     */
    private removeNativeListeners(): void {
        try {
            if (typeof native !== 'undefined' && native.bridge) {
                native.bridge.onNative = null;
                log('原生监听器已移除');
            }
        } catch (error) {
            warn('移除原生监听器失败:', error);
        }
    }

    /**
     * 处理微信授权结果（从原生端返回的code）
     */
    private async handleWeChatAuthResult(data: string): Promise<void> {
        try {
            log('=== 开始处理微信授权结果 ===');
            log('原始数据:', data);
            
            const authResult: WeChatAuthResult = JSON.parse(data);
            log('解析后的授权结果:', authResult);
            
            if (authResult.success && authResult.code) {
                log('>>> 微信授权成功，准备获取access_token <<<');
                log('授权码:', authResult.code);
                
                // 使用code调用后端API获取用户信息
                await this.loginWithCode(authResult.code);
            } else {
                // 授权失败
                log('>>> 微信授权失败 <<<');
                warn('授权失败原因:', authResult.error || '未知错误');
                
                if (this.loginCallback) {
                    this.loginCallback({
                        success: false,
                        error: authResult.error || '微信授权失败'
                    });
                    this.loginCallback = null;
                }
            }
        } catch (error) {
            warn('=== 解析微信授权结果失败 ===', error);
            warn('原始数据:', data);
            
            if (this.loginCallback) {
                this.loginCallback({
                    success: false,
                    error: '解析授权结果失败: ' + error.message
                });
                this.loginCallback = null;
            }
        }
    }

    /**
     * 使用code调用后端API登录
     */
    private async loginWithCode(code: string): Promise<void> {
        try {
            log('=== 开始调用后端API获取access_token ===');
            log(`授权码: ${code}`);
            
            // 使用ApiConfig构建API URL
            const apiUrl = ApiConfig.getFullUrl(ApiConfig.ENDPOINTS.WECHAT_LOGIN) + `?code=${encodeURIComponent(code)}`;
            log(`请求URL: ${apiUrl}`);
            
            const requestHeaders = {
                'Content-Type': 'application/json',
                'User-Agent': 'CocosCreator-WeChat-Login',
                'X-Requested-With': 'XMLHttpRequest'
            };
            log('请求头:', requestHeaders);
            
            const requestTime = Date.now();
            log(`>>> 发起HTTP请求获取access_token <<<`);
            log(`请求时间戳: ${requestTime}`);
            
            // 发起HTTP请求
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: requestHeaders,
            });

            const responseTime = Date.now();
            const requestDuration = responseTime - requestTime;
            log(`>>> HTTP请求完成 <<<`);
            log(`响应时间戳: ${responseTime}`);
            log(`请求耗时: ${requestDuration}ms`);
            log(`响应状态: ${response.status} ${response.statusText}`);
            log('响应头:', response.headers);

            if (response.ok) {
                log('>>> HTTP请求成功，解析响应数据 <<<');
                
                const responseText = await response.text();
                log('原始响应内容:', responseText);
                
                const apiResult: LoginApiResponse = JSON.parse(responseText);
                log('=== 后端API返回成功 ===');
                log('解析后的响应数据:', apiResult);
                log(`获得openid: ${apiResult.openid}`);
                log(`获得access_token: ${apiResult.access_token ? '已获取' : '未获取'}`);
                log(`token过期时间: ${apiResult.expire_in}秒`);
                log(`client_id: ${apiResult.client_id}`);
                
                // 登录成功，返回结果
                if (this.loginCallback) {
                    const successResult: WeChatLoginResult = {
                        success: true,
                        openid: apiResult.openid,
                        access_token: apiResult.access_token,
                        expire_in: apiResult.expire_in,
                        client_id: apiResult.client_id,
                        code: code
                    };
                    
                    log('=== 微信登录流程完成，返回最终结果 ===');
                    log('最终登录结果:', successResult);
                    
                    this.loginCallback(successResult);
                    this.loginCallback = null;
                }
            } else {
                log('>>> HTTP请求失败 <<<');
                const errorText = await response.text();
                warn(`后端API调用失败: ${response.status} ${response.statusText}`);
                warn('错误响应内容:', errorText);
                
                let errorMessage = `登录失败: ${response.status} ${response.statusText}`;
                if (errorText) {
                    try {
                        const errorObj = JSON.parse(errorText);
                        if (errorObj.error || errorObj.message) {
                            errorMessage += `: ${errorObj.error || errorObj.message}`;
                        }
                    } catch (e) {
                        errorMessage += `: ${errorText}`;
                    }
                }
                
                if (this.loginCallback) {
                    this.loginCallback({
                        success: false,
                        error: errorMessage,
                        code: code
                    });
                    this.loginCallback = null;
                }
            }
        } catch (error) {
            warn('=== 调用后端API失败 ===');
            warn('错误详情:', error);
            warn('错误堆栈:', error.stack);
            
            if (this.loginCallback) {
                this.loginCallback({
                    success: false,
                    error: `网络请求失败: ${error.message}`,
                    code: code
                });
                this.loginCallback = null;
            }
        }
    }

    /**
     * 处理微信登录错误
     */
    private handleWeChatLoginError(errorMsg: string): void {
        log('=== 处理微信登录错误 ===');
        warn('错误信息:', errorMsg);
        
        if (this.loginCallback) {
            this.loginCallback({
                success: false,
                error: errorMsg
            });
            this.loginCallback = null;
        }
    }

    /**
     * 发起微信登录
     */
    public login(): Promise<WeChatLoginResult> {
        return new Promise((resolve, reject) => {
            try {
                log('=== 开始微信登录流程 ===');
                
                // 检查是否已经有登录请求在处理
                if (this.loginCallback) {
                    const error = new Error('已有登录请求正在处理中');
                    warn('登录请求冲突:', error.message);
                    reject(error);
                    return;
                }

                // 设置回调
                this.loginCallback = resolve;
                log('登录回调已设置');

                // 检查是否在原生环境
                if (typeof native === 'undefined' || !native.bridge) {
                    warn('>>> 非原生环境检测 <<<');
                    // 非原生环境，返回模拟结果
                    setTimeout(() => {
                        const mockResult: WeChatLoginResult = {
                            success: false,
                            error: '当前环境不支持微信登录，请在真机上测试'
                        };
                        
                        log('返回模拟结果:', mockResult);
                        
                        if (this.loginCallback) {
                            this.loginCallback(mockResult);
                            this.loginCallback = null;
                        }
                    }, 500);
                    return;
                }

                log('>>> 原生环境检测成功，发送登录请求 <<<');
                // 发送微信登录请求到原生端
                native.bridge.sendToNative('wechatLogin', '');
                log('=== 微信登录请求已发送到原生端 ===');

                // 设置超时处理
                const timeoutMs = ApiConfig.getTimeout() * 2; // 使用配置的超时时间的2倍
                log(`设置超时时间: ${timeoutMs}ms`);
                
                setTimeout(() => {
                    if (this.loginCallback) {
                        warn('=== 微信登录超时 ===');
                        this.loginCallback({
                            success: false,
                            error: `微信登录超时 (${timeoutMs}ms)`
                        });
                        this.loginCallback = null;
                    }
                }, timeoutMs);

            } catch (error) {
                warn('=== 发起微信登录失败 ===', error);
                reject(error);
            }
        });
    }

    /**
     * 获取当前配置信息
     */
    public getCurrentConfig(): object {
        const config = {
            apiBaseUrl: ApiConfig.getBaseUrl(),
            wechatAppId: ApiConfig.getWeChatAppId(),
            wechatScope: ApiConfig.getWeChatScope(),
            loginEndpoint: ApiConfig.ENDPOINTS.WECHAT_LOGIN,
            fullLoginUrl: ApiConfig.getFullUrl(ApiConfig.ENDPOINTS.WECHAT_LOGIN),
            timeout: ApiConfig.getTimeout()
        };
        
        log('当前配置信息:', config);
        return config;
    }

    /**
     * 设置API基础URL（向后兼容，但建议直接修改ApiConfig）
     * @deprecated 建议直接修改ApiConfig.ts中的配置
     */
    public setApiBaseUrl(url: string): void {
        warn('setApiBaseUrl方法已过时，建议直接修改ApiConfig.ts中的配置');
        log('当前API基础URL:', ApiConfig.getBaseUrl());
    }

    /**
     * 检查微信是否已安装
     */
    public isWeChatInstalled(): Promise<boolean> {
        return new Promise((resolve) => {
            // 在实际项目中，可以添加检查微信安装状态的原生接口
            // 这里简化处理，总是返回true
            log('检查微信安装状态（模拟返回true）');
            resolve(true);
        });
    }

    /**
     * 取消当前登录请求
     */
    public cancelLogin(): void {
        log('=== 取消微信登录请求 ===');
        if (this.loginCallback) {
            this.loginCallback({
                success: false,
                error: '用户取消登录'
            });
            this.loginCallback = null;
            log('登录请求已取消');
        } else {
            log('没有进行中的登录请求');
        }
    }
} 