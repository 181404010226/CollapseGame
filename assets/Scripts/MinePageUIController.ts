import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MinePageUIController')
export class MinePageUIController extends Component {
    
    @property(Node)
    public userAgreementUI: Node = null!; // 用户协议UI面板

    onLoad() {
        // 初始时隐藏用户协议UI
        this.hideUserAgreement();
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
} 