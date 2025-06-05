import { _decorator, Component, Label, log, warn, error } from 'cc';
import { ApiConfig } from '../API/ApiConfig';

const { ccclass, property } = _decorator;

/**
 * 账户信息响应数据接口
 */
export interface TgcfDto {
    id: number;
    goldNum: string | number;         // 金币数（后端返回字符串）
    redBagNum: string | number;       // 红包数（后端返回字符串）
    nextRewardTimes: number; // 距离下次奖励次数
    progress: string | null;        // 前端保存的进度
    exp: number | null;             // 经验值
    composeNum: number;      // 合成次数
    level: number;           // 等级
}

export interface GetAccountInfoResponse {
    msg: string;
    code: number;
    data: {
        tgcfDto: TgcfDto;
    };
}

/**
 * 账户信息管理器
 * 用于获取用户的金币和红包数量，并更新到UI显示
 */
@ccclass('AccountInfoManager')
export class AccountInfoManager extends Component {

    @property(Label)
    goldLabel: Label = null;    // 金币数量显示标签

    @property(Label)
    redBagLabel: Label = null;  // 红包数量显示标签

    @property({
        displayName: '自动刷新间隔(秒)',
        tooltip: '设置为0则不自动刷新'
    })
    autoRefreshInterval: number = 0;

    private refreshTimer: number = 0;
    private isRefreshing: boolean = false;
    private accessToken: string = '';  // 存储访问token

    start() {
        // 启动时获取一次账户信息
        this.refreshAccountInfo();
        
        // 如果设置了自动刷新，则启动定时器
        if (this.autoRefreshInterval > 0) {
            this.schedule(this.refreshAccountInfo, this.autoRefreshInterval);
        }

        log('AccountInfoManager 已初始化');
    }

    /**
     * 刷新账户信息
     * 可以从外部调用此方法来手动刷新数据
     */
    public async refreshAccountInfo(): Promise<boolean> {
        if (this.isRefreshing) {
            log('正在刷新中，跳过此次请求');
            return false;
        }

        try {
            this.isRefreshing = true;
            log('开始获取账户信息...');

            const accountInfo = await this.getAccountInfo();
            
            if (accountInfo && accountInfo.code === 200 && accountInfo.data && accountInfo.data.tgcfDto) {
                log('账户信息验证成功，开始更新UI');
                this.updateUI(accountInfo.data.tgcfDto);
                log('账户信息更新成功:', accountInfo.data.tgcfDto);
                return true;
            } else {
                warn('获取到的账户信息格式不正确');
                warn('accountInfo存在:', !!accountInfo);
                if (accountInfo) {
                    warn('accountInfo.code:', accountInfo.code);
                    warn('accountInfo.msg:', accountInfo.msg);
                    warn('accountInfo.data存在:', !!accountInfo.data);
                    warn('accountInfo.data.tgcfDto存在:', !!(accountInfo.data && accountInfo.data.tgcfDto));
                    warn('accountInfo完整内容:', accountInfo);
                }
                return false;
            }

        } catch (err) {
            error('获取账户信息失败:', err);
            this.showErrorOnUI();
            return false;
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * 获取账户信息的API调用
     */
    private async getAccountInfo(): Promise<GetAccountInfoResponse> {
        const url = ApiConfig.getFullUrl(ApiConfig.ENDPOINTS.GET_ACCOUNT_INFO);
        const timeout = ApiConfig.getTimeout();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // 设置超时
            xhr.timeout = timeout;
            
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            log('账户信息API原始响应:', xhr.responseText);
                            const response: GetAccountInfoResponse = JSON.parse(xhr.responseText);
                            log('解析后的账户信息响应:', response);
                            resolve(response);
                        } catch (parseError) {
                            warn('解析响应数据失败:', parseError.message);
                            warn('原始响应内容:', xhr.responseText);
                            reject(new Error(`解析响应数据失败: ${parseError.message}`));
                        }
                    } else {
                        reject(new Error(`HTTP请求失败: ${xhr.status} ${xhr.statusText}`));
                    }
                }
            };

            xhr.onerror = () => {
                reject(new Error('网络请求失败'));
            };

            xhr.ontimeout = () => {
                reject(new Error(`请求超时 (${timeout}ms)`));
            };

            // 发送GET请求
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            
            // 添加认证token到请求头
            if (this.accessToken) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + this.accessToken);
                log('添加Authorization头:', `Bearer ${this.accessToken.substring(0, 10)}...`);
            } else {
                warn('未设置访问token，请先进行微信登录');
            }
            
            xhr.send();
            
            log(`发送API请求: ${url}`);
        });
    }

    /**
     * 更新UI显示
     */
    private updateUI(data: TgcfDto): void {
        // 转换并更新金币数量显示
        const goldNum = this.parseNumberValue(data.goldNum);
        if (this.goldLabel) {
            this.goldLabel.string = this.formatNumber(goldNum);
        }

        // 转换并更新红包数量显示
        const redBagNum = this.parseNumberValue(data.redBagNum);
        if (this.redBagLabel) {
            this.redBagLabel.string = this.formatNumber(redBagNum);
        }

        log(`UI已更新 - 金币: ${goldNum}, 红包: ${redBagNum}, 等级: ${data.level}, 经验: ${data.exp}, 合成次数: ${data.composeNum}`);
    }

    /**
     * 解析数值（支持字符串和数字类型）
     */
    private parseNumberValue(value: string | number): number {
        if (typeof value === 'number') {
            return value;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * 显示错误状态
     */
    private showErrorOnUI(): void {
        if (this.goldLabel) {
            this.goldLabel.string = '--';
        }
        if (this.redBagLabel) {
            this.redBagLabel.string = '--';
        }
    }

    /**
     * 格式化数字显示
     * 可以根据需要自定义数字格式，比如添加逗号分隔符
     */
    private formatNumber(num: number): string {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + 'w';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    /**
     * 设置金币标签
     */
    public setGoldLabel(label: Label): void {
        this.goldLabel = label;
    }

    /**
     * 设置红包标签
     */
    public setRedBagLabel(label: Label): void {
        this.redBagLabel = label;
    }

    /**
     * 获取当前金币数量
     */
    public getCurrentGoldNum(): string {
        return this.goldLabel ? this.goldLabel.string : '0';
    }

    /**
     * 获取当前红包数量
     */
    public getCurrentRedBagNum(): string {
        return this.redBagLabel ? this.redBagLabel.string : '0';
    }

    /**
     * 启用自动刷新
     */
    public enableAutoRefresh(intervalSeconds: number): void {
        this.disableAutoRefresh(); // 先停止之前的定时器
        
        if (intervalSeconds > 0) {
            this.autoRefreshInterval = intervalSeconds;
            this.schedule(this.refreshAccountInfo, intervalSeconds);
            log(`启用自动刷新，间隔: ${intervalSeconds}秒`);
        }
    }

    /**
     * 禁用自动刷新
     */
    public disableAutoRefresh(): void {
        this.unschedule(this.refreshAccountInfo);
        log('已禁用自动刷新');
    }

    /**
     * 检查是否正在刷新
     */
    public isCurrentlyRefreshing(): boolean {
        return this.isRefreshing;
    }

    /**
     * 设置访问token
     * @param token 从微信登录获取的access_token
     */
    public setAccessToken(token: string): void {
        this.accessToken = token;
        log('访问token已设置:', token ? `${token.substring(0, 10)}...` : '空token');
    }

    /**
     * 获取当前的访问token
     */
    public getAccessToken(): string {
        return this.accessToken;
    }

    /**
     * 清除访问token
     */
    public clearAccessToken(): void {
        this.accessToken = '';
        log('访问token已清除');
    }

    /**
     * 检查是否已设置token
     */
    public hasAccessToken(): boolean {
        return !!this.accessToken;
    }

    onDestroy() {
        // 清理定时器
        this.disableAutoRefresh();
    }
} 