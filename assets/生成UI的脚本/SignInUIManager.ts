import { _decorator, Component, Node, Label, Sprite, UITransform, Color, Vec3, Widget, Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SignInUIManager')
export class SignInUIManager extends Component {
    
    // 背景节点
    private mainBackground: Node = null!;
    private homeBackground3_1: Node = null!;  // 豪版备份3 第一个
    private homeBackground3_2: Node = null!;  // 豪版备份3 第二个  
    private homeBackground3_3: Node = null!;  // 豪版备份3 第三个
    private shape: Node = null!;              // 形状
    private rectangle: Node = null!;          // 矩形（渐变）
    private questionIcon: Node = null!;       // 疑问图标
    private group2Copy: Node = null!;         // 编组2备份
    private coinIcon: Node = null!;           // 金币图标
    private tomorrowComeAgainImg: Node = null!; // 明日再来图片
    private receiveImg: Node = null!;         // 领取图片

    // 分割线节点
    private line10: Node = null!;            // line备份10
    private line7: Node = null!;             // line备份7  
    private line8: Node = null!;             // line备份8
    private line9: Node = null!;             // line备份9

    // 文本节点
    private taskCenterLabel: Label = null!;          // 任务中心
    private signInCenterLabel: Label = null!;        // 签到中心
    private signInDetailLabel: Label = null!;        // 签到详情
    private continuousSignLabel: Label = null!;      // 连续签到一年获手机
    private signSuccessGoldLabel: Label = null!;     // 签到成功得金币
    private completeLabel1: Label = null!;           // 去完成 1
    private dayCountLabel: Label = null!;            // 18/365
    private supplementSignLabel: Label = null!;      // 补签到活动
    private completeLabel2: Label = null!;           // 去完成 2
    private countLabel: Label = null!;               // 0/1
    private hotActivityLabel: Label = null!;         // 热门活动
    private activeTaskLabel: Label = null!;          // 活跃任务
    private tenMinutesLabel1: Label = null!;         // 10分钟 1
    private fiftyLabel: Label = null!;               // 50
    private tomorrowComeAgainLabel: Label = null!;   // 明日再来
    private tenMinutesLabel2: Label = null!;         // 10分钟 2
    private receiveLabel: Label = null!;             // 领取

    // 图片节点
    private gameImages: Node[] = [];         // 游戏图片数组
    private arrowIcon: Node = null!;         // 箭头

    onLoad() {
        this.setupSignInUI();
    }

    start() {
        this.initializeElements();
    }

    /**
     * 设置签到UI布局
     */
    private setupSignInUI() {
        console.log('创建签到UI布局...');
        
        // 创建背景节点
        this.createBackgroundNodes();
        
        // 创建分割线
        this.createDividerLines();
        
        // 创建文本节点
        this.createTextNodes();
        
        // 创建图标和图片节点
        this.createIconNodes();
    }

    /**
     * 创建背景节点
     */
    private createBackgroundNodes() {
        // 豪版备份3 - 第一个 (位置: 20px, 192px, 大小: 710px, 322px)
        this.homeBackground3_1 = new Node('HomeBackground3_1');
        this.node.addChild(this.homeBackground3_1);
        const transform1 = this.homeBackground3_1.addComponent(UITransform);
        this.homeBackground3_1.setPosition(20, -192, 0);
        transform1.setContentSize(710, 322);
        const widget1 = this.homeBackground3_1.addComponent(Widget);
        widget1.isAlignTop = true;
        widget1.isAlignLeft = true;
        widget1.top = 192;
        widget1.left = 20;
        widget1.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const sprite1 = this.homeBackground3_1.addComponent(Sprite);
        // 设置透明度 80%，圆角 16px，背景色 #FFFFFF
        sprite1.color = new Color(255, 255, 255, 204); // 80% = 204/255

        // 豪版备份3 - 第二个 (位置: 20px, 534px, 大小: 710px, 1047px)  
        this.homeBackground3_2 = new Node('HomeBackground3_2');
        this.node.addChild(this.homeBackground3_2);
        const transform2 = this.homeBackground3_2.addComponent(UITransform);
        this.homeBackground3_2.setPosition(20, -534, 0);
        transform2.setContentSize(710, 1047);
        const widget2 = this.homeBackground3_2.addComponent(Widget);
        widget2.isAlignTop = true;
        widget2.isAlignLeft = true;
        widget2.top = 534;
        widget2.left = 20;
        widget2.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const sprite2 = this.homeBackground3_2.addComponent(Sprite);
        sprite2.color = new Color(255, 255, 255, 204);

        // 形状 (位置: 320px, 335px, 大小: 30px, 30px)
        this.shape = new Node('Shape');
        this.node.addChild(this.shape);
        const shapeTransform = this.shape.addComponent(UITransform);
        this.shape.setPosition(320, -335, 0);
        shapeTransform.setContentSize(30, 30);
        const shapeWidget = this.shape.addComponent(Widget);
        shapeWidget.isAlignTop = true;
        shapeWidget.isAlignLeft = true;
        shapeWidget.top = 335;
        shapeWidget.left = 320;
        shapeWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const shapeSprite = this.shape.addComponent(Sprite);
        shapeSprite.color = new Color(51, 51, 51, 255); // #333333

        // 矩形 - 渐变背景 (位置: 530px, 324px, 大小: 180px, 78px)
        this.rectangle = new Node('Rectangle');
        this.node.addChild(this.rectangle);
        const rectTransform = this.rectangle.addComponent(UITransform);
        this.rectangle.setPosition(530, -324, 0);
        rectTransform.setContentSize(180, 78);
        const rectWidget = this.rectangle.addComponent(Widget);
        rectWidget.isAlignTop = true;
        rectWidget.isAlignLeft = true;
        rectWidget.top = 324;
        rectWidget.left = 530;
        rectWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const rectSprite = this.rectangle.addComponent(Sprite);
        // 渐变色 #FF9263 到 #F7153B，这里设置主色调
        rectSprite.color = new Color(255, 146, 99, 255);

        // 疑问图标 (位置: 200px, 449px, 大小: 30px, 30px)
        this.questionIcon = new Node('QuestionIcon');
        this.node.addChild(this.questionIcon);
        const questionTransform = this.questionIcon.addComponent(UITransform);
        this.questionIcon.setPosition(200, -449, 0);
        questionTransform.setContentSize(30, 30);
        const questionWidget = this.questionIcon.addComponent(Widget);
        questionWidget.isAlignTop = true;
        questionWidget.isAlignLeft = true;
        questionWidget.top = 449;
        questionWidget.left = 200;
        questionWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const questionSprite = this.questionIcon.addComponent(Sprite);
        questionSprite.color = new Color(51, 51, 51, 255);

        // 编组2备份 (位置: 530px, 425px, 大小: 180px, 78px)
        this.group2Copy = new Node('Group2Copy');
        this.node.addChild(this.group2Copy);
        const group2Transform = this.group2Copy.addComponent(UITransform);
        this.group2Copy.setPosition(530, -425, 0);
        group2Transform.setContentSize(180, 78);
        const group2Widget = this.group2Copy.addComponent(Widget);
        group2Widget.isAlignTop = true;
        group2Widget.isAlignLeft = true;
        group2Widget.top = 425;
        group2Widget.left = 530;
        group2Widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const group2Sprite = this.group2Copy.addComponent(Sprite);

        // 金币图标 (位置: 40px, 909px, 大小: 30px, 20.59px)
        this.coinIcon = new Node('CoinIcon');
        this.node.addChild(this.coinIcon);
        const coinTransform = this.coinIcon.addComponent(UITransform);
        this.coinIcon.setPosition(40, -909, 0);
        coinTransform.setContentSize(30, 20.59);
        const coinWidget = this.coinIcon.addComponent(Widget);
        coinWidget.isAlignTop = true;
        coinWidget.isAlignLeft = true;
        coinWidget.top = 909;
        coinWidget.left = 40;
        coinWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const coinSprite = this.coinIcon.addComponent(Sprite);

        // 明日再来图片 (位置: 570px, 874px, 大小: 140px, 48px)
        this.tomorrowComeAgainImg = new Node('TomorrowComeAgainImg');
        this.node.addChild(this.tomorrowComeAgainImg);
        const tomorrowTransform = this.tomorrowComeAgainImg.addComponent(UITransform);
        this.tomorrowComeAgainImg.setPosition(570, -874, 0);
        tomorrowTransform.setContentSize(140, 48);
        const tomorrowWidget = this.tomorrowComeAgainImg.addComponent(Widget);
        tomorrowWidget.isAlignTop = true;
        tomorrowWidget.isAlignLeft = true;
        tomorrowWidget.top = 874;
        tomorrowWidget.left = 570;
        tomorrowWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const tomorrowSprite = this.tomorrowComeAgainImg.addComponent(Sprite);

        // 领取图片 (位置: 570px, 965px, 大小: 140px, 48px)
        this.receiveImg = new Node('ReceiveImg');
        this.node.addChild(this.receiveImg);
        const receiveTransform = this.receiveImg.addComponent(UITransform);
        this.receiveImg.setPosition(570, -965, 0);
        receiveTransform.setContentSize(140, 48);
        const receiveWidget = this.receiveImg.addComponent(Widget);
        receiveWidget.isAlignTop = true;
        receiveWidget.isAlignLeft = true;
        receiveWidget.top = 965;
        receiveWidget.left = 570;
        receiveWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const receiveSprite = this.receiveImg.addComponent(Sprite);

        console.log('背景节点创建完成');
    }

    /**
     * 创建分割线
     */
    private createDividerLines() {
        // line备份10 (位置: 40px, 292px, 大小: 670px, 1px)
        this.line10 = new Node('Line10');
        this.node.addChild(this.line10);
        const line10Transform = this.line10.addComponent(UITransform);
        this.line10.setPosition(40, -292, 0);
        line10Transform.setContentSize(670, 1);
        const line10Widget = this.line10.addComponent(Widget);
        line10Widget.isAlignTop = true;
        line10Widget.isAlignLeft = true;
        line10Widget.top = 292;
        line10Widget.left = 40;
        line10Widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const line10Sprite = this.line10.addComponent(Sprite);
        line10Sprite.color = new Color(214, 214, 214, 255); // #D6D6D6

        // line备份7 (位置: 40px, 413px, 大小: 670px, 1px)
        this.line7 = new Node('Line7');
        this.node.addChild(this.line7);
        const line7Transform = this.line7.addComponent(UITransform);
        this.line7.setPosition(40, -413, 0);
        line7Transform.setContentSize(670, 1);
        const line7Widget = this.line7.addComponent(Widget);
        line7Widget.isAlignTop = true;
        line7Widget.isAlignLeft = true;
        line7Widget.top = 413;
        line7Widget.left = 40;
        line7Widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const line7Sprite = this.line7.addComponent(Sprite);
        line7Sprite.color = new Color(214, 214, 214, 255);

        // line备份8 (位置: 40px, 852px, 大小: 670px, 1px)
        this.line8 = new Node('Line8');
        this.node.addChild(this.line8);
        const line8Transform = this.line8.addComponent(UITransform);
        this.line8.setPosition(40, -852, 0);
        line8Transform.setContentSize(670, 1);
        const line8Widget = this.line8.addComponent(Widget);
        line8Widget.isAlignTop = true;
        line8Widget.isAlignLeft = true;
        line8Widget.top = 852;
        line8Widget.left = 40;
        line8Widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const line8Sprite = this.line8.addComponent(Sprite);
        line8Sprite.color = new Color(214, 214, 214, 255);

        // line备份9 (位置: 40px, 943px, 大小: 670px, 1px)
        this.line9 = new Node('Line9');
        this.node.addChild(this.line9);
        const line9Transform = this.line9.addComponent(UITransform);
        this.line9.setPosition(40, -943, 0);
        line9Transform.setContentSize(670, 1);
        const line9Widget = this.line9.addComponent(Widget);
        line9Widget.isAlignTop = true;
        line9Widget.isAlignLeft = true;
        line9Widget.top = 943;
        line9Widget.left = 40;
        line9Widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const line9Sprite = this.line9.addComponent(Sprite);
        line9Sprite.color = new Color(214, 214, 214, 255);

        console.log('分割线创建完成');
    }

    /**
     * 创建文本节点
     */
    private createTextNodes() {
        // 任务中心 (位置: 303px, 66px, 大小: 144px, 42px, 字体: PingFang SC, 36px, #000000)
        this.taskCenterLabel = this.createLabel('TaskCenter', 303, 66, 144, 42, '任务中心', 'PingFang SC', 36, new Color(0, 0, 0, 255));

        // 签到中心 (位置: 40px, 223px, 大小: 120px, 42px, 字体: PingFang SC, 30px, #000000)
        this.signInCenterLabel = this.createLabel('SignInCenter', 40, 223, 120, 42, '签到中心', 'PingFang SC', 30, new Color(0, 0, 0, 255));

        // 签到详情 (位置: 566px, 223px, 大小: 120px, 42px, 字体: PingFang SC, 30px, #000000)
        this.signInDetailLabel = this.createLabel('SignInDetail', 566, 223, 120, 42, '签到详情', 'PingFang SC', 30, new Color(0, 0, 0, 255));

        // 连续签到一年获手机 (位置: 40px, 329px, 大小: 270px, 42px, 字体: PingFang SC, 30px, #000000)
        this.continuousSignLabel = this.createLabel('ContinuousSign', 40, 329, 270, 42, '连续签到一年获手机', 'PingFang SC', 30, new Color(0, 0, 0, 255));

        // 签到成功得金币 (位置: 40px, 375px, 大小: 140px, 28px, 字体: PingFang SC, 20px, #9C9C9C)
        this.signSuccessGoldLabel = this.createLabel('SignSuccessGold', 40, 375, 140, 28, '签到成功得金币', 'PingFang SC', 20, new Color(156, 156, 156, 255));

        // 去完成1 (位置: 598px, 333px, 大小: 78px, 37px, 字体: PingFang SC, 26px, #FFFFFF)
        this.completeLabel1 = this.createLabel('Complete1', 598, 333, 78, 37, '去完成', 'PingFang SC', 26, new Color(255, 255, 255, 255));

        // 18/365 (位置: 586px, 370px, 大小: 67px, 28px, 透明度: 60%, 字体: PingFang SC, 20px, #FFFFFF)
        this.dayCountLabel = this.createLabel('DayCount', 586, 370, 67, 28, '18/365', 'PingFang SC', 20, new Color(255, 255, 255, 153)); // 60% = 153

        // 补签到活动 (位置: 40px, 443px, 大小: 150px, 42px, 字体: PingFang SC, 30px, #000000)
        this.supplementSignLabel = this.createLabel('SupplementSign', 40, 443, 150, 42, '补签到活动', 'PingFang SC', 30, new Color(0, 0, 0, 255));

        // 去完成2 (位置: 598px, 434px, 大小: 78px, 37px, 字体: PingFang SC, 26px, #FFFFFF)
        this.completeLabel2 = this.createLabel('Complete2', 598, 434, 78, 37, '去完成', 'PingFang SC', 26, new Color(255, 255, 255, 255));

        // 0/1 (位置: 604px, 471px, 大小: 31px, 28px, 字体: PingFang SC, 20px, #FFFFFF)
        this.countLabel = this.createLabel('Count', 604, 471, 31, 28, '0/1', 'PingFang SC', 20, new Color(255, 255, 255, 255));

        // 热门活动 (位置: 40px, 564px, 大小: 120px, 42px, 字体: PingFang SC, 30px, #000000)
        this.hotActivityLabel = this.createLabel('HotActivity', 40, 564, 120, 42, '热门活动', 'PingFang SC', 30, new Color(0, 0, 0, 255));

        // 活跃任务 (位置: 40px, 800px, 大小: 120px, 42px, 字体: PingFang SC, 30px, #000000)
        this.activeTaskLabel = this.createLabel('ActiveTask', 40, 800, 120, 42, '活跃任务', 'PingFang SC', 30, new Color(0, 0, 0, 255));

        // 10分钟1 (位置: 40px, 863px, 大小: 85px, 40px, 字体: PingFang SC, 28px, #000000)
        this.tenMinutesLabel1 = this.createLabel('TenMinutes1', 40, 863, 85, 40, '10分钟', 'PingFang SC', 28, new Color(0, 0, 0, 255));

        // 50 (位置: 80px, 903px, 大小: 29px, 33px, 字体: PingFang SC, 24px, #000000)
        this.fiftyLabel = this.createLabel('Fifty', 80, 903, 29, 33, '50', 'PingFang SC', 24, new Color(0, 0, 0, 255));

        // 明日再来 (位置: 588px, 880px, 大小: 104px, 37px, 字体: PingFang SC, 26px, #6E6E6E)
        this.tomorrowComeAgainLabel = this.createLabel('TomorrowComeAgain', 588, 880, 104, 37, '明日再来', 'PingFang SC', 26, new Color(110, 110, 110, 255));

        // 10分钟2 (位置: 40px, 954px, 大小: 85px, 40px, 字体: PingFang SC, 28px, #000000)
        this.tenMinutesLabel2 = this.createLabel('TenMinutes2', 40, 954, 85, 40, '10分钟', 'PingFang SC', 28, new Color(0, 0, 0, 255));

        // 领取 (位置: 614px, 971px, 大小: 52px, 37px, 字体: PingFang SC, 26px, #FFFFFF)
        this.receiveLabel = this.createLabel('Receive', 614, 971, 52, 37, '领取', 'PingFang SC', 26, new Color(255, 255, 255, 255));

        console.log('文本节点创建完成');
    }

    /**
     * 创建图标节点
     */
    private createIconNodes() {
        // 箭头 (位置: 696px, 230px, 大小: 14px, 26px)
        this.arrowIcon = new Node('Arrow');
        this.node.addChild(this.arrowIcon);
        const arrowTransform = this.arrowIcon.addComponent(UITransform);
        this.arrowIcon.setPosition(696, -230, 0);
        arrowTransform.setContentSize(14, 26);
        const arrowWidget = this.arrowIcon.addComponent(Widget);
        arrowWidget.isAlignTop = true;
        arrowWidget.isAlignLeft = true;
        arrowWidget.top = 230;
        arrowWidget.left = 696;
        arrowWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const arrowSprite = this.arrowIcon.addComponent(Sprite);

        // 创建游戏图片节点
        this.createGameImages();

        console.log('图标节点创建完成');
    }

    /**
     * 创建游戏图片节点
     */
    private createGameImages() {
        // 电竞游戏直播... (位置: 40px, 626px, 大小: 210px, 133.94px)
        const gameImg1 = new Node('GameImage1');
        this.node.addChild(gameImg1);
        const gameTransform1 = gameImg1.addComponent(UITransform);
        gameImg1.setPosition(40, -626, 0);
        gameTransform1.setContentSize(210, 133.94);
        const gameWidget1 = gameImg1.addComponent(Widget);
        gameWidget1.isAlignTop = true;
        gameWidget1.isAlignLeft = true;
        gameWidget1.top = 626;
        gameWidget1.left = 40;
        gameWidget1.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const gameSprite1 = gameImg1.addComponent(Sprite);
        this.gameImages.push(gameImg1);

        // 弹壳特攻队... (位置: 270px, 626px, 大小: 210px, 134px)
        const gameImg2 = new Node('GameImage2');
        this.node.addChild(gameImg2);
        const gameTransform2 = gameImg2.addComponent(UITransform);
        gameImg2.setPosition(270, -626, 0);
        gameTransform2.setContentSize(210, 134);
        const gameWidget2 = gameImg2.addComponent(Widget);
        gameWidget2.isAlignTop = true;
        gameWidget2.isAlignLeft = true;
        gameWidget2.top = 626;
        gameWidget2.left = 270;
        gameWidget2.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const gameSprite2 = gameImg2.addComponent(Sprite);
        this.gameImages.push(gameImg2);

        // 弹壳特攻队... (位置: 500px, 626px, 大小: 210px, 134px)
        const gameImg3 = new Node('GameImage3');
        this.node.addChild(gameImg3);
        const gameTransform3 = gameImg3.addComponent(UITransform);
        gameImg3.setPosition(500, -626, 0);
        gameTransform3.setContentSize(210, 134);
        const gameWidget3 = gameImg3.addComponent(Widget);
        gameWidget3.isAlignTop = true;
        gameWidget3.isAlignLeft = true;
        gameWidget3.top = 626;
        gameWidget3.left = 500;
        gameWidget3.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        const gameSprite3 = gameImg3.addComponent(Sprite);
        this.gameImages.push(gameImg3);

        console.log('游戏图片节点创建完成');
    }

    /**
     * 创建Label的辅助方法
     */
    private createLabel(name: string, x: number, y: number, width: number, height: number, 
                       text: string, fontFamily: string, fontSize: number, color: Color): Label {
        const node = new Node(name);
        this.node.addChild(node);
        
        const transform = node.addComponent(UITransform);
        node.setPosition(x, -y, 0); // Cocos Y轴向上为正，所以取负值
        transform.setContentSize(width, height);
        
        const widget = node.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.top = y;
        widget.left = x;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.color = color;
        // 注意：Cocos Creator中字体设置可能需要Font资源，这里先设置字体族名
        // label.fontFamily = fontFamily; // 如果有对应的字体资源，可以设置
        
        return label;
    }

    /**
     * 初始化元素
     */
    private initializeElements() {
        console.log('初始化签到UI元素...');
        
        // 这里可以添加初始化逻辑，如设置点击事件等
        this.setupClickEvents();
    }

    /**
     * 设置点击事件
     */
    private setupClickEvents() {
        // 为按钮添加点击事件
        if (this.rectangle) {
            const button1 = this.rectangle.addComponent(Button);
            button1.node.on(Button.EventType.CLICK, this.onCompleteClick, this);
        }

        if (this.group2Copy) {
            const button2 = this.group2Copy.addComponent(Button);
            button2.node.on(Button.EventType.CLICK, this.onComplete2Click, this);
        }

        if (this.tomorrowComeAgainImg) {
            const button3 = this.tomorrowComeAgainImg.addComponent(Button);
            button3.node.on(Button.EventType.CLICK, this.onTomorrowClick, this);
        }

        if (this.receiveImg) {
            const button4 = this.receiveImg.addComponent(Button);
            button4.node.on(Button.EventType.CLICK, this.onReceiveClick, this);
        }

        console.log('点击事件设置完成');
    }

    /**
     * 按钮点击事件处理
     */
    private onCompleteClick() {
        console.log('点击了去完成按钮1');
    }

    private onComplete2Click() {
        console.log('点击了去完成按钮2');
    }

    private onTomorrowClick() {
        console.log('点击了明日再来按钮');
    }

    private onReceiveClick() {
        console.log('点击了领取按钮');
    }

    /**
     * 更新签到天数
     */
    public updateDayCount(current: number, total: number) {
        if (this.dayCountLabel) {
            this.dayCountLabel.string = `${current}/${total}`;
        }
    }

    /**
     * 更新完成进度
     */
    public updateProgress(current: number, total: number) {
        if (this.countLabel) {
            this.countLabel.string = `${current}/${total}`;
        }
    }

    /**
     * 更新金币数量
     */
    public updateCoinCount(count: number) {
        if (this.fiftyLabel) {
            this.fiftyLabel.string = count.toString();
        }
    }

    /**
     * 设置按钮是否可点击
     */
    public setButtonInteractable(buttonName: string, interactable: boolean) {
        let targetNode: Node | null = null;
        
        switch (buttonName) {
            case 'complete1':
                targetNode = this.rectangle;
                break;
            case 'complete2':
                targetNode = this.group2Copy;
                break;
            case 'tomorrow':
                targetNode = this.tomorrowComeAgainImg;
                break;
            case 'receive':
                targetNode = this.receiveImg;
                break;
        }
        
        if (targetNode) {
            const button = targetNode.getComponent(Button);
            if (button) {
                button.interactable = interactable;
            }
        }
    }

    /**
     * 获取UI节点信息（调试用）
     */
    public logUIInfo() {
        console.log('=== 签到UI信息 ===');
        console.log('背景节点数量:', 7);
        console.log('文本节点数量:', 13);
        console.log('图标节点数量:', this.gameImages.length + 1);
        console.log('分割线数量:', 4);
    }
}