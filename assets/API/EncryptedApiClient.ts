import { _decorator, Component, log, warn, sys } from 'cc';
import CryptoES from 'crypto-es';
import { DeviceInfoCollector, DeviceInfo } from './DeviceInfoCollector';
import { ApiConfig } from './ApiConfig';

const { ccclass, property } = _decorator;

/**
 * 获取版本信息请求参数
 */
export interface GetVersionRequest {
    androidId: string;
    requestId: string;
    timeStamp: string;
    platform: string;
    packageName: string;
    version: number;
}

/**
 * 获取版本信息响应
 */
export interface GetVersionResponse {
    platform: string;
    updateMode: string;
    releaseChannel: string;
    reviewStatus: string;
    versionName: string;
    versionCode: number;
    updateNumber: number;
    packageName: string;
    downloadUrl: string;
    updateDescription: string;
}

/**
 * API响应基础结构
 */
export interface ApiResponse<T> {
    code: number;
    msg: string;  // 服务器返回的是msg而不是message
    data: T;
    // success字段是可选的，因为服务器可能不返回
    success?: boolean;
}

@ccclass('EncryptedApiClient')
export class EncryptedApiClient extends Component {
    
    // 密钥加固存储 - 使用多层编码和混淆（修正后的Base64编码）
    private readonly SECRET_PARTS = [
        'ODtqIWg3WA==', // 8;j!h7X
        'ezJhYjhLMDl2U0UwWnJOMm1BRzY=', // {2ab8K09vSE0ZrN2mAG6
        'XnQzNDVGMTVjNFZZKQ==', // ^t345F15c4VY)
        'Km8uRDlmN019TzFVLXB4cWVITHcrVGt6', // *o.D9f7M}O1U-pxqeHLw+Tkz
    ];
    
    private deviceInfoCollector: DeviceInfoCollector = null;
    
    start() {
        log('EncryptedApiClient 已启动');
        
        // 打印当前配置信息
        ApiConfig.printCurrentConfig();
        
        // 获取设备信息收集器
        this.deviceInfoCollector = this.getComponent(DeviceInfoCollector);
        if (!this.deviceInfoCollector) {
            this.deviceInfoCollector = this.addComponent(DeviceInfoCollector);
        }
    }

    /**
     * 重构密钥 - 将分散的部分重新组合
     */
    private reconstructSecretKey(): string {
        try {
            // 解码并组合各部分
            const parts = this.SECRET_PARTS.map(part => {
                return CryptoES.enc.Base64.parse(part).toString(CryptoES.enc.Utf8);
            });
            
            // 组合密钥
            const secretKey = parts.join('');
            
            // 额外的混淆处理 - 在运行时做一些变换
            const timestamp = Date.now().toString();
            const obfuscated = CryptoES.SHA256(secretKey + timestamp.slice(-3)).toString();
            
            // 返回原始密钥（这里只是做了一些干扰操作）
            return secretKey;
        } catch (error) {
            warn('密钥重构失败:', error);
            return '';
        }
    }

    /**
     * 生成请求ID
     */
    private generateRequestId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `${timestamp}_${random}`;
    }

    /**
     * 生成HmacSHA256签名
     * @param data 要签名的数据
     * @returns 签名字符串
     */
    private generateSignature(data: any): string {
        try {
            // 将数据转换为JSON字符串
            const jsonString = JSON.stringify(data);
            log('待签名的JSON字符串:', jsonString);
            
            // 获取密钥
            const secretKey = this.reconstructSecretKey();
            if (!secretKey) {
                throw new Error('无法获取密钥');
            }
            
            // 使用HmacSHA256生成签名
            const signature = CryptoES.HmacSHA256(jsonString, secretKey).toString(CryptoES.enc.Hex);
            log('生成的签名:', signature);
            
            return signature;
        } catch (error) {
            warn('生成签名失败:', error);
            return '';
        }
    }

    /**
     * 验证时间戳是否在有效期内（3分钟）
     * @param timestamp 时间戳（毫秒）
     */
    private isTimestampValid(timestamp: number): boolean {
        const now = Date.now();
        const diff = Math.abs(now - timestamp);
        const threeMinutes = 3 * 60 * 1000; // 3分钟的毫秒数
        return diff <= threeMinutes;
    }

    /**
     * 发送带签名的HTTP请求
     * @param endpoint API端点
     * @param data 请求数据
     * @returns Promise<响应数据>
     */
    private async sendSignedRequest<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        return new Promise((resolve, reject) => {
            try {
                // 生成签名
                const signature = this.generateSignature(data);
                if (!signature) {
                    reject(new Error('签名生成失败'));
                    return;
                }

                const xhr = new XMLHttpRequest();
                const url = ApiConfig.getFullUrl(endpoint);
                
                xhr.timeout = ApiConfig.getTimeout();
                xhr.ontimeout = () => {
                    reject(new Error('请求超时'));
                };
                
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const response = JSON.parse(xhr.responseText);
                                resolve(response);
                            } catch (parseError) {
                                reject(new Error('响应解析失败: ' + parseError));
                            }
                        } else {
                            reject(new Error(`HTTP错误: ${xhr.status} - ${xhr.statusText}`));
                        }
                    }
                };
                
                xhr.onerror = () => {
                    reject(new Error('网络请求失败'));
                };
                
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.setRequestHeader('sign', signature); // 添加签名到请求头
                
                log('发送请求到:', url);
                
                xhr.send(JSON.stringify(data));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 获取版本信息
     * @returns Promise<版本信息>
     */
    public async getVersion(): Promise<GetVersionResponse> {
        try {
            log('开始获取版本信息...');

            // 收集设备信息
            let deviceInfo: DeviceInfo = null;
            if (this.deviceInfoCollector) {
                deviceInfo = await this.deviceInfoCollector.collectDeviceInfo();
            }

            // 准备请求参数
            const requestData: GetVersionRequest = {
                androidId: deviceInfo?.androidId || '',
                requestId: this.generateRequestId(),
                timeStamp: Date.now().toString(),
                platform: this.getPlatform(),
                packageName: ApiConfig.getPackageName(),
                version: ApiConfig.getCurrentVersion()
            };

            // 验证时间戳
            if (!this.isTimestampValid(parseInt(requestData.timeStamp))) {
                warn('时间戳可能无效，但继续请求');
            }

            log('请求参数:', requestData);

            // 发送请求
            const response = await this.sendSignedRequest<GetVersionResponse>(ApiConfig.ENDPOINTS.GET_VERSION, requestData);
            
            // 使用ApiConfig判断响应是否成功
            if (ApiConfig.isResponseSuccess(response.code) && response.data) {
                log('版本信息获取成功:', response.data);
                return response.data;
            } else {
                throw new Error(response.msg || '获取版本信息失败');
            }
        } catch (error) {
            warn('获取版本信息失败:', error);
            throw error;
        }
    }

    /**
     * 获取当前平台
     */
    private getPlatform(): string {
        switch (sys.platform) {
            case sys.Platform.ANDROID:
                return 'android';
            case sys.Platform.IOS:
                return 'ios';
            default:
                return 'android'; // 默认返回android
        }
    }

    /**
     * 获取当前API配置信息
     */
    public getCurrentConfig(): object {
        return {
            environment: ApiConfig.getCurrentEnvironment(),
            packageName: ApiConfig.getPackageName(),
            version: ApiConfig.getCurrentVersion(),
            versionName: ApiConfig.getVersionName()
        };
    }

    /**
     * 获取API基础URL（向后兼容）
     */
    public getApiBaseUrl(): string {
        return ApiConfig.getBaseUrl();
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
     * 设置包名（向后兼容，但建议直接修改ApiConfig）
     * @deprecated 建议直接修改ApiConfig.ts中的配置
     */
    public setPackageName(packageName: string): void {
        warn('setPackageName方法已过时，建议直接修改ApiConfig.ts中的配置');
        log('当前包名:', ApiConfig.getPackageName());
    }

    /**
     * 设置当前版本号（向后兼容，但建议直接修改ApiConfig）
     * @deprecated 建议直接修改ApiConfig.ts中的配置
     */
    public setCurrentVersion(version: number): void {
        warn('setCurrentVersion方法已过时，建议直接修改ApiConfig.ts中的配置');
        log('当前版本号:', ApiConfig.getCurrentVersion());
    }
} 