import { _decorator, Component, Node, Button, Label, log, warn } from 'cc';
import { WeChatLogin, WeChatLoginResult } from './WeChatLogin';
import { ApiConfig } from './ApiConfig';

const { ccclass, property } = _decorator;

/**
 * 微信登录示例
 * 演示如何使用WeChatLogin组件进行微信登录
 */
@ccclass('WeChatLoginExample')
export class WeChatLoginExample extends Component {

    @property(Button)
    loginButton: Button = null;

    @property(Button)
    checkInstallButton: Button = null;

    @property(Button)
    showConfigButton: Button = null;

    @property(Label)
    statusLabel: Label = null;

    @property(Label)
    userInfoLabel: Label = null;

    private weChatLogin: WeChatLogin = null;

    start() {
        // 获取或添加微信登录组件
        this.weChatLogin = this.getComponent(WeChatLogin);
        if (!this.weChatLogin) {
            this.weChatLogin = this.addComponent(WeChatLogin);
        }

        // 绑定按钮事件
        if (this.loginButton) {
            this.loginButton.node.on(Button.EventType.CLICK, this.onLoginButtonClick, this);
        }

        if (this.checkInstallButton) {
            this.checkInstallButton.node.on(Button.EventType.CLICK, this.onCheckInstallClick, this);
        }

        if (this.showConfigButton) {
            this.showConfigButton.node.on(Button.EventType.CLICK, this.onShowConfigClick, this);
        }

        this.updateStatus('微信登录示例已准备就绪');
        this.showCurrentEnvironment();
        log('微信登录示例组件已启动');
    }

    /**
     * 显示当前环境信息
     */
    private showCurrentEnvironment(): void {
        const env = ApiConfig.getCurrentEnvironment();
        log(`当前环境: ${env.name} - ${env.description}`);
        log(`API地址: ${env.baseUrl}`);
    }

    /**
     * 微信登录按钮点击事件
     */
    private async onLoginButtonClick(): Promise<void> {
        try {
            this.updateStatus('正在发起微信登录...');
            this.setLoginButtonEnabled(false);
            
            // 清空之前的用户信息
            this.updateUserInfo('');

            // 发起微信登录
            const result: WeChatLoginResult = await this.weChatLogin.login();

            if (result.success) {
                this.updateStatus('微信登录成功！');
                this.displayUserInfo(result);
                log('微信登录成功:', result);
            } else {
                this.updateStatus(`微信登录失败: ${result.error}`);
                warn('微信登录失败:', result.error);
            }

        } catch (error) {
            const errorMsg = `微信登录异常: ${error.message}`;
            this.updateStatus(errorMsg);
            warn(errorMsg, error);
        } finally {
            this.setLoginButtonEnabled(true);
        }
    }

    /**
     * 检查微信安装状态按钮点击事件
     */
    private async onCheckInstallClick(): Promise<void> {
        try {
            this.updateStatus('正在检查微信安装状态...');
            
            const isInstalled = await this.weChatLogin.isWeChatInstalled();
            
            if (isInstalled) {
                this.updateStatus('微信已安装，可以进行登录');
            } else {
                this.updateStatus('微信未安装，请先安装微信客户端');
            }

        } catch (error) {
            const errorMsg = `检查微信安装状态失败: ${error.message}`;
            this.updateStatus(errorMsg);
            warn(errorMsg, error);
        }
    }

    /**
     * 显示配置信息按钮点击事件
     */
    private onShowConfigClick(): void {
        // 打印配置信息到控制台
        ApiConfig.printCurrentConfig();
        
        // 显示在界面上
        const config = this.weChatLogin.getCurrentConfig();
        let configInfo = '当前配置信息:\n';
        configInfo += `环境: ${ApiConfig.getCurrentEnvironment().name}\n`;
        configInfo += `API地址: ${ApiConfig.getBaseUrl()}\n`;
        configInfo += `微信AppID: ${ApiConfig.getWeChatAppId()}\n`;
        configInfo += `发布渠道: ${ApiConfig.getReleaseChannel()}\n`;
        configInfo += `包名: ${ApiConfig.getPackageName()}\n`;
        configInfo += `超时时间: ${ApiConfig.getTimeout()}ms\n`;
        configInfo += `应用版本: ${ApiConfig.getVersionName()}`;
        
        this.updateUserInfo(configInfo);
        this.updateStatus('配置信息已显示');
    }

    /**
     * 显示用户信息
     */
    private displayUserInfo(result: WeChatLoginResult): void {
        let userInfo = '登录信息:\n';
        
        if (result.openid) {
            userInfo += `OpenID: ${result.openid}\n`;
        }
        
        if (result.access_token) {
            // 只显示token的前几位，保护敏感信息
            const shortToken = result.access_token.length > 20 
                ? result.access_token.substring(0, 20) + '...' 
                : result.access_token;
            userInfo += `Access Token: ${shortToken}\n`;
        }
        
        if (result.expire_in) {
            const expireDate = new Date(Date.now() + result.expire_in * 1000);
            userInfo += `过期时间: ${expireDate.toLocaleString()}\n`;
        }
        
        if (result.client_id) {
            userInfo += `Client ID: ${result.client_id}\n`;
        }

        if (result.code) {
            userInfo += `微信Code: ${result.code}\n`;
        }

        userInfo += `\n登录配置:`;
        userInfo += `\n环境: ${ApiConfig.getCurrentEnvironment().name}`;
        userInfo += `\n发布渠道: ${ApiConfig.getReleaseChannel()}`;
        userInfo += `\n包名: ${ApiConfig.getPackageName()}`;

        this.updateUserInfo(userInfo);
    }

    /**
     * 更新状态显示
     */
    private updateStatus(text: string): void {
        if (this.statusLabel) {
            this.statusLabel.string = text;
        }
        log(`状态更新: ${text}`);
    }

    /**
     * 更新用户信息显示
     */
    private updateUserInfo(text: string): void {
        if (this.userInfoLabel) {
            this.userInfoLabel.string = text;
        }
    }

    /**
     * 设置登录按钮可用状态
     */
    private setLoginButtonEnabled(enabled: boolean): void {
        if (this.loginButton) {
            this.loginButton.interactable = enabled;
            
            // 更新按钮文本
            const buttonLabel = this.loginButton.getComponentInChildren(Label);
            if (buttonLabel) {
                buttonLabel.string = enabled ? '微信登录' : '登录中...';
            }
        }
    }

    /**
     * 取消登录
     */
    public cancelLogin(): void {
        if (this.weChatLogin) {
            this.weChatLogin.cancelLogin();
            this.updateStatus('已取消微信登录');
            this.setLoginButtonEnabled(true);
        }
    }

    /**
     * 清除用户信息
     */
    public clearUserInfo(): void {
        this.updateUserInfo('');
        this.updateStatus('已清除用户信息');
    }

    /**
     * 获取当前环境信息
     */
    public getCurrentEnvironmentInfo(): string {
        const env = ApiConfig.getCurrentEnvironment();
        return `${env.name} - ${env.description} (${env.baseUrl})`;
    }
} 