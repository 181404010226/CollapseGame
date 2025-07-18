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
            const url = ApiConfig.getFullUrl(ApiConfig.ENDPOINTS.QUERY_USER_ACCOUNT);
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
        // Update nickname
        if (this.nicknameLabel) {
            this.nicknameLabel.string = data.nickname || '默认昵称';
        }

        // Update avatar
        if (this.avatarSprite) {
            if (data.avatar) {
                console.log('Loading remote avatar:', data.avatar)
                // 加载远程头像
                assetManager.loadRemote<ImageAsset>(data.avatar, (err, image) => {
                    if (!err && image) {
                        const texture = new Texture2D();
                        texture.image = image;
                        const spriteFrame = new SpriteFrame();
                        spriteFrame.texture = texture;
                        this.avatarSprite.spriteFrame = spriteFrame;
                        console.log('Successfully loaded remote avatar');
                    } else {
                        console.warn('Failed to load remote avatar:', err);
                    }
                });
            } 
        }

        // Update level
        if (this.levelLabel) {
            this.levelLabel.string = `${data.level.toString()}`;
        }

        // Update progress bar
        if (this.progressBar) {
            this.progressBar.progress = parseFloat(data.expPercent) / 100;
            this.updateMovingNodes();
        }

        if (this.idLabel) {
            this.idLabel.string = data.idNo.toString();
        }

        if (this.expPercentLabel) {
            this.expPercentLabel.string = `${data.expPercent}%`;
        }

        // Update treasure guide
        if (this.treasureGuideUI) {
            this.treasureGuideUI.updateTreasures(data.illustrationList);
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