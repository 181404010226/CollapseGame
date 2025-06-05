import { _decorator, Component, Node, Button, Label, log, warn } from 'cc';
import { AccountInfoManager } from './AccountInfoManager';
import { WeChatLogin, WeChatLoginResult } from '../API/WeChatLogin';

const { ccclass, property } = _decorator;

/**
 * 账户信息管理示例
 * 演示如何在微信登录后获取并显示账户信息
 */
@ccclass('AccountInfoExample')
export class AccountInfoExample extends Component {

    @property(Button)
    loginAndRefreshButton: Button = null;

    @property(Button)
    refreshOnlyButton: Button = null;

    @property(Label)
    goldLabel: Label = null;

    @property(Label)
    redBagLabel: Label = null;

    @property(Label)
    statusLabel: Label = null;

    private accountInfoManager: AccountInfoManager = null;
    private weChatLogin: WeChatLogin = null;

    start() {
        // 获取或添加组件
        this.accountInfoManager = this.getComponent(AccountInfoManager);
        if (!this.accountInfoManager) {
            this.accountInfoManager = this.addComponent(AccountInfoManager);
        }

        this.weChatLogin = this.getComponent(WeChatLogin);
        if (!this.weChatLogin) {
            this.weChatLogin = this.addComponent(WeChatLogin);
        }

        // 设置AccountInfoManager的Label引用
        if (this.goldLabel && this.redBagLabel) {
            this.accountInfoManager.setGoldLabel(this.goldLabel);
            this.accountInfoManager.setRedBagLabel(this.redBagLabel);
        }

        // 绑定按钮事件
        if (this.loginAndRefreshButton) {
            this.loginAndRefreshButton.node.on(Button.EventType.CLICK, this.onLoginAndRefreshClick, this);
        }

        if (this.refreshOnlyButton) {
            this.refreshOnlyButton.node.on(Button.EventType.CLICK, this.onRefreshOnlyClick, this);
        }

        this.updateStatus('账户信息示例已准备就绪');
        log('AccountInfoExample 已初始化');
    }

    /**
     * 微信登录并刷新账户信息
     */
    private async onLoginAndRefreshClick(): Promise<void> {
        try {
            this.updateStatus('正在进行微信登录...');
            this.setButtonsEnabled(false);

            // 先进行微信登录
            const loginResult: WeChatLoginResult = await this.weChatLogin.login();

            if (loginResult.success) {
                this.updateStatus('微信登录成功，正在获取账户信息...');
                log('微信登录成功:', loginResult);

                // 设置访问token
                if (loginResult.access_token) {
                    this.accountInfoManager.setAccessToken(loginResult.access_token);
                    log('已设置访问token');
                } else {
                    warn('微信登录响应中未包含access_token');
                }

                // 登录成功后刷新账户信息
                const refreshSuccess = await this.accountInfoManager.refreshAccountInfo();
                
                if (refreshSuccess) {
                    this.updateStatus('账户信息已更新');
                } else {
                    this.updateStatus('获取账户信息失败');
                }
            } else {
                this.updateStatus(`微信登录失败: ${loginResult.error}`);
                warn('微信登录失败:', loginResult.error);
            }

        } catch (error) {
            const errorMsg = `操作失败: ${error.message}`;
            this.updateStatus(errorMsg);
            warn(errorMsg, error);
        } finally {
            this.setButtonsEnabled(true);
        }
    }

    /**
     * 仅刷新账户信息（不进行微信登录）
     */
    private async onRefreshOnlyClick(): Promise<void> {
        try {
            // 检查是否已设置token
            if (!this.accountInfoManager.hasAccessToken()) {
                this.updateStatus('未设置访问token，请先进行微信登录');
                return;
            }

            this.updateStatus('正在刷新账户信息...');
            this.setButtonsEnabled(false);

            const success = await this.accountInfoManager.refreshAccountInfo();
            
            if (success) {
                this.updateStatus('账户信息刷新成功');
            } else {
                this.updateStatus('账户信息刷新失败');
            }

        } catch (error) {
            const errorMsg = `刷新失败: ${error.message}`;
            this.updateStatus(errorMsg);
            warn(errorMsg, error);
        } finally {
            this.setButtonsEnabled(true);
        }
    }

    /**
     * 更新状态显示
     */
    private updateStatus(text: string): void {
        if (this.statusLabel) {
            this.statusLabel.string = text;
        }
        log(`状态: ${text}`);
    }

    /**
     * 设置按钮可用状态
     */
    private setButtonsEnabled(enabled: boolean): void {
        if (this.loginAndRefreshButton) {
            this.loginAndRefreshButton.interactable = enabled;
        }
        if (this.refreshOnlyButton) {
            this.refreshOnlyButton.interactable = enabled;
        }
    }

    /**
     * 启用自动刷新账户信息
     * @param intervalSeconds 刷新间隔（秒）
     */
    public enableAutoRefresh(intervalSeconds: number = 60): void {
        if (this.accountInfoManager) {
            this.accountInfoManager.enableAutoRefresh(intervalSeconds);
            this.updateStatus(`已启用自动刷新 (${intervalSeconds}秒间隔)`);
        }
    }

    /**
     * 禁用自动刷新
     */
    public disableAutoRefresh(): void {
        if (this.accountInfoManager) {
            this.accountInfoManager.disableAutoRefresh();
            this.updateStatus('已禁用自动刷新');
        }
    }

    /**
     * 获取当前显示的金币和红包数量
     */
    public getCurrentDisplayValues(): { gold: string, redBag: string } {
        return {
            gold: this.accountInfoManager ? this.accountInfoManager.getCurrentGoldNum() : '0',
            redBag: this.accountInfoManager ? this.accountInfoManager.getCurrentRedBagNum() : '0'
        };
    }

    /**
     * 手动设置Label引用（如果需要动态设置）
     */
    public setLabels(goldLabel: Label, redBagLabel: Label): void {
        this.goldLabel = goldLabel;
        this.redBagLabel = redBagLabel;
        
        if (this.accountInfoManager) {
            this.accountInfoManager.setGoldLabel(goldLabel);
            this.accountInfoManager.setRedBagLabel(redBagLabel);
        }
        
        log('Label引用已更新');
    }

    /**
     * 手动设置访问token
     * @param token 访问token
     */
    public setAccessToken(token: string): void {
        if (this.accountInfoManager) {
            this.accountInfoManager.setAccessToken(token);
            this.updateStatus('访问token已设置');
        }
    }

    /**
     * 清除访问token
     */
    public clearAccessToken(): void {
        if (this.accountInfoManager) {
            this.accountInfoManager.clearAccessToken();
            this.updateStatus('访问token已清除');
        }
    }

    /**
     * 检查是否已设置token
     */
    public hasAccessToken(): boolean {
        return this.accountInfoManager ? this.accountInfoManager.hasAccessToken() : false;
    }
} 