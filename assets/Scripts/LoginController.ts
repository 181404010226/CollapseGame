import { _decorator, Component, Node, Button, Label, Toggle, Sprite, UIOpacity, SpriteFrame, resources, TextAsset } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoginController')
export class LoginController extends Component {
    
    @property(Node)
    realNameAuthNode: Node = null;  // 实名注册协议场景
    
    @property(Node)
    agreementBackgroundNode: Node = null;  // 协议背景
    
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
    
    @property(Button)
    closeAgreementBtn: Button = null;  // 关闭协议按钮
    
    @property(Button)
    realNameAuthCloseBtn: Button = null;  // 实名认证关闭按钮
    
    @property(Label)
    agreementTitleLabel: Label = null;  // 协议标题Label
    
    @property(Label)
    agreementContentLabel: Label = null;  // 协议内容Label
    
    @property(Sprite)
    checkboxSprite: Sprite = null;  // 勾选框Sprite组件
    
    @property(SpriteFrame)
    checkedSprite: SpriteFrame = null;  // 选中状态图片
    
    @property(SpriteFrame)
    uncheckedSprite: SpriteFrame = null;  // 未选中状态图片
    
    // 协议是否同意状态
    private isAgreed: boolean = true;
    
    // 协议内容
    private userAgreementContent: string = "";
    private privacyAgreementContent: string = "";

    onLoad() {
        this.loadAgreementContent();
        this.initializeUI();
        this.bindEvents();
    }

    start() {
        // 初始化状态
        this.hideRealNameAuth();
        this.hideAgreementDialog();
        this.updateLoginButtonsState();
    }

    /**
     * 加载协议内容
     */
    private loadAgreementContent() {
        // 加载用户服务协议
        resources.load("用户服务协议", TextAsset, (err, asset) => {
            if (!err && asset) {
                this.userAgreementContent = asset.text;
                console.log("用户服务协议加载成功");
            } else {
                console.warn("用户服务协议加载失败:", err);
            }
        });
        
        // 加载隐私协议
        resources.load("隐私协议", TextAsset, (err, asset) => {
            if (!err && asset) {
                this.privacyAgreementContent = asset.text;
                console.log("隐私协议加载成功");
            } else {
                console.warn("隐私协议加载失败:", err);
            }
        });
    }

    /**
     * 初始化UI引用
     */
    private initializeUI() {
        // 所有UI组件都通过属性配置，无需自动查找
        console.log("UI组件初始化完成，请确保在编辑器中配置所有必要的属性");
    }

    /**
     * 绑定事件
     */
    private bindEvents() {
        // 登录按钮事件
        if (this.wechatLoginBtn) {
            this.wechatLoginBtn.node.on(Button.EventType.CLICK, this.onWechatLogin, this);
        }
        
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
        
        // 关闭协议按钮
        if (this.closeAgreementBtn) {
            this.closeAgreementBtn.node.on(Button.EventType.CLICK, this.onCloseAgreement, this);
        }
        
        // 实名认证关闭按钮
        if (this.realNameAuthCloseBtn) {
            this.realNameAuthCloseBtn.node.on(Button.EventType.CLICK, this.onCloseRealNameAuth, this);
        }
        
        // 勾选框点击事件
        if (this.agreeCheckboxNode) {
            this.agreeCheckboxNode.on(Node.EventType.TOUCH_END, this.onToggleAgreement, this);
        }
    }

    /**
     * 显示实名认证界面（用于登录时的实名认证）
     */
    public showRealNameAuth() {
        if (this.realNameAuthNode) {
            this.realNameAuthNode.active = true;
            console.log("显示实名认证界面");
        } else {
            console.warn("实名认证节点未配置，无法显示实名认证界面");
        }
    }

    /**
     * 隐藏实名认证界面
     */
    public hideRealNameAuth() {
        if (this.realNameAuthNode) {
            this.realNameAuthNode.active = false;
            console.log("隐藏实名认证界面");
        }
    }

    /**
     * 关闭实名认证界面
     */
    private onCloseRealNameAuth() {
        this.hideRealNameAuth();
    }

    /**
     * 显示用户服务协议
     */
    private onShowUserAgreement() {
        this.showAgreementDialog("用户服务协议", this.userAgreementContent);
    }

    /**
     * 显示隐私协议
     */
    private onShowPrivacyAgreement() {
        this.showAgreementDialog("隐私协议", this.privacyAgreementContent);
    }

    /**
     * 显示协议内容弹窗（用于显示用户协议和隐私协议）
     */
    private showAgreementDialog(title: string, content: string) {
        if (this.agreementBackgroundNode) {
            this.agreementBackgroundNode.active = true;
            
            // 设置协议标题
            if (this.agreementTitleLabel) {
                this.agreementTitleLabel.string = title;
            }
            
            // 设置协议内容
            if (this.agreementContentLabel) {
                this.agreementContentLabel.string = content;
            }
            
            console.log(`显示协议弹窗: ${title}`);
        } else {
            console.warn("协议背景节点未配置，无法显示协议内容");
        }
    }

    /**
     * 隐藏协议内容弹窗
     */
    public hideAgreementDialog() {
        if (this.agreementBackgroundNode) {
            this.agreementBackgroundNode.active = false;
            console.log("隐藏协议弹窗");
        }
    }

    /**
     * 关闭协议弹窗
     */
    private onCloseAgreement() {
        this.hideAgreementDialog();
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
        const isEnabled = this.isAgreed;
        
        if (this.wechatLoginBtn) {
            this.wechatLoginBtn.interactable = isEnabled;
            let uiOpacity = this.wechatLoginBtn.node.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = this.wechatLoginBtn.node.addComponent(UIOpacity);
            }
            uiOpacity.opacity = isEnabled ? 255 : 150;
        }
        
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
     * 微信登录
     */
    private onWechatLogin() {
        if (!this.isAgreed) {
            console.log("请先同意用户协议");
            return;
        }
        
        console.log("微信登录");
        // 这里添加微信登录逻辑
        // 可能需要先显示实名认证界面
        this.showRealNameAuth();
    }

    /**
     * 游客登录
     */
    private onGuestLogin() {
        if (!this.isAgreed) {
            console.log("请先同意用户协议");
            return;
        }
        
        console.log("游客登录");
        // 这里添加游客登录逻辑
        // 可能需要先显示实名认证界面
        this.showRealNameAuth();
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
        this.userAgreementContent = userContent;
        this.privacyAgreementContent = privacyContent;
    }
} 