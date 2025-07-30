import { _decorator, Component, Node, Label, Sprite, ProgressBar } from 'cc';
import { resources, assetManager, ImageAsset, Vec3, director, Texture2D, UITransform, SpriteFrame } from 'cc';
import { ApiConfig, QueryUserAccountVo, OpTgcfIllustration } from '../API/ApiConfig';
import { TreasureGuideUI } from './TreasureGuideUI';
const { ccclass, property } = _decorator;

@ccclass('MinePageUIController')
export class MinePageUIController extends Component {
    
    @property(Node)
    public userAgreementUI: Node = null!; // 用户协议UI面板

    @property(Label)
    public nicknameLabel: Label = null!;

    @property(Sprite)
    public avatarSprite: Sprite = null!;

    @property(Label)
    public levelLabel: Label = null!;

    @property(ProgressBar)
    public progressBar: ProgressBar = null!;

    @property(Node)
    public movingNode1: Node = null!;

    @property(Node)
    public movingNode2: Node = null!;

    @property(TreasureGuideUI)
    public treasureGuideUI: TreasureGuideUI = null!;  // Bind to the TreasureGuideUI component

    @property(Label)
    public idLabel: Label = null!;

    @property(Label)
    public expPercentLabel: Label = null!;

    onLoad() {
        // 初始时隐藏用户协议UI
        this.hideUserAgreement();
        this.fetchUserAccountInfo();
    }

    /**
     * 显示用户协议UI
     */
    public showUserAgreement() {
        this.setAgreementTitle('用户协议');
        this.setAgreementContent('为了给大家带来更丰富的游戏体验，我们计划于【更新日期】【更新时间】进行版本更新维护，预计维护时长【X】小时。请各位玩家提前做好下线准备，避免造成不必要的损失。更新完成后，登录即可领取「钻石300、体力药剂5」的更新福利！');
        if (this.userAgreementUI) {
            this.userAgreementUI.active = true;
            console.log('用户协议UI已显示');
        }
    }

    /**
     * 显示隐私协议UI
     */
    public showPrivacyAgreement() {
        this.setAgreementTitle('隐私协议');
        this.setAgreementContent('我们非常重视您的隐私保护。本隐私协议说明了我们如何收集、使用、存储和保护您的个人信息。在使用我们的服务前，请仔细阅读本协议。我们承诺严格按照本协议的规定处理您的个人信息，保障您的合法权益。');
        if (this.userAgreementUI) {
            this.userAgreementUI.active = true;
            console.log('隐私协议UI已显示');
        }
    }

    /**
     * 隐藏用户协议UI
     */
    public hideUserAgreement() {
        if (this.userAgreementUI) {
            this.userAgreementUI.active = false;
            console.log('协议UI已隐藏');
        }
    }

    /**
     * 设置协议标题
     */
    private setAgreementTitle(title: string) {
        if (this.userAgreementUI) {
            // 查找标题节点
            const titleNode = this.userAgreementUI.getChildByName('AgreementTitle');
            if (titleNode) {
                const titleLabel = titleNode.getComponent(Label);
                if (titleLabel) {
                    titleLabel.string = title;
                }
            }
        }
    }

    /**
     * 设置协议内容
     */
    private setAgreementContent(content: string) {
        if (this.userAgreementUI) {
            // 查找内容节点
            const contentNode = this.userAgreementUI.getChildByName('ContentText');
            if (contentNode) {
                const contentLabel = contentNode.getComponent(Label);
                if (contentLabel) {
                    contentLabel.string = content;
                    console.log('协议内容已更新');
                }
            }
        }
    }

    private async fetchUserAccountInfo() {
        try {
            const url = ApiConfig.getFullUrl(ApiConfig.API_ENDPOINTS.QUERY_USER_ACCOUNT);
            const userData = ApiConfig.getUserData();
            const token = userData?.access_token;
            if (!token) {
                console.warn('No access token available, skipping fetch');
                return;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.code !== 200) {
                throw new Error(result.msg || '操作失败');
            }
            const data = result.data;
            console.log('Received server data:', data);
            this.processServerData(data);
        } catch (error) {
            console.error('Failed to fetch user account info:', error);
        }
    }

    private processServerData(data: QueryUserAccountVo) {
        console.log('Received server data:', data);
        
        try {
            // Update nickname - 优先使用ApiConfig中的微信昵称
            if (this.nicknameLabel) {
                const userData = ApiConfig.getUserData();
                const nickname = userData?.wechatNickname || data.nickname || '默认昵称';
                this.nicknameLabel.string = nickname;
            }

            // Update avatar - 优先使用本地保存的头像
            if (this.avatarSprite) {
                this.loadUserAvatar(data.avatar);
            }

            // Update level - 添加空值检查
            if (this.levelLabel) {
                const level = data.level != null ? data.level : 1;
                this.levelLabel.string = `${level}`;
            }

            // Update progress bar
            if (this.progressBar) {
                const expPercent = data.expPercent || '0';
                this.progressBar.progress = parseFloat(expPercent) / 100;
                this.updateMovingNodes();
            }

            // Update ID - 添加空值检查
            if (this.idLabel) {
                const idNo = data.idNo != null ? data.idNo : 0;
                this.idLabel.string = `ID：${idNo}`;
            }

            // Update exp percent
            if (this.expPercentLabel) {
                const expPercent = data.expPercent || '0';
                this.expPercentLabel.string = `${expPercent}%`;
            }

            // Update treasure guide
            if (this.treasureGuideUI && data.illustrationList) {
                this.treasureGuideUI.updateTreasures(data.illustrationList);
            }
        } catch (error) {
            console.error('Error processing server data:', error);
        }
    }

    /**
     * 加载用户头像 - 优先使用本地保存的头像
     */
    private loadUserAvatar(serverAvatarUrl?: string) {
        try {
            // 1. 优先使用ApiConfig中保存的本地头像SpriteFrame
            const userData = ApiConfig.getUserData();
            if (userData?.localAvatarSpriteFrame) {
                console.log('使用本地保存的微信头像');
                this.avatarSprite.spriteFrame = userData.localAvatarSpriteFrame;
                return;
            }
            
            // 2. 如果没有本地头像，但有微信头像URL，尝试加载
            const avatarUrl = userData?.wechatAvatar || serverAvatarUrl;
            if (avatarUrl) {
                console.log('本地头像不存在，尝试加载远程头像:', avatarUrl);
                this.loadRemoteAvatar(avatarUrl);
                return;
            }
            
            // 3. 都没有则使用默认头像
            console.log('没有可用的头像，使用默认头像');
            this.loadDefaultAvatar();
            
        } catch (error) {
            console.error('加载用户头像失败:', error);
            this.loadDefaultAvatar();
        }
    }

    /**
     * 加载默认头像
     */
    private loadDefaultAvatar() {
        // 这里可以设置一个默认的头像资源
        console.log('设置默认头像');
        // 可以从resources加载默认头像或者设置为null
        // this.avatarSprite.spriteFrame = null;
    }

    /**
     * 安全地加载远程头像（备用方法）
     */
    private loadRemoteAvatar(avatarUrl: string) {
        try {
            assetManager.loadRemote<ImageAsset>(avatarUrl, (err, imageAsset) => {
                if (err) {
                    console.warn('Failed to load remote avatar:', err);
                    this.loadDefaultAvatar();
                    return;
                }
                
                if (!imageAsset || !this.avatarSprite) {
                    console.warn('ImageAsset or avatarSprite is null');
                    this.loadDefaultAvatar();
                    return;
                }
                
                try {
                    // 使用与宝物图鉴相同的简单方式
                    const texture = new Texture2D();
                    texture.image = imageAsset;
                    const spriteFrame = new SpriteFrame();
                    spriteFrame.texture = texture;
                    this.avatarSprite.spriteFrame = spriteFrame;
                    console.log('Successfully loaded remote avatar');
                } catch (textureError) {
                    console.error('Error creating texture from image:', textureError);
                    this.loadDefaultAvatar();
                }
            });
        } catch (error) {
            console.error('Error loading remote avatar:', error);
            this.loadDefaultAvatar();
        }
    }

    private updateMovingNodes() {
        if (!this.progressBar || !this.movingNode1 || !this.movingNode2) return;

        const barTransform = this.progressBar.getComponent(UITransform);
        if (!barTransform) return;

        const barWidth = barTransform.width;
        const progress = this.progressBar.progress;
        const endX = barWidth * progress;  // Assuming left-aligned bar
        console.log('endX,barWidth,progress', endX,barWidth,progress);
        this.movingNode1.setPosition(new Vec3(endX+50, this.movingNode1.position.y, 0));
        this.movingNode2.setPosition(new Vec3(endX+50, this.movingNode2.position.y, 0));
    }
}