import { _decorator, Component, Node, Label, Sprite, UITransform, Color, Vec3, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameUIManager')
export class GameUIManager extends Component {
    
    // 图片节点引用
    private redPacketNode: Node = null!;
    private paymentNode: Node = null!;
    private withdrawNode: Node = null!;
    private numberBackgroundNode: Node = null!;
    private taskCenterNode: Node = null!;
    private lotteryNode: Node = null!;
    private profileNode: Node = null!;
    private synthesisBackgroundNode: Node = null!;
    private adRevenueIconNode: Node = null!;
    private bottomBackgroundNode: Node = null!;
    private topBackgroundNode: Node = null!;
    private dividerLineNode: Node = null!;
    private leftShadowNode: Node = null!;
    private rightShadowNode: Node = null!;

    // 字体节点引用
    private balanceLabel1: Label = null!;
    private balanceLabel2: Label = null!;
    private synthesisTimeLabel: Label = null!;
    private reSynthesisLabel: Label = null!;
    private countLabel: Label = null!;
    private timesLabel: Label = null!;
    private adRevenueLabel: Label = null!;

    onLoad() {
        this.setupUILayout();
    }

    start() {
        this.initializeUIElements();
    }

    /**
     * 设置UI布局 - 自动创建所有节点
     */
    private setupUILayout() {
        console.log('自动创建游戏UI布局...');
        
        // 创建图片节点
        this.createImageNodes();
        
        // 创建字体节点
        this.createTextNodes();
    }

    /**
     * 创建所有图片节点
     */
    private createImageNodes() {
        console.log('创建图片节点...');
        
        // 创建背景相关节点
        this.createNumberBackground();
        this.createSynthesisBackground();
        this.createBottomBackground();
        this.createTopBackground();
        this.createShadowNodes();
        this.createDividerLine();
        
        // 创建功能图标节点
        this.createRedPacket();
        this.createTaskCenter();
        this.createLottery();
        this.createProfile();
        this.createPayment();
        this.createWithdraw();
        this.createAdRevenueIcon();
    }

    /**
     * 创建所有字体节点
     */
    private createTextNodes() {
        console.log('创建字体节点...');
        
        this.createBalanceLabels();
        this.createSynthesisTimeLabel();
        this.createReSynthesisLabels();
        this.createAdRevenueText();
    }

    /**
     * 自动创建数值背景节点
     */
    private createNumberBackground() {
        // 创建背景节点
        this.numberBackgroundNode = new Node('NumberBackground');
        this.node.addChild(this.numberBackgroundNode);
        
        // 添加UITransform组件
        const transform = this.numberBackgroundNode.addComponent(UITransform);
        
        // 设置位置和大小: X=14px, Y=99px, 宽度=348px, 高度=84px
        this.numberBackgroundNode.setPosition(14, -99, 0); // Cocos Y轴向上为正
        transform.setContentSize(348, 84);
        
        // 添加Widget组件并设置左上角对齐
        const widget = this.numberBackgroundNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 99;
        widget.left = 14;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        // 添加Sprite组件作为背景
        const sprite = this.numberBackgroundNode.addComponent(Sprite);
        
        console.log('数值背景节点创建完成');
    }

    /**
     * 自动创建红包节点
     */
    private createRedPacket() {
        // 创建红包节点
        this.redPacketNode = new Node('RedPacket');
        this.node.addChild(this.redPacketNode);
        
        // 添加UITransform组件
        const transform = this.redPacketNode.addComponent(UITransform);
        
        // 设置位置和大小: X=36px, Y=114px, 宽度=48px, 高度=50px
        this.redPacketNode.setPosition(36, -114, 0);
        transform.setContentSize(48, 50);
        
        // 添加Widget组件并设置左上角对齐
        const widget = this.redPacketNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 114;
        widget.left = 36;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        // 添加Sprite组件
        const sprite = this.redPacketNode.addComponent(Sprite);
        
        console.log('红包节点创建完成');
        
        // 创建其他缺失的小图标节点
        this.createSmallIcons();
    }

    /**
     * 创建小图标节点
     */
    private createSmallIcons() {
        // 小图标1: 位置 144.5px, 236px, 大小 39.8px, 49px
        const icon1 = new Node('SmallIcon1');
        this.node.addChild(icon1);
        const transform1 = icon1.addComponent(UITransform);
        icon1.setPosition(144.5, -236, 0);
        transform1.setContentSize(39.8, 49);
        const widget1 = icon1.addComponent(Widget);
        widget1.isAlignTop = true;
        widget1.isAlignLeft = true;
        widget1.top = 236;
        widget1.left = 144.5;
        widget1.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const sprite1 = icon1.addComponent(Sprite);

        // 小图标2: 位置 28px, 238.41px, 大小 42px, 42.59px
        const icon2 = new Node('SmallIcon2');
        this.node.addChild(icon2);
        const transform2 = icon2.addComponent(UITransform);
        icon2.setPosition(28, -238.41, 0);
        transform2.setContentSize(42, 42.59);
        const widget2 = icon2.addComponent(Widget);
        widget2.isAlignTop = true;
        widget2.isAlignLeft = true;
        widget2.top = 238.41;
        widget2.left = 28;
        widget2.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const sprite2 = icon2.addComponent(Sprite);

        // 小图标3: 位置 13.6px, 232px, 大小 72.8px, 56px
        const icon3 = new Node('SmallIcon3');
        this.node.addChild(icon3);
        const transform3 = icon3.addComponent(UITransform);
        icon3.setPosition(13.6, -232, 0);
        transform3.setContentSize(72.8, 56);
        const widget3 = icon3.addComponent(Widget);
        widget3.isAlignTop = true;
        widget3.isAlignLeft = true;
        widget3.top = 232;
        widget3.left = 13.6;
        widget3.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const sprite3 = icon3.addComponent(Sprite);

        // 小图标4: 位置 127.6px, 232px, 大小 72.8px, 56px
        const icon4 = new Node('SmallIcon4');
        this.node.addChild(icon4);
        const transform4 = icon4.addComponent(UITransform);
        icon4.setPosition(127.6, -232, 0);
        transform4.setContentSize(72.8, 56);
        const widget4 = icon4.addComponent(Widget);
        widget4.isAlignTop = true;
        widget4.isAlignLeft = true;
        widget4.top = 232;
        widget4.left = 127.6;
        widget4.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const sprite4 = icon4.addComponent(Sprite);

        // 小图标5: 位置 99px, 250px, 大小 22px, 20px
        const icon5 = new Node('SmallIcon5');
        this.node.addChild(icon5);
        const transform5 = icon5.addComponent(UITransform);
        icon5.setPosition(99, -250, 0);
        transform5.setContentSize(22, 20);
        const widget5 = icon5.addComponent(Widget);
        widget5.isAlignTop = true;
        widget5.isAlignLeft = true;
        widget5.top = 250;
        widget5.left = 99;
        widget5.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const sprite5 = icon5.addComponent(Sprite);

        console.log('小图标节点创建完成');
    }

    /**
     * 创建合成背景节点
     */
    private createSynthesisBackground() {
        this.synthesisBackgroundNode = new Node('SynthesisBackground');
        this.node.addChild(this.synthesisBackgroundNode);
        
        const transform = this.synthesisBackgroundNode.addComponent(UITransform);
        // 位置: 0px, 224px, 大小: 232px, 100px
        this.synthesisBackgroundNode.setPosition(0, -224, 0);
        transform.setContentSize(232, 100);
        
        const widget = this.synthesisBackgroundNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 224;
        widget.left = 0;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const sprite = this.synthesisBackgroundNode.addComponent(Sprite);
        
        // 创建再合成区域背景: 位置 0px, 348px, 大小: 320px, 52px
        const reSynthBg = new Node('ReSynthesisBackground');
        this.node.addChild(reSynthBg);
        const reSynthTransform = reSynthBg.addComponent(UITransform);
        reSynthBg.setPosition(0, -348, 0);
        reSynthTransform.setContentSize(320, 52);
        const reSynthWidget = reSynthBg.addComponent(Widget);
        reSynthWidget.isAlignTop = true;
        reSynthWidget.isAlignLeft = true;
        reSynthWidget.top = 348;
        reSynthWidget.left = 0;
        reSynthWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const reSynthSprite = reSynthBg.addComponent(Sprite);
        
        console.log('合成背景节点创建完成');
    }

    /**
     * 创建底部背景节点
     */
    private createBottomBackground() {
        this.bottomBackgroundNode = new Node('BottomBackground');
        this.node.addChild(this.bottomBackgroundNode);
        
        const transform = this.bottomBackgroundNode.addComponent(UITransform);
        // 位置: 0px, 1596px, 大小: 750px, 64px, 圆角: 10px
        this.bottomBackgroundNode.setPosition(0, -1596, 0);
        transform.setContentSize(750, 64);
        
        const widget = this.bottomBackgroundNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 1596;
        widget.left = 0;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const sprite = this.bottomBackgroundNode.addComponent(Sprite);
        console.log('底部背景节点创建完成');
    }

    /**
     * 创建顶部背景节点
     */
    private createTopBackground() {
        this.topBackgroundNode = new Node('TopBackground');
        this.node.addChild(this.topBackgroundNode);
        
        const transform = this.topBackgroundNode.addComponent(UITransform);
        // 位置: 0px, 196px, 大小: 750px, 157.71px
        this.topBackgroundNode.setPosition(0, -196, 0);
        transform.setContentSize(750, 157.71);
        
        const widget = this.topBackgroundNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 196;
        widget.left = 0;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const sprite = this.topBackgroundNode.addComponent(Sprite);
        console.log('顶部背景节点创建完成');
    }

    /**
     * 创建阴影节点
     */
    private createShadowNodes() {
        // 左侧阴影
        this.leftShadowNode = new Node('LeftShadow');
        this.node.addChild(this.leftShadowNode);
        
        const leftTransform = this.leftShadowNode.addComponent(UITransform);
        // 位置: 0px, 427px, 大小: 36px, 1227px, 不透明度: 20%
        this.leftShadowNode.setPosition(0, -427, 0);
        leftTransform.setContentSize(36, 1227);
        
        const leftWidget = this.leftShadowNode.addComponent(Widget);
        leftWidget.isAlignTop = true;
        leftWidget.isAlignLeft = true;
        leftWidget.top = 427;
        leftWidget.left = 0;
        leftWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const leftSprite = this.leftShadowNode.addComponent(Sprite);
        leftSprite.color = new Color(255, 255, 255, 51); // 20% 不透明度
        
        // 右侧阴影
        this.rightShadowNode = new Node('RightShadow');
        this.node.addChild(this.rightShadowNode);
        
        const rightTransform = this.rightShadowNode.addComponent(UITransform);
        // 位置: 714px, 380px, 大小: 36px, 1200px, 不透明度: 20%
        this.rightShadowNode.setPosition(714, -380, 0);
        rightTransform.setContentSize(36, 1200);
        
        const rightWidget = this.rightShadowNode.addComponent(Widget);
        rightWidget.isAlignTop = true;
        rightWidget.isAlignLeft = true;
        rightWidget.top = 380;
        rightWidget.left = 714;
        rightWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const rightSprite = this.rightShadowNode.addComponent(Sprite);
        rightSprite.color = new Color(255, 255, 255, 51); // 20% 不透明度
        
        console.log('阴影节点创建完成');
    }

    /**
     * 创建分割线节点
     */
    private createDividerLine() {
        this.dividerLineNode = new Node('DividerLine');
        this.node.addChild(this.dividerLineNode);
        
        const transform = this.dividerLineNode.addComponent(UITransform);
        // 位置: 40px, 469px, 大小: 670px, 1px
        this.dividerLineNode.setPosition(40, -469, 0);
        transform.setContentSize(670, 1);
        
        const widget = this.dividerLineNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 469;
        widget.left = 40;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const sprite = this.dividerLineNode.addComponent(Sprite);
        console.log('分割线节点创建完成');
    }

    /**
     * 创建余额标签
     */
    private createBalanceLabels() {
        // 创建第一个余额标签节点
        const labelNode1 = new Node('BalanceLabel1');
        this.node.addChild(labelNode1);
        
        const transform1 = labelNode1.addComponent(UITransform);
        // 设置位置和大小: X=92px, Y=115px, 宽度=126px, 高度=48px
        labelNode1.setPosition(92, -115, 0);
        transform1.setContentSize(126, 48);
        
        const widget1 = labelNode1.addComponent(Widget);
        widget1.isAlignTop = true;
        widget1.isAlignLeft = true;
        widget1.top = 115;
        widget1.left = 92;
        widget1.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        this.balanceLabel1 = labelNode1.addComponent(Label);
        this.balanceLabel1.fontSize = 34;
        this.balanceLabel1.color = new Color(0, 0, 0, 255);
        this.balanceLabel1.string = "9812.68";
        this.balanceLabel1.overflow = Label.Overflow.CLAMP;

        // 创建第二个余额标签节点
        const labelNode2 = new Node('BalanceLabel2');
        this.node.addChild(labelNode2);
        
        const transform2 = labelNode2.addComponent(UITransform);
        // 设置位置和大小: X=473px, Y=115px, 宽度=126px, 高度=48px
        labelNode2.setPosition(473, -115, 0);
        transform2.setContentSize(126, 48);
        
        const widget2 = labelNode2.addComponent(Widget);
        widget2.isAlignTop = true;
        widget2.isAlignLeft = true;
        widget2.top = 115;
        widget2.left = 473;
        widget2.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        this.balanceLabel2 = labelNode2.addComponent(Label);
        this.balanceLabel2.fontSize = 34;
        this.balanceLabel2.color = new Color(0, 0, 0, 255);
        this.balanceLabel2.string = "9812.68";
        this.balanceLabel2.overflow = Label.Overflow.CLAMP;
        
        console.log('余额标签创建完成');
    }

    /**
     * 创建合成时间标签
     */
    private createSynthesisTimeLabel() {
        const labelNode = new Node('SynthesisTimeLabel');
        this.node.addChild(labelNode);
        
        const transform = labelNode.addComponent(UITransform);
        // 位置: 14px, 287px, 大小: 192px, 28px
        labelNode.setPosition(14, -287, 0);
        transform.setContentSize(192, 28);
        
        const widget = labelNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 287;
        widget.left = 14;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        this.synthesisTimeLabel = labelNode.addComponent(Label);
        this.synthesisTimeLabel.fontSize = 20;
        this.synthesisTimeLabel.color = new Color(89, 89, 89, 255); // #595959
        this.synthesisTimeLabel.string = "预计2分钟可合成财神";
        this.synthesisTimeLabel.overflow = Label.Overflow.CLAMP;
        
        console.log('合成时间标签创建完成');
    }

    /**
     * 创建再合成相关标签
     */
    private createReSynthesisLabels() {
        // 再合成标签
        const reSynthesisLabelNode = new Node('ReSynthesisLabel');
        this.node.addChild(reSynthesisLabelNode);
        
        const reSynthesisTransform = reSynthesisLabelNode.addComponent(UITransform);
        // 位置: 13px, 349px, 大小: 72px, 45px
        reSynthesisLabelNode.setPosition(13, -349, 0);
        reSynthesisTransform.setContentSize(72, 45);
        
        const reSynthesisWidget = reSynthesisLabelNode.addComponent(Widget);
        reSynthesisWidget.isAlignTop = true;
        reSynthesisWidget.isAlignLeft = true;
        reSynthesisWidget.top = 349;
        reSynthesisWidget.left = 13;
        reSynthesisWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        this.reSynthesisLabel = reSynthesisLabelNode.addComponent(Label);
        this.reSynthesisLabel.fontSize = 24;
        this.reSynthesisLabel.color = new Color(255, 255, 255, 255); // #FFFFFF
        this.reSynthesisLabel.string = "再合成";
        this.reSynthesisLabel.overflow = Label.Overflow.CLAMP;

        // 数量标签 "30"
        const countLabelNode = new Node('CountLabel');
        this.node.addChild(countLabelNode);
        
        const countTransform = countLabelNode.addComponent(UITransform);
        // 位置: 85px, 349px, 大小: 39px, 45px
        countLabelNode.setPosition(85, -349, 0);
        countTransform.setContentSize(39, 45);
        
        const countWidget = countLabelNode.addComponent(Widget);
        countWidget.isAlignTop = true;
        countWidget.isAlignLeft = true;
        countWidget.top = 349;
        countWidget.left = 85;
        countWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        this.countLabel = countLabelNode.addComponent(Label);
        this.countLabel.fontSize = 32;
        this.countLabel.color = new Color(234, 25, 32, 255); // #EA1920
        this.countLabel.string = "30";
        this.countLabel.overflow = Label.Overflow.CLAMP;

        // "次" 标签
        const timesLabelNode = new Node('TimesLabel');
        this.node.addChild(timesLabelNode);
        
        const timesTransform = timesLabelNode.addComponent(UITransform);
        // 位置: 124px, 349px, 大小: 24px, 45px
        timesLabelNode.setPosition(124, -349, 0);
        timesTransform.setContentSize(24, 45);
        
        const timesWidget = timesLabelNode.addComponent(Widget);
        timesWidget.isAlignTop = true;
        timesWidget.isAlignLeft = true;
        timesWidget.top = 349;
        timesWidget.left = 124;
        timesWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        this.timesLabel = timesLabelNode.addComponent(Label);
        this.timesLabel.fontSize = 24;
        this.timesLabel.color = new Color(234, 25, 32, 255); // #EA1920
        this.timesLabel.string = "次";
        this.timesLabel.overflow = Label.Overflow.CLAMP;
        
        console.log('再合成标签创建完成');
    }

    /**
     * 创建广告收益文字
     */
    private createAdRevenueText() {
        const labelNode = new Node('AdRevenueLabel');
        this.node.addChild(labelNode);
        
        const transform = labelNode.addComponent(UITransform);
        // 位置: 148px, 349px, 大小: 120px, 45px
        labelNode.setPosition(148, -349, 0);
        transform.setContentSize(120, 45);
        
        const widget = labelNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 349;
        widget.left = 148;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        this.adRevenueLabel = labelNode.addComponent(Label);
        this.adRevenueLabel.fontSize = 24;
        this.adRevenueLabel.color = new Color(255, 255, 255, 255); // #FFFFFF
        this.adRevenueLabel.string = "享广告收益";
        this.adRevenueLabel.overflow = Label.Overflow.CLAMP;
        
        console.log('广告收益文字创建完成');
    }

    /**
     * 自动创建打款节点
     */
    private createPayment() {
        // 创建打款节点
        this.paymentNode = new Node('Payment');
        this.node.addChild(this.paymentNode);
        
        // 添加UITransform组件
        const transform = this.paymentNode.addComponent(UITransform);
        
        // 设置位置和大小: X=240px, Y=100px, 宽度=126px, 高度=82px
        this.paymentNode.setPosition(240, -100, 0);
        transform.setContentSize(126, 82);
        
        // 添加Widget组件并设置左上角对齐
        const widget = this.paymentNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 100;
        widget.left = 240;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        // 添加Sprite组件
        const sprite = this.paymentNode.addComponent(Sprite);
        
        // 添加标签
        const labelNode = new Node('PaymentLabel');
        this.paymentNode.addChild(labelNode);
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(126, 82);
        const label = labelNode.addComponent(Label);
        label.string = "打款";
        label.fontSize = 24;
        label.color = new Color(0, 0, 0, 255);
        label.overflow = Label.Overflow.CLAMP; // 设置溢出处理为clamp
        // label.fontFamily = "PingFang SC"; // 可根据需要启用
        
        console.log('打款节点创建完成');
    }

    /**
     * 自动创建提现节点
     */
    private createWithdraw() {
        // 创建提现节点
        this.withdrawNode = new Node('Withdraw');
        this.node.addChild(this.withdrawNode);
        
        // 添加UITransform组件
        const transform = this.withdrawNode.addComponent(UITransform);
        
        // 设置位置和大小: X=609px, Y=100px, 宽度=126px, 高度=82px
        this.withdrawNode.setPosition(609, -100, 0);
        transform.setContentSize(126, 82);
        
        // 添加Widget组件并设置左上角对齐
        const widget = this.withdrawNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 100;
        widget.left = 609;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        // 添加Sprite组件
        const sprite = this.withdrawNode.addComponent(Sprite);
        
        // 添加标签
        const labelNode = new Node('WithdrawLabel');
        this.withdrawNode.addChild(labelNode);
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(126, 82);
        const label = labelNode.addComponent(Label);
        label.string = "提现";
        label.fontSize = 24;
        label.color = new Color(0, 0, 0, 255);
        label.overflow = Label.Overflow.CLAMP; // 设置溢出处理为clamp
        // label.fontFamily = "PingFang SC"; // 可根据需要启用
        
        console.log('提现节点创建完成');
    }

    /**
     * 创建任务中心节点
     */
    private createTaskCenter() {
        this.taskCenterNode = new Node('TaskCenter');
        this.node.addChild(this.taskCenterNode);
        
        const transform = this.taskCenterNode.addComponent(UITransform);
        // 位置: 350px, 231px, 大小: 132px, 99px
        this.taskCenterNode.setPosition(350, -231, 0);
        transform.setContentSize(132, 99);
        
        const widget = this.taskCenterNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 231;
        widget.left = 350;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const sprite = this.taskCenterNode.addComponent(Sprite);
        console.log('任务中心节点创建完成');
    }

    /**
     * 创建抽奖节点
     */
    private createLottery() {
        this.lotteryNode = new Node('Lottery');
        this.node.addChild(this.lotteryNode);
        
        const transform = this.lotteryNode.addComponent(UITransform);
        // 位置: 502px, 227px, 大小: 90px, 103px
        this.lotteryNode.setPosition(502, -227, 0);
        transform.setContentSize(90, 103);
        
        const widget = this.lotteryNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 227;
        widget.left = 502;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const sprite = this.lotteryNode.addComponent(Sprite);
        console.log('抽奖节点创建完成');
    }

    /**
     * 创建我的节点
     */
    private createProfile() {
        this.profileNode = new Node('Profile');
        this.node.addChild(this.profileNode);
        
        const transform = this.profileNode.addComponent(UITransform);
        // 位置: 613.24px, 227px, 大小: 112px, 103px
        this.profileNode.setPosition(613.24, -227, 0);
        transform.setContentSize(112, 103);
        
        const widget = this.profileNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 227;
        widget.left = 613.24;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const sprite = this.profileNode.addComponent(Sprite);
        console.log('我的节点创建完成');
    }

    /**
     * 创建广告收益图标节点
     */
    private createAdRevenueIcon() {
        this.adRevenueIconNode = new Node('AdRevenueIcon');
        this.node.addChild(this.adRevenueIconNode);
        
        const transform = this.adRevenueIconNode.addComponent(UITransform);
        // 位置: 274px, 359px, 大小: 30px, 30px
        this.adRevenueIconNode.setPosition(274, -359, 0);
        transform.setContentSize(30, 30);
        
        const widget = this.adRevenueIconNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = 359;
        widget.left = 274;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const sprite = this.adRevenueIconNode.addComponent(Sprite);
        console.log('广告收益图标节点创建完成');
    }

    /**
     * 初始化UI元素
     */
    private initializeUIElements() {
        // 设置所有图片节点为可见
        this.setNodeVisible(this.redPacketNode, true);
        this.setNodeVisible(this.paymentNode, true);
        this.setNodeVisible(this.withdrawNode, true);
        this.setNodeVisible(this.numberBackgroundNode, true);
        this.setNodeVisible(this.taskCenterNode, true);
        this.setNodeVisible(this.lotteryNode, true);
        this.setNodeVisible(this.profileNode, true);
        this.setNodeVisible(this.synthesisBackgroundNode, true);
        this.setNodeVisible(this.adRevenueIconNode, true);
        this.setNodeVisible(this.bottomBackgroundNode, true);
        this.setNodeVisible(this.topBackgroundNode, true);
        this.setNodeVisible(this.dividerLineNode, true);
        this.setNodeVisible(this.leftShadowNode, true);
        this.setNodeVisible(this.rightShadowNode, true);
        
        // 设置所有字体节点为可见
        if (this.balanceLabel1) {
            this.setNodeVisible(this.balanceLabel1.node, true);
        }
        
        if (this.balanceLabel2) {
            this.setNodeVisible(this.balanceLabel2.node, true);
        }

        if (this.synthesisTimeLabel) {
            this.setNodeVisible(this.synthesisTimeLabel.node, true);
        }

        if (this.reSynthesisLabel) {
            this.setNodeVisible(this.reSynthesisLabel.node, true);
        }

        if (this.countLabel) {
            this.setNodeVisible(this.countLabel.node, true);
        }

        if (this.timesLabel) {
            this.setNodeVisible(this.timesLabel.node, true);
        }

        if (this.adRevenueLabel) {
            this.setNodeVisible(this.adRevenueLabel.node, true);
        }

        console.log('游戏UI自动初始化完成 - 所有节点已自动创建并设置Widget左上角对齐');
    }

    /**
     * 设置节点可见性
     */
    private setNodeVisible(node: Node, visible: boolean) {
        if (node) {
            node.active = visible;
        }
    }

    /**
     * 更新余额显示
     */
    public updateBalance(balance: number) {
        const balanceStr = balance.toFixed(2);
        
        if (this.balanceLabel1) {
            this.balanceLabel1.string = balanceStr;
        }
        
        if (this.balanceLabel2) {
            this.balanceLabel2.string = balanceStr;
        }
    }

    /**
     * 更新合成时间显示
     */
    public updateSynthesisTime(timeText: string) {
        if (this.synthesisTimeLabel) {
            this.synthesisTimeLabel.string = timeText;
        }
    }

    /**
     * 更新再合成次数
     */
    public updateReSynthesisCount(count: number) {
        if (this.countLabel) {
            this.countLabel.string = count.toString();
        }
    }

    /**
     * 更新广告收益文字
     */
    public updateAdRevenueText(text: string) {
        if (this.adRevenueLabel) {
            this.adRevenueLabel.string = text;
        }
    }

    /**
     * 设置字体
     */
    public setFont(fontFamily: string) {
        if (this.balanceLabel1) {
            // this.balanceLabel1.fontFamily = fontFamily;
        }
        
        if (this.balanceLabel2) {
            // this.balanceLabel2.fontFamily = fontFamily;
        }

        if (this.synthesisTimeLabel) {
            // this.synthesisTimeLabel.fontFamily = fontFamily;
        }

        if (this.reSynthesisLabel) {
            // this.reSynthesisLabel.fontFamily = fontFamily;
        }

        if (this.countLabel) {
            // this.countLabel.fontFamily = fontFamily;
        }

        if (this.timesLabel) {
            // this.timesLabel.fontFamily = fontFamily;
        }

        if (this.adRevenueLabel) {
            // this.adRevenueLabel.fontFamily = fontFamily;
        }
        
        // 设置其他标签的字体
        const paymentLabel = this.paymentNode?.getChildByName('PaymentLabel')?.getComponent(Label);
        if (paymentLabel) {
            // paymentLabel.fontFamily = fontFamily;
        }
        
        const withdrawLabel = this.withdrawNode?.getChildByName('WithdrawLabel')?.getComponent(Label);
        if (withdrawLabel) {
            // withdrawLabel.fontFamily = fontFamily;
        }
    }

    /**
     * 设置字体大小
     */
    public setFontSize(mainSize: number, buttonSize: number = 24, timeSize: number = 20, countSize: number = 32) {
        if (this.balanceLabel1) {
            this.balanceLabel1.fontSize = mainSize;
        }
        
        if (this.balanceLabel2) {
            this.balanceLabel2.fontSize = mainSize;
        }

        if (this.synthesisTimeLabel) {
            this.synthesisTimeLabel.fontSize = timeSize;
        }

        if (this.reSynthesisLabel) {
            this.reSynthesisLabel.fontSize = buttonSize;
        }

        if (this.countLabel) {
            this.countLabel.fontSize = countSize;
        }

        if (this.timesLabel) {
            this.timesLabel.fontSize = buttonSize;
        }

        if (this.adRevenueLabel) {
            this.adRevenueLabel.fontSize = buttonSize;
        }
        
        // 设置按钮标签的字体大小
        const paymentLabel = this.paymentNode?.getChildByName('PaymentLabel')?.getComponent(Label);
        if (paymentLabel) {
            paymentLabel.fontSize = buttonSize;
        }
        
        const withdrawLabel = this.withdrawNode?.getChildByName('WithdrawLabel')?.getComponent(Label);
        if (withdrawLabel) {
            withdrawLabel.fontSize = buttonSize;
        }
    }

    /**
     * 设置所有标签的溢出处理
     */
    public setOverflowMode(overflowMode: number) {
        if (this.balanceLabel1) {
            this.balanceLabel1.overflow = overflowMode;
        }
        
        if (this.balanceLabel2) {
            this.balanceLabel2.overflow = overflowMode;
        }

        if (this.synthesisTimeLabel) {
            this.synthesisTimeLabel.overflow = overflowMode;
        }

        if (this.reSynthesisLabel) {
            this.reSynthesisLabel.overflow = overflowMode;
        }

        if (this.countLabel) {
            this.countLabel.overflow = overflowMode;
        }

        if (this.timesLabel) {
            this.timesLabel.overflow = overflowMode;
        }

        if (this.adRevenueLabel) {
            this.adRevenueLabel.overflow = overflowMode;
        }
        
        // 设置其他标签的溢出处理
        const paymentLabel = this.paymentNode?.getChildByName('PaymentLabel')?.getComponent(Label);
        if (paymentLabel) {
            paymentLabel.overflow = overflowMode;
        }
        
        const withdrawLabel = this.withdrawNode?.getChildByName('WithdrawLabel')?.getComponent(Label);
        if (withdrawLabel) {
            withdrawLabel.overflow = overflowMode;
        }
    }

    /**
     * 获取节点位置信息（调试用）
     */
    public logNodePositions() {
        console.log('=== 自动创建的节点位置信息 ===');
        console.log('红包节点:', this.redPacketNode?.position);
        console.log('打款节点:', this.paymentNode?.position);
        console.log('提现节点:', this.withdrawNode?.position);
        console.log('数值背景:', this.numberBackgroundNode?.position);
        console.log('任务中心:', this.taskCenterNode?.position);
        console.log('抽奖节点:', this.lotteryNode?.position);
        console.log('我的节点:', this.profileNode?.position);
        console.log('合成背景:', this.synthesisBackgroundNode?.position);
        console.log('广告收益图标:', this.adRevenueIconNode?.position);
        console.log('余额标签1:', this.balanceLabel1?.node?.position);
        console.log('余额标签2:', this.balanceLabel2?.node?.position);
        console.log('合成时间标签:', this.synthesisTimeLabel?.node?.position);
        console.log('再合成标签:', this.reSynthesisLabel?.node?.position);
        console.log('次数标签:', this.countLabel?.node?.position);
        console.log('广告收益标签:', this.adRevenueLabel?.node?.position);
    }

    /**
     * 设置节点点击事件
     */
    public setupClickEvents() {
        // 红包点击事件
        if (this.redPacketNode) {
            this.redPacketNode.on(Node.EventType.TOUCH_END, () => {
                console.log('红包被点击');
                // 这里可以添加红包点击逻辑
            });
        }

        // 打款点击事件
        if (this.paymentNode) {
            this.paymentNode.on(Node.EventType.TOUCH_END, () => {
                console.log('打款被点击');
                // 这里可以添加打款点击逻辑
            });
        }

        // 提现点击事件
        if (this.withdrawNode) {
            this.withdrawNode.on(Node.EventType.TOUCH_END, () => {
                console.log('提现被点击');
                // 这里可以添加提现点击逻辑
            });
        }

        // 任务中心点击事件
        if (this.taskCenterNode) {
            this.taskCenterNode.on(Node.EventType.TOUCH_END, () => {
                console.log('任务中心被点击');
            });
        }

        // 抽奖点击事件
        if (this.lotteryNode) {
            this.lotteryNode.on(Node.EventType.TOUCH_END, () => {
                console.log('抽奖被点击');
            });
        }

        // 我的点击事件
        if (this.profileNode) {
            this.profileNode.on(Node.EventType.TOUCH_END, () => {
                console.log('我的被点击');
            });
        }

        // 广告收益图标点击事件
        if (this.adRevenueIconNode) {
            this.adRevenueIconNode.on(Node.EventType.TOUCH_END, () => {
                console.log('广告收益被点击');
            });
        }
    }

    /**
     * 获取Widget对齐信息（调试用）
     */
    public logWidgetInfo() {
        console.log('=== Widget对齐信息 ===');
        
        const widgets = [
            { name: '红包节点', node: this.redPacketNode },
            { name: '打款节点', node: this.paymentNode },
            { name: '提现节点', node: this.withdrawNode },
            { name: '数值背景', node: this.numberBackgroundNode },
            { name: '任务中心', node: this.taskCenterNode },
            { name: '抽奖节点', node: this.lotteryNode },
            { name: '我的节点', node: this.profileNode },
            { name: '合成背景', node: this.synthesisBackgroundNode },
            { name: '广告收益图标', node: this.adRevenueIconNode },
            { name: '余额标签1', node: this.balanceLabel1?.node },
            { name: '余额标签2', node: this.balanceLabel2?.node },
            { name: '合成时间标签', node: this.synthesisTimeLabel?.node },
            { name: '再合成标签', node: this.reSynthesisLabel?.node },
            { name: '次数标签', node: this.countLabel?.node },
            { name: '广告收益标签', node: this.adRevenueLabel?.node }
        ];

        widgets.forEach(item => {
            if (item.node) {
                const widget = item.node.getComponent(Widget);
                if (widget) {
                    console.log(`${item.name}: left=${widget.left}, top=${widget.top}, 左上角对齐=${widget.isAlignLeft && widget.isAlignTop}`);
                }
            }
        });
    }

    /**
     * 获取标签溢出处理信息（调试用）
     */
    public logOverflowInfo() {
        console.log('=== 标签溢出处理信息 ===');
        
        const labels = [
            { name: '余额标签1', label: this.balanceLabel1 },
            { name: '余额标签2', label: this.balanceLabel2 },
            { name: '合成时间标签', label: this.synthesisTimeLabel },
            { name: '再合成标签', label: this.reSynthesisLabel },
            { name: '次数标签', label: this.countLabel },
            { name: '次文字标签', label: this.timesLabel },
            { name: '广告收益标签', label: this.adRevenueLabel },
            { name: '打款标签', label: this.paymentNode?.getChildByName('PaymentLabel')?.getComponent(Label) },
            { name: '提现标签', label: this.withdrawNode?.getChildByName('WithdrawLabel')?.getComponent(Label) }
        ];

        labels.forEach(item => {
            if (item.label) {
                console.log(`${item.name}: overflow=${item.label.overflow}, fontSize=${item.label.fontSize}, color=${item.label.color}`);
            }
        });
    }
}