import { _decorator, Component, Node, Button, Label, log, warn } from 'cc';
import { LoginService, LoginResponse } from './LoginService';

const { ccclass, property } = _decorator;

/**
 * LoginService 使用示例
 * 演示如何使用登录服务进行游客登录和微信登录
 */
@ccclass('LoginServiceExample')
export class LoginServiceExample extends Component {

    @property(Button)
    guestLoginButton: Button = null;

    @property(Button)
    wechatLoginButton: Button = null;

    @property(Button)
    autoLoginButton: Button = null;

    @property(Button)
    logoutButton: Button = null;

    @property(Button)
    checkTokenButton: Button = null;

    @property(Label)
    statusLabel: Label = null;

    @property(Label)
    userInfoLabel: Label = null;

    @property(Label)
    tokenLabel: Label = null;

    private loginService: LoginService = null;

    start() {
        log('LoginServiceExample 开始初始化');

        // 获取或创建 LoginService 组件
        this.loginService = this.getComponent(LoginService);
        if (!this.loginService) {
            this.loginService = this.addComponent(LoginService);
        }

        // 绑定按钮事件
        this.bindButtonEvents();

        // 初始化UI状态
        this.updateUI('准备就绪，点击按钮进行登录测试');

        log('LoginServiceExample 初始化完成');
    }

    /**
     * 绑定按钮事件
     */
    private bindButtonEvents(): void {
        if (this.guestLoginButton) {
            this.guestLoginButton.node.on('click', this.onGuestLogin, this);
        }

        if (this.wechatLoginButton) {
            this.wechatLoginButton.node.on('click', this.onWeChatLogin, this);
        }

        if (this.autoLoginButton) {
            this.autoLoginButton.node.on('click', this.onAutoLogin, this);
        }

        if (this.logoutButton) {
            this.logoutButton.node.on('click', this.onLogout, this);
        }

        if (this.checkTokenButton) {
            this.checkTokenButton.node.on('click', this.onCheckToken, this);
        }
    }

    /**
     * 游客登录按钮点击事件
     */
    private async onGuestLogin(): Promise<void> {
        try {
            this.updateUI('正在进行游客登录...');
            log('开始游客登录测试');

            const loginResponse = await this.loginService.performGuestLoginWithMockData();
            
            this.handleLoginSuccess(loginResponse, '游客登录成功');

        } catch (error) {
            this.handleLoginError(error, '游客登录失败');
        }
    }

    /**
     * 微信登录按钮点击事件
     */
    private async onWeChatLogin(): Promise<void> {
        try {
            this.updateUI('正在进行微信登录...');
            log('开始微信登录测试');

            const loginResponse = await this.loginService.performWeChatLoginWithMockData();
            
            this.handleLoginSuccess(loginResponse, '微信登录成功');

        } catch (error) {
            this.handleLoginError(error, '微信登录失败');
        }
    }

    /**
     * 自动登录按钮点击事件
     */
    private async onAutoLogin(): Promise<void> {
        try {
            this.updateUI('正在进行自动登录...');
            log('开始自动登录测试');

            const loginResponse = await this.loginService.performAutoLogin();
            
            this.handleLoginSuccess(loginResponse, '自动登录成功');

        } catch (error) {
            this.handleLoginError(error, '自动登录失败');
        }
    }

    /**
     * 登出按钮点击事件
     */
    private onLogout(): void {
        try {
            this.loginService.clearToken();
            this.updateUI('已登出');
            this.clearUserInfo();
            this.clearTokenInfo();
            log('用户已登出');

        } catch (error) {
            warn('登出失败:', error);
            this.updateUI('登出失败: ' + error.message);
        }
    }

    /**
     * 检查Token按钮点击事件
     */
    private onCheckToken(): void {
        try {
            const isValid = this.loginService.isTokenValid();
            const currentToken = this.loginService.getCurrentToken();
            const remainingTime = this.loginService.getTokenRemainingTime();

            if (isValid) {
                this.updateUI(`Token有效，剩余时间: ${remainingTime}秒`);
                this.updateTokenInfo(currentToken, remainingTime);
            } else {
                this.updateUI('Token已失效或不存在');
                this.clearTokenInfo();
            }

            log('Token状态检查完成:', { isValid, remainingTime });

        } catch (error) {
            warn('Token检查失败:', error);
            this.updateUI('Token检查失败: ' + error.message);
        }
    }

    /**
     * 处理登录成功
     */
    private handleLoginSuccess(loginResponse: LoginResponse, successMessage: string): void {
        this.updateUI(successMessage);
        this.updateUserInfo(loginResponse);
        this.updateTokenInfo(loginResponse.access_token, loginResponse.expire_in);

        log(successMessage, {
            openid: loginResponse.openid,
            nickname: loginResponse.wechatNickname,
            isRealName: loginResponse.isRealName
        });
    }

    /**
     * 处理登录失败
     */
    private handleLoginError(error: any, errorMessage: string): void {
        warn(errorMessage, error);
        this.updateUI(`${errorMessage}: ${error.message || error}`);
        this.clearUserInfo();
        this.clearTokenInfo();
    }

    /**
     * 更新状态显示
     */
    private updateUI(status: string): void {
        if (this.statusLabel) {
            this.statusLabel.string = `状态: ${status}`;
        }
        log('UI状态更新:', status);
    }

    /**
     * 更新用户信息显示
     */
    private updateUserInfo(loginResponse: LoginResponse): void {
        if (this.userInfoLabel) {
            const userInfo = [
                `OpenID: ${loginResponse.openid || '未设置'}`,
                `昵称: ${loginResponse.wechatNickname || '游客'}`,
                `头像: ${loginResponse.wechatAvatar ? '已设置' : '未设置'}`,
                `实名认证: ${loginResponse.isRealName ? '已认证' : '未认证'}`,
                `应用ID: ${loginResponse.client_id || '未设置'}`
            ];
            this.userInfoLabel.string = userInfo.join('\n');
        }
    }

    /**
     * 更新Token信息显示
     */
    private updateTokenInfo(token: string, expireTime: number): void {
        if (this.tokenLabel) {
            const tokenInfo = [
                `Token: ${token ? token.substring(0, 20) + '...' : '无'}`,
                `有效期: ${expireTime}秒`,
                `过期时间: ${new Date(Date.now() + expireTime * 1000).toLocaleString()}`
            ];
            this.tokenLabel.string = tokenInfo.join('\n');
        }
    }

    /**
     * 清除用户信息显示
     */
    private clearUserInfo(): void {
        if (this.userInfoLabel) {
            this.userInfoLabel.string = '用户信息: 未登录';
        }
    }

    /**
     * 清除Token信息显示
     */
    private clearTokenInfo(): void {
        if (this.tokenLabel) {
            this.tokenLabel.string = 'Token信息: 无';
        }
    }

    /**
     * 定时检查Token状态
     */
    protected update(dt: number): void {
        // 每5秒检查一次Token状态（可选功能）
        if (this.loginService && this.loginService.getCurrentToken()) {
            const remainingTime = this.loginService.getTokenRemainingTime();
            
            // 如果Token即将过期（剩余时间少于60秒），更新显示
            if (remainingTime > 0 && remainingTime < 60) {
                this.updateTokenInfo(this.loginService.getCurrentToken(), remainingTime);
                
                // 如果剩余时间少于10秒，发出警告
                if (remainingTime < 10) {
                    this.updateUI(`警告: Token即将在${remainingTime}秒后过期`);
                }
            }
        }
    }

    onDestroy() {
        // 清理按钮事件
        if (this.guestLoginButton && this.guestLoginButton.node) {
            this.guestLoginButton.node.off('click', this.onGuestLogin, this);
        }
        if (this.wechatLoginButton && this.wechatLoginButton.node) {
            this.wechatLoginButton.node.off('click', this.onWeChatLogin, this);
        }
        if (this.autoLoginButton && this.autoLoginButton.node) {
            this.autoLoginButton.node.off('click', this.onAutoLogin, this);
        }
        if (this.logoutButton && this.logoutButton.node) {
            this.logoutButton.node.off('click', this.onLogout, this);
        }
        if (this.checkTokenButton && this.checkTokenButton.node) {
            this.checkTokenButton.node.off('click', this.onCheckToken, this);
        }
    }
} 