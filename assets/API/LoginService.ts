import { _decorator, Component, log, warn, sys } from 'cc';
import { DeviceInfoCollector, DeviceInfo } from './DeviceInfoCollector';
import { EncryptedApiClient, ApiResponse } from './EncryptedApiClient';
import { ApiConfig } from './ApiConfig';

const { ccclass, property } = _decorator;

/**
 * 登录请求参数（LoginDto）
 */
export interface LoginRequest {
    androidId: string;
    deviceId: string;
    requestId: string;
    timeStamp: number;
    packageName?: string;
    code?: string; // 微信登录的code，有就是微信登录，无就是游客登录
    releaseChannel?: string;
}

/**
 * 登录响应数据（BaseLoginVo）
 */
export interface LoginResponse {
    openid: string;
    wechatNickname: string;
    wechatAvatar: string;
    isRealName: boolean;
    access_token: string;
    expire_in: number;
    client_id: string;
}

/**
 * 登录类型枚举
 */
export enum LoginType {
    GUEST = 'guest',    // 游客登录
    WECHAT = 'wechat'   // 微信登录
}

@ccclass('LoginService')
export class LoginService extends Component {
    
    private deviceInfoCollector: DeviceInfoCollector = null;
    private apiClient: EncryptedApiClient = null;
    private currentToken: string = '';
    private tokenExpireTime: number = 0;

    // 登录API端点
    private readonly LOGIN_ENDPOINT = '/base/login';

    start() {
        log('LoginService 已启动');
        
        // 获取设备信息收集器
        this.deviceInfoCollector = this.getComponent(DeviceInfoCollector);
        if (!this.deviceInfoCollector) {
            this.deviceInfoCollector = this.addComponent(DeviceInfoCollector);
        }
        
        // 获取API客户端
        this.apiClient = this.getComponent(EncryptedApiClient);
        if (!this.apiClient) {
            this.apiClient = this.addComponent(EncryptedApiClient);
        }
    }

    /**
     * 生成请求ID
     */
    private generateRequestId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `login_${timestamp}_${random}`;
    }

    /**
     * 构建登录请求数据
     */
    private async buildLoginRequest(deviceInfo: DeviceInfo, loginType: LoginType, wechatCode?: string): Promise<LoginRequest> {
        return {
            // 必填字段
            androidId: deviceInfo.androidId || this.generateMockAndroidId(),
            deviceId: '13974751124', // 固定使用指定的设备ID
            requestId: this.generateRequestId(),
            timeStamp: Date.now(),
            
            // 可选字段
            packageName: ApiConfig.getPackageName(),
            code: loginType === LoginType.WECHAT ? (wechatCode || this.generateMockWeChatCode()) : '', // 游客登录传空字符串
            releaseChannel: ApiConfig.getReleaseChannel()
        };
    }

    /**
     * 生成模拟Android ID
     */
    private generateMockAndroidId(): string {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    /**
     * 生成模拟微信登录码
     */
    private generateMockWeChatCode(): string {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    /**
     * 执行游客登录
     */
    public async performGuestLogin(): Promise<LoginResponse> {
        try {
            log('开始执行游客登录...');
            
            // 获取设备信息
            const deviceInfo = await this.deviceInfoCollector.collectDeviceInfo();
            log('设备信息收集完成:', deviceInfo);
            
            // 构建请求数据
            const requestData = await this.buildLoginRequest(deviceInfo, LoginType.GUEST);
            log('游客登录请求数据:', JSON.stringify(requestData));
            
            // 发送请求
            const response = await this.sendLoginRequest(requestData);
            
            // 保存token信息
            this.saveTokenInfo(response.data);
            
            log('游客登录成功:', response);
            return response.data;
            
        } catch (error) {
            warn('游客登录失败:', error);
            throw error;
        }
    }

    /**
     * 执行微信登录
     */
    public async performWeChatLogin(wechatCode?: string): Promise<LoginResponse> {
        try {
            log('开始执行微信登录...');
            
            // 获取设备信息
            const deviceInfo = await this.deviceInfoCollector.collectDeviceInfo();
            log('设备信息收集完成:', deviceInfo);
            
            // 构建请求数据
            const requestData = await this.buildLoginRequest(deviceInfo, LoginType.WECHAT, wechatCode);
            log('微信登录请求数据:', JSON.stringify(requestData));
            
            // 发送请求
            const response = await this.sendLoginRequest(requestData);
            
            // 保存token信息
            this.saveTokenInfo(response.data);
            
            log('微信登录成功:', response);
            return response.data;
            
        } catch (error) {
            warn('微信登录失败:', error);
            throw error;
        }
    }

    /**
     * 使用模拟数据执行游客登录（测试用）
     */
    public async performGuestLoginWithMockData(): Promise<LoginResponse> {
        try {
            log('开始使用模拟数据执行游客登录...');
            
            // 构建模拟请求数据
            const mockRequestData: LoginRequest = {
                androidId: this.generateMockAndroidId(),
                deviceId: '13974751124',
                requestId: this.generateRequestId(),
                timeStamp: Date.now(),
                packageName: ApiConfig.getPackageName(),
                code: '', // 游客登录传空字符串
                releaseChannel: ApiConfig.getReleaseChannel()
            };
            
            log('模拟游客登录请求数据:', JSON.stringify(mockRequestData));
            
            // 发送请求
            const response = await this.sendLoginRequest(mockRequestData);
            
            // 保存token信息
            this.saveTokenInfo(response.data);
            
            log('模拟游客登录成功:', response);
            return response.data;
            
        } catch (error) {
            warn('模拟游客登录失败:', error);
            throw error;
        }
    }

    /**
     * 使用模拟数据执行微信登录（测试用）
     */
    public async performWeChatLoginWithMockData(): Promise<LoginResponse> {
        try {
            log('开始使用模拟数据执行微信登录...');
            
            // 构建模拟请求数据
            const mockRequestData: LoginRequest = {
                androidId: this.generateMockAndroidId(),
                deviceId: '13974751124',
                requestId: this.generateRequestId(),
                timeStamp: Date.now(),
                packageName: ApiConfig.getPackageName(),
                code: this.generateMockWeChatCode(), // 模拟微信登录码
                releaseChannel: ApiConfig.getReleaseChannel()
            };
            
            log('模拟微信登录请求数据:', JSON.stringify(mockRequestData));
            
            // 发送请求
            const response = await this.sendLoginRequest(mockRequestData);
            
            // 保存token信息
            this.saveTokenInfo(response.data);
            
            log('模拟微信登录成功:', response);
            return response.data;
            
        } catch (error) {
            warn('模拟微信登录失败:', error);
            throw error;
        }
    }

    /**
     * 发送登录请求
     */
    private async sendLoginRequest(requestData: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        return new Promise((resolve, reject) => {
            try {
                const xhr = new XMLHttpRequest();
                const url = ApiConfig.getFullUrl(this.LOGIN_ENDPOINT);
                
                xhr.timeout = ApiConfig.getTimeout();
                xhr.ontimeout = () => {
                    reject(new Error('登录请求超时'));
                };
                
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const response = JSON.parse(xhr.responseText);
                                resolve(response);
                            } catch (parseError) {
                                reject(new Error('登录响应解析失败: ' + parseError));
                            }
                        } else {
                            reject(new Error(`登录HTTP错误: ${xhr.status} - ${xhr.statusText}`));
                        }
                    }
                };
                
                xhr.onerror = () => {
                    reject(new Error('登录网络请求失败'));
                };
                
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/json');
                
                log('发送登录请求到:', url);
                log('请求数据:', JSON.stringify(requestData));
                
                xhr.send(JSON.stringify(requestData));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 保存token信息
     */
    private saveTokenInfo(loginResponse: LoginResponse): void {
        this.currentToken = loginResponse.access_token;
        this.tokenExpireTime = Date.now() + (loginResponse.expire_in * 1000);
        
        log('Token已保存:', {
            token: this.currentToken,
            expireTime: new Date(this.tokenExpireTime).toISOString(),
            openid: loginResponse.openid
        });
    }

    /**
     * 获取当前token
     */
    public getCurrentToken(): string {
        return this.currentToken;
    }

    /**
     * 检查token是否有效
     */
    public isTokenValid(): boolean {
        return this.currentToken && Date.now() < this.tokenExpireTime;
    }

    /**
     * 获取token剩余时间（秒）
     */
    public getTokenRemainingTime(): number {
        if (!this.currentToken) return 0;
        const remaining = Math.max(0, this.tokenExpireTime - Date.now());
        return Math.floor(remaining / 1000);
    }

    /**
     * 清除token信息
     */
    public clearToken(): void {
        this.currentToken = '';
        this.tokenExpireTime = 0;
        log('Token已清除');
    }

    /**
     * 自动选择登录方式（如果有微信环境则微信登录，否则游客登录）
     */
    public async performAutoLogin(): Promise<LoginResponse> {
        // 检查是否在微信环境中
        if (this.isWeChatEnvironment()) {
            log('检测到微信环境，使用微信登录');
            return await this.performWeChatLoginWithMockData();
        } else {
            log('非微信环境，使用游客登录');
            return await this.performGuestLoginWithMockData();
        }
    }

    /**
     * 检查是否在微信环境中
     */
    private isWeChatEnvironment(): boolean {
        return sys.platform === sys.Platform.WECHAT_GAME || 
               (typeof window !== 'undefined' && 
                window.navigator && 
                window.navigator.userAgent.toLowerCase().includes('micromessenger'));
    }
} 