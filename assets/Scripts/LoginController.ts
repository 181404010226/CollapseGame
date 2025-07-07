import { _decorator, Component, Node, Button, Label, Toggle, Sprite, UIOpacity, SpriteFrame, resources, TextAsset, director, game } from 'cc';
import { AgreementDialogController } from './AgreementDialogController';
import { WeChatLogin, WeChatLoginResult } from '../API/WeChatLogin';
import { PangleAd } from '../API/PangleAdManager';
import { ApiConfig, UserData } from '../API/ApiConfig';
import { LoginService, LoginResponse } from '../API/LoginService';
import { RewardDisplayController } from './RewardDisplayController';
const { ccclass, property } = _decorator;

@ccclass('LoginController')
export class LoginController extends Component {
    
    @property(Node)
    agreeCheckboxNode: Node = null;  // 选择勾选框
    
    @property(Button)
    wechatLoginBtn: Button = null;  // 微信登录按钮
    
    @property(Button)
    guestLoginBtn: Button = null;  // 游客登录按钮
    
    @property(Button)
    userAgreementBtn: Button = null;  // 用户登录协议按钮
    
    @property(Button)
    privacyAgreementBtn: Button = null;  // 隐私协议按钮
    
    @property(Sprite)
    checkboxSprite: Sprite = null;  // 勾选框Sprite组件
    
    @property(SpriteFrame)
    checkedSprite: SpriteFrame = null;  // 选中状态图片
    
    @property(SpriteFrame)
    uncheckedSprite: SpriteFrame = null;  // 未选中状态图片
    
    @property(AgreementDialogController)
    agreementDialogController: AgreementDialogController = null;  // 协议弹窗控制器
    
    @property(WeChatLogin)
    weChatLogin: WeChatLogin = null;  // 微信登录组件
    
    @property({ type: String, tooltip: "成功登录后跳转的场景名称" })
    targetSceneName: string = "";  // 登录成功后跳转的场景
    
    // 协议是否同意状态
    private isAgreed: boolean = true;
    
    // 登录状态
    private isLoggingIn: boolean = false;
    
    // 登录服务
    private loginService: LoginService = null;

    onLoad() {
        // 添加全局错误处理器
        this.setupGlobalErrorHandlers();
        
        this.initializeUI();
        this.bindEvents();
        this.initializeWeChatLogin();
        this.initializeLoginService();
        
        // 设置默认目标场景（如果未在编辑器中配置）
        if (!this.targetSceneName || this.targetSceneName.trim() === "") {
            this.targetSceneName = "首页";
            console.log("已设置默认目标场景:", this.targetSceneName);
        }

        
    }

    /**
     * 设置全局错误处理器
     */
    private setupGlobalErrorHandlers() {
        // JavaScript 全局错误处理
        if (typeof window !== 'undefined') {
            window.onerror = (message, source, lineno, colno, error) => {
                console.error("🚨 全局JavaScript错误:", {
                    message: message,
                    source: source,
                    line: lineno,
                    column: colno,
                    error: error,
                    stack: error?.stack
                });
                return false; // 不阻止默认错误处理
            };

            window.onunhandledrejection = (event) => {
                console.error("🚨 未处理的Promise拒绝:", {
                    reason: event.reason,
                    promise: event.promise
                });
            };
        }

        console.log("✅ 全局错误处理器已设置");
    }

    start() {
        // 初始化状态
        this.updateLoginButtonsState();
        
        // 添加调试快捷键（仅在开发环境使用）
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.key === 'd') {
                    // Ctrl+D 触发诊断
                    this.diagnoseWeChatLogin();
                } else if (event.ctrlKey && event.key === 't') {
                    // Ctrl+T 测试场景跳转
                    console.log("测试场景跳转功能...");
                    this.setTargetScene("首页");
                    this.navigateToTargetScene();
                } else if (event.ctrlKey && event.key === 'm') {
                    // Ctrl+M 模拟登录成功
                    console.log("模拟登录成功测试...");
                    this.simulateLoginSuccess();
                }
            });
        }
    }

    /**
     * 初始化UI引用
     */
    private initializeUI() {
        // 所有UI组件都通过属性配置，无需自动查找
        console.log("UI组件初始化完成，请确保在编辑器中配置所有必要的属性");
    }

    /**
     * 初始化微信登录组件
     */
    private initializeWeChatLogin() {
        // 如果没有通过属性配置微信登录组件，尝试获取或创建组件实例
        if (!this.weChatLogin) {
            // 首先尝试从当前节点获取
            this.weChatLogin = this.getComponent(WeChatLogin);
            
            if (!this.weChatLogin) {
                // 如果当前节点没有，尝试从当前节点添加组件
                this.weChatLogin = this.addComponent(WeChatLogin);
                console.log("已自动添加微信登录组件到当前节点");
            } else {
                console.log("已从当前节点获取微信登录组件");
            }
        } else {
            console.log("微信登录组件已通过属性配置");
        }
    }

    /**
     * 初始化登录服务组件
     */
    private initializeLoginService() {
        // 尝试获取或创建 LoginService 组件实例
        if (!this.loginService) {
            // 首先尝试从当前节点获取
            this.loginService = this.getComponent(LoginService);
            
            if (!this.loginService) {
                // 如果当前节点没有，尝试从当前节点添加组件
                this.loginService = this.addComponent(LoginService);
                console.log("已自动添加登录服务组件到当前节点");
            } else {
                console.log("已从当前节点获取登录服务组件");
            }
        } else {
            console.log("登录服务组件已通过属性配置");
        }
    }

    /**
     * 绑定事件
     */
    private bindEvents() {
        // 微信登录按钮事件
        if (this.wechatLoginBtn) {
            this.wechatLoginBtn.node.on(Button.EventType.CLICK, this.onWechatLogin, this);
        }
        
        // 游客登录按钮事件
        if (this.guestLoginBtn) {
            this.guestLoginBtn.node.on(Button.EventType.CLICK, this.onGuestLogin, this);
        }
        
        // 协议按钮事件
        if (this.userAgreementBtn) {
            this.userAgreementBtn.node.on(Button.EventType.CLICK, this.onShowUserAgreement, this);
        }
        
        if (this.privacyAgreementBtn) {
            this.privacyAgreementBtn.node.on(Button.EventType.CLICK, this.onShowPrivacyAgreement, this);
        }
        
        // 协议弹窗控制器的事件将由其自身处理
        
        // 勾选框点击事件
        if (this.agreeCheckboxNode) {
            this.agreeCheckboxNode.on(Node.EventType.TOUCH_END, this.onToggleAgreement, this);
        }
    }



    /**
     * 显示用户服务协议
     */
    private onShowUserAgreement() {
        if (this.agreementDialogController) {
            this.agreementDialogController.showAgreementByType('user');
        } else {
            console.warn("协议弹窗控制器未配置");
        }
    }

    /**
     * 显示隐私协议
     */
    private onShowPrivacyAgreement() {
        if (this.agreementDialogController) {
            this.agreementDialogController.showAgreementByType('privacy');
        } else {
            console.warn("协议弹窗控制器未配置");
        }
    }

    /**
     * 切换协议同意状态
     */
    private onToggleAgreement() {
        this.isAgreed = !this.isAgreed;
        this.updateCheckboxVisual();
        this.updateLoginButtonsState();
    }

    /**
     * 更新勾选框视觉状态
     */
    private updateCheckboxVisual() {
        if (this.checkboxSprite) {
            // 根据勾选状态切换图片
            if (this.isAgreed && this.checkedSprite) {
                this.checkboxSprite.spriteFrame = this.checkedSprite;
            } else if (!this.isAgreed && this.uncheckedSprite) {
                this.checkboxSprite.spriteFrame = this.uncheckedSprite;
            }
        }
    }

    /**
     * 更新登录按钮的可用状态
     */
    private updateLoginButtonsState() {
        const isEnabled = this.isAgreed && !this.isLoggingIn;
        
        // 更新微信登录按钮状态
        if (this.wechatLoginBtn) {
            this.wechatLoginBtn.interactable = isEnabled;
            let uiOpacity = this.wechatLoginBtn.node.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = this.wechatLoginBtn.node.addComponent(UIOpacity);
            }
            uiOpacity.opacity = isEnabled ? 255 : 150;
        }
        
        // 更新游客登录按钮状态
        if (this.guestLoginBtn) {
            this.guestLoginBtn.interactable = isEnabled;
            let uiOpacity = this.guestLoginBtn.node.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = this.guestLoginBtn.node.addComponent(UIOpacity);
            }
            uiOpacity.opacity = isEnabled ? 255 : 150;
        }
    }

    /**
     * 微信登录按钮点击事件
     */
    private async onWechatLogin() {
        if (!this.isAgreed) {
            console.log("请先同意用户协议");
            return;
        }
        
        if (this.isLoggingIn) {
            console.log("正在登录中，请稍候...");
            return;
        }
        
        // 检查微信登录组件是否可用
        if (!this.weChatLogin) {
            console.error("微信登录组件未配置，无法进行微信登录");
            this.showLoginError("微信登录组件未配置");
            return;
        }
        
        try {
            console.log("=== 开始微信登录流程 ===");
            this.setLoginState(true);
            
            // 显示登录加载状态（可选）
            this.showLoginLoading();
            
            // 调用微信登录API
            const loginResult: WeChatLoginResult = await this.weChatLogin.login();
            
            console.log("=== 微信登录结果 ===", loginResult);
            
            if (loginResult.success) {
                // 登录成功
                console.log("微信登录成功！");
                console.log("OpenID:", loginResult.openid);
                console.log("Access Token:", loginResult.access_token ? "已获取" : "未获取");
                
                this.onLoginSuccess(loginResult);
            } else {
                // 登录失败
                console.error("微信登录失败:", loginResult.error);
                this.showLoginError(loginResult.error || "微信登录失败");
            }
            
        } catch (error) {
            console.error("微信登录异常:", error);
            this.showLoginError("微信登录过程中发生错误: " + error.message);
        } finally {
            this.setLoginState(false);
            this.hideLoginLoading();
        }
    }

    /**
     * 游客登录
     */
    private async onGuestLogin() {
        if (!this.isAgreed) {
            console.log("请先同意用户协议");
            return;
        }
        
        if (this.isLoggingIn) {
            console.log("正在登录中，请稍候...");
            return;
        }
        
        console.log("游客登录流程开始");

        // 开始登录加载
        this.setLoginState(true);
        this.showLoginLoading();

        try {
            // 检查LoginService是否已初始化
            if (!this.loginService) {
                console.error('LoginService未初始化');
                this.showLoginError('登录服务未初始化');
                return;
            }

            // 调用真实的游客登录API
            console.log('开始调用真实的游客登录API...');
            const loginResponse: LoginResponse = await this.loginService.performGuestLogin();
            
            console.log('游客登录API调用成功:', loginResponse);
            
            // 构建用户数据（符合UserData接口）
            const userData: UserData = {
                openid: loginResponse.openid,
                wechatNickname: loginResponse.wechatNickname,
                wechatAvatar: loginResponse.wechatAvatar,
                isRealName: loginResponse.isRealName,
                access_token: loginResponse.access_token,
                expire_in: loginResponse.expire_in,
                client_id: loginResponse.client_id
            };

            // 保存用户数据到 ApiConfig 供全局使用
            ApiConfig.setUserData(userData);
            console.log('用户数据已保存到ApiConfig:', userData);

            // 跳转到首页（目标场景）
            this.navigateToTargetScene(async () => {
                // 更新当前场景的UI显示（延迟更新以确保场景完全加载）
                try {
                    console.log('游客登录后开始更新当前场景UI...');
                    RewardDisplayController.updateCurrentSceneDisplayDelayed(300);
                    console.log('游客登录后场景UI延迟更新已启动');
                } catch (uiError) {
                    console.error('游客登录后UI更新失败:', uiError);
                }
            });
            
        } catch (err) {
            console.error('游客登录失败:', err);
            this.showLoginError('游客登录失败: ' + (err.message || err));
        } finally {
            this.setLoginState(false);
            this.hideLoginLoading();
        }
    }

    /**
     * 设置协议同意状态（外部调用）
     */
    public setAgreementState(agreed: boolean) {
        this.isAgreed = agreed;
        this.updateCheckboxVisual();
        this.updateLoginButtonsState();
    }

    /**
     * 获取协议同意状态
     */
    public getAgreementState(): boolean {
        return this.isAgreed;
    }

    /**
     * 更新协议内容（外部调用）
     */
    public updateAgreementContent(userContent: string, privacyContent: string) {
        if (this.agreementDialogController) {
            this.agreementDialogController.setAgreementContent(userContent, privacyContent);
        }
    }

    /**
     * 设置登录状态
     */
    private setLoginState(isLogging: boolean) {
        this.isLoggingIn = isLogging;
        this.updateLoginButtonsState();
        console.log(isLogging ? "开始登录..." : "登录结束");
    }

    /**
     * 显示登录加载状态
     */
    private showLoginLoading() {
        console.log("显示登录加载状态");
        // 这里可以添加加载动画或提示
        // 例如：显示loading转圈、禁用按钮等
    }

    /**
     * 隐藏登录加载状态
     */
    private hideLoginLoading() {
        console.log("隐藏登录加载状态");
        // 这里可以隐藏加载动画
    }

    /**
     * 显示登录错误信息
     */
    private showLoginError(errorMessage: string) {
        console.error("登录错误:", errorMessage);
        // 这里可以显示错误弹窗或提示
        // 例如：弹出错误对话框、显示Toast等
        alert("登录失败: " + errorMessage);
    }

    /**
     * 登录成功处理
     */
    private async onLoginSuccess(loginResult: WeChatLoginResult) {
        console.log("=== 处理登录成功逻辑 ===");
        console.log("登录结果:", loginResult);
        console.log("用户OpenID:", loginResult.openid);
        console.log("Access Token:", loginResult.access_token);
        
        // 保存登录信息到本地存储或全局状态
        this.saveUserLoginInfo(loginResult);
        
        // 显示登录成功提示
        console.log("微信登录成功！即将跳转场景...");
        console.log("配置的目标场景:", this.targetSceneName);
        
        // 1. 先跳转到业务主场景
        this.navigateToTargetScene(async () => {
            // 2. 更新当前场景的UI显示（延迟更新以确保场景完全加载）
            try {
                console.log('开始更新当前场景UI...');
                RewardDisplayController.updateCurrentSceneDisplayDelayed(300);
                console.log('场景UI延迟更新已启动');
            } catch (uiError) {
                console.error('UI更新失败:', uiError);
            }

            // 3. 在后台初始化穿山甲 SDK
            try {
                await PangleAd.init({
                    onInitResult: (ok, msg) => console.log('穿山甲初始化', ok, msg)
                });

                // 4. SDK 初始化完成后再展示开屏广告
                const ok = await PangleAd.showSplashAd();
                console.log('开屏广告播放结果:', ok);
            } catch (e) {
                console.error('穿山甲广告流程出错', e);
            }
        });
    }

    /**
     * 保存用户登录信息
     */
    private saveUserLoginInfo(loginResult: WeChatLoginResult) {
        try {
            // 保存到本地存储
            const userInfo = {
                openid: loginResult.openid,
                access_token: loginResult.access_token,
                expire_in: loginResult.expire_in,
                client_id: loginResult.client_id,
                loginTime: Date.now()
            };
            
            localStorage.setItem('wechat_user_info', JSON.stringify(userInfo));
            console.log("用户登录信息已保存到本地存储");
            
        } catch (error) {
            console.warn("保存用户登录信息失败:", error);
        }
    }

    /**
     * 获取保存的用户登录信息
     */
    public getSavedUserInfo(): any | null {
        try {
            const userInfoStr = localStorage.getItem('wechat_user_info');
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                console.log("已获取保存的用户登录信息");
                return userInfo;
            }
        } catch (error) {
            console.warn("读取用户登录信息失败:", error);
        }
        return null;
    }

    /**
     * 清除保存的用户登录信息
     */
    public clearSavedUserInfo() {
        try {
            localStorage.removeItem('wechat_user_info');
            console.log("已清除保存的用户登录信息");
        } catch (error) {
            console.warn("清除用户登录信息失败:", error);
        }
    }

    /**
     * 检查微信是否安装（外部调用）
     */
    public async checkWeChatInstallation(): Promise<boolean> {
        if (this.weChatLogin) {
            return await this.weChatLogin.isWeChatInstalled();
        }
        return false;
    }

    /**
     * 取消当前登录（外部调用）
     */
    public cancelLogin() {
        if (this.weChatLogin) {
            this.weChatLogin.cancelLogin();
        }
        this.setLoginState(false);
        this.hideLoginLoading();
    }

    /**
     * 跳转到目标场景
     * @param onSceneLoaded 场景加载完成后回调，可用于继续显示广告等后续操作
     */
    private async navigateToTargetScene(onSceneLoaded?: () => void | Promise<void>) {
        console.log(`准备跳转到场景: ${this.targetSceneName}`);

        try {
            // 场景跳转前的调试输出
            console.log("场景跳转前状态检查：");
            console.log("- 当前场景:", director.getScene()?.name || "未知");
            console.log("- Director 有效性:", !!director);

            // 使用 Promise 版本的 loadScene（Creator 3.x 推荐）
            const ok = await director.loadScene(this.targetSceneName);

            if (ok) {
                console.log(`✅ 场景跳转成功: ${this.targetSceneName}`);
                if (onSceneLoaded) {
                    try {
                        // 正确处理异步回调函数
                        await onSceneLoaded();
                    } catch (callbackErr) {
                        console.error("onSceneLoaded 回调执行异常:", callbackErr);
                    }
                }
            } else {
                console.error(`❌ 场景跳转失败（返回false）: ${this.targetSceneName}`);
            }
        } catch (err) {
            console.error(`❌ 场景跳转异常: ${this.targetSceneName}`, err);
            console.error("尝试跳转到默认场景 '首页' 作为回退...");
            try {
                await director.loadScene("首页");
                console.log("✅ 成功跳转到默认场景");
            } catch (fallbackErr) {
                console.error("❌ 跳转到默认场景也失败:", fallbackErr);
            }
        }
    }

    /**
     * 手动触发微信登录（外部调用）
     */
    public async triggerWeChatLogin() {
        console.log("=== 手动触发微信登录 ===");
        await this.onWechatLogin();
    }

    /**
     * 设置目标场景名称（外部调用）
     */
    public setTargetScene(sceneName: string) {
        this.targetSceneName = sceneName;
        console.log(`目标场景已设置为: ${sceneName}`);
    }

    /**
     * 获取目标场景名称（外部调用）
     */
    public getTargetScene(): string {
        return this.targetSceneName;
    }

    /**
     * 诊断微信登录配置和状态
     */
    public async diagnoseWeChatLogin() {
        console.log("=== 微信登录诊断工具 ===");
        
        // 1. 检查基础配置
        console.log("1. 检查基础配置...");
        console.log("目标场景名称:", this.targetSceneName || "未配置");
        console.log("协议同意状态:", this.isAgreed);
        console.log("登录状态:", this.isLoggingIn);
        
        // 2. 检查微信登录组件
        console.log("2. 检查微信登录组件...");
        if (this.weChatLogin) {
            console.log("✅ 微信登录组件已配置");
            console.log("组件配置信息:", this.weChatLogin.getCurrentConfig());
            
            // 测试API连通性
            console.log("3. 测试API连通性...");
            const isConnected = await this.weChatLogin.testApiConnection();
            console.log(isConnected ? "✅ API连通性正常" : "❌ API连接失败");
            
            // 检查微信安装状态
            console.log("4. 检查微信安装状态...");
            const isWeChatInstalled = await this.weChatLogin.isWeChatInstalled();
            console.log(isWeChatInstalled ? "✅ 微信已安装" : "❌ 微信未安装");
            
        } else {
            console.error("❌ 微信登录组件未配置");
        }
        
        // 3. 检查协议弹窗控制器
        console.log("5. 检查协议弹窗控制器...");
        if (this.agreementDialogController) {
            console.log("✅ 协议弹窗控制器已配置");
        } else {
            console.warn("⚠️ 协议弹窗控制器未配置");
        }
        
        // 4. 检查UI组件
        console.log("6. 检查UI组件...");
        console.log("微信登录按钮:", this.wechatLoginBtn ? "✅ 已配置" : "❌ 未配置");
        console.log("游客登录按钮:", this.guestLoginBtn ? "✅ 已配置" : "❌ 未配置");
        console.log("同意协议节点:", this.agreeCheckboxNode ? "✅ 已配置" : "❌ 未配置");
        
        console.log("=== 诊断完成 ===");
    }

    /**
     * 模拟登录成功
     */
    private simulateLoginSuccess() {
        console.log("=== 模拟登录成功 ===");
        // 这里可以添加模拟登录成功的逻辑
        // 例如：生成一个模拟的登录结果
        const mockLoginResult: WeChatLoginResult = {
            success: true,
            openid: "mockOpenID",
            access_token: "mockAccessToken",
            expire_in: 7200,
            client_id: "mockClientID"
        };
        
        this.onLoginSuccess(mockLoginResult);
    }
} 