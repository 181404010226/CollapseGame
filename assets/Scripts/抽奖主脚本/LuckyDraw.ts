import { _decorator, Component, Node, Sprite, SpriteFrame, Button, Label, find, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LuckyDraw')
export class LuckyDraw extends Component {
    @property([Node])
    public prizeNodes: Node[] = [];  // 8个奖品节点

    @property([Node])
    public claimedNodes: Node[] = [];  // 8个已领取节点

    @property(SpriteFrame)
    public selectedSprite: SpriteFrame = null;  // 选中时要显示的图片

    @property(Node)
    public drawButton: Node = null;  // 抽奖按钮

    @property(Label)
    public remainingLabel: Label = null;  // 剩余次数文本

    @property
    public rotateSpeed: number = 0.15;  // 转动速度

    @property({
        type: Node,
        tooltip: '中奖弹窗节点'
    })
    public winningPopup: Node = null;  // 中奖弹窗节点

    @property({
        type: Node,
        tooltip: '整个抽奖界面根节点'
    })
    public luckyDrawRoot: Node = null;  // 整个抽奖界面根节点

    @property({
        type: Label,
        tooltip: '中奖内容文本'
    })
    public prizeContent: Label = null;  // 中奖内容

    @property({
        type: Button,
        tooltip: '确认按钮'
    })
    public confirmButton: Button = null;  // 确认按钮

    @property({
        type: Node,
        tooltip: '背景遮罩节点'
    })
    public spriteSplash: Node = null;  // 背景遮罩节点

    @property({
        type: Node,
        tooltip: '中奖弹窗背景节点'
    })
    public winningBackground: Node = null;  // 中奖结果背景遮罩节点

    // 私有状态变量
    private isDrawing: boolean = false;  // 是否正在抽奖
    private currentIndex: number = 0;    // 当前高亮索引
    private targetIndex: number = -1;    // 目标中奖索引
    private rotationCount: number = 0;   // 已旋转次数
    private remainingDraws: number = 8;  // 剩余抽奖次数
    private originalSprites: SpriteFrame[] = [];  // 原始图片
    private availablePrizeIndices: number[] = [];  // 可抽奖的奖品索引数组
    private claimedPrizes: boolean[] = [];  // 记录每个奖品是否已被领取

    // 常量配置
    private readonly MIN_ROTATIONS = 20;  // 最少旋转次数

    onLoad() {
        this.initializeSystem();
    }

    start() {
        this.setupEventListeners();
        this.updateUI();
    }

    /**
     * 初始化抽奖系统
     */
    private initializeSystem(): void {
        // 保存原始图片
        this.originalSprites = [];
        this.prizeNodes.forEach((node, index) => {
            if (node) {
                const sprite = node.getComponent(Sprite);
                if (sprite && sprite.spriteFrame) {
                    this.originalSprites.push(sprite.spriteFrame);
                }
            }
        });

        // 初始化已领取状态
        this.claimedPrizes = new Array(this.prizeNodes.length).fill(false);
        this.availablePrizeIndices = [];
        for (let i = 0; i < this.prizeNodes.length; i++) {
            this.availablePrizeIndices.push(i);
        }

        // 隐藏所有已领取节点
        this.claimedNodes.forEach(node => {
            if (node) {
                node.active = false;
            }
        });

        // 初始隐藏弹窗
        if (this.winningPopup) {
            this.winningPopup.active = false;
        }
        if (this.winningBackground) {
            this.winningBackground.active = false;
        }
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 抽奖按钮
        if (this.drawButton) {
            this.drawButton.on(Node.EventType.TOUCH_END, this.onDrawButtonClick, this);
        }

        // 确认按钮
        if (this.confirmButton && this.confirmButton.node) {
            this.confirmButton.node.on(Node.EventType.TOUCH_END, this.onConfirmButtonClick, this);
        }
    }

    /**
     * 更新UI显示
     */
    private updateUI(): void {
        // 更新剩余次数
        if (this.remainingLabel) {
            this.remainingLabel.string = `剩余${this.remainingDraws}次`;
        }

        // 更新按钮内的次数显示
        if (this.drawButton) {
            const buttonLabel = this.drawButton.getComponentInChildren(Label);
            if (buttonLabel) {
                buttonLabel.string = `剩余${this.remainingDraws}次`;
            }
        }

        // 更新按钮状态
        this.updateButtonState();
    }

    /**
     * 更新按钮交互状态
     */
    private updateButtonState(): void {
        if (this.drawButton) {
            const button = this.drawButton.getComponent(Button);
            if (button) {
                button.interactable = this.remainingDraws > 0 && !this.isDrawing;
            }
        }
    }

    /**
     * 抽奖按钮点击事件
     */
    private onDrawButtonClick(): void {
        if (!this.isDrawing && this.remainingDraws > 0 && this.availablePrizeIndices.length > 0) {
            this.startDrawing();
        }
    }

    /**
     * 开始抽奖流程
     */
    private startDrawing(): void {
        // 检查是否还有可抽奖的奖品
        if (this.availablePrizeIndices.length === 0) {
            return;
        }
        
        // 设置抽奖状态
        this.isDrawing = true;
        this.remainingDraws--;
        this.rotationCount = 0;
        
        // 从可抽奖的奖品中随机选择目标位置
        const randomIndex = Math.floor(Math.random() * this.availablePrizeIndices.length);
        this.targetIndex = this.availablePrizeIndices[randomIndex];
        
        // 更新UI
        this.updateUI();
        
        // 开始循环动画
        this.schedule(this.rotateToNext, this.rotateSpeed);
    }

    /**
     * 旋转到下一个位置
     */
    private rotateToNext(): void {
        // 恢复当前位置的原始图片
        this.restoreCurrentSprite();
        
        // 移动到下一个位置
        this.moveToNextAvailableIndex();
        
        // 设置新位置的选中效果
        this.setCurrentSelectedSprite();
        
        // 检查是否应该停止
        if (this.shouldStop()) {
            this.stopDrawing();
        }
    }

    /**
     * 恢复当前位置的原始图片
     */
    private restoreCurrentSprite(): void {
        if (this.currentIndex >= 0 && this.currentIndex < this.prizeNodes.length) {
            const currentNode = this.prizeNodes[this.currentIndex];
            if (currentNode) {
                const sprite = currentNode.getComponent(Sprite);
                if (sprite && this.originalSprites[this.currentIndex]) {
                    sprite.spriteFrame = this.originalSprites[this.currentIndex];
                }
            }
        }
    }

    /**
     * 移动到下一个可抽奖的索引位置
     */
    private moveToNextAvailableIndex(): void {
        const currentAvailableIndex = this.availablePrizeIndices.indexOf(this.currentIndex);
        if (currentAvailableIndex >= 0) {
            const nextAvailableIndex = (currentAvailableIndex + 1) % this.availablePrizeIndices.length;
            this.currentIndex = this.availablePrizeIndices[nextAvailableIndex];
        } else {
            this.currentIndex = this.availablePrizeIndices[0];
        }
        this.rotationCount++;
    }

    /**
     * 设置当前位置的选中效果
     */
    private setCurrentSelectedSprite(): void {
        const currentNode = this.prizeNodes[this.currentIndex];
        const sprite = currentNode?.getComponent(Sprite);
        if (sprite && this.selectedSprite) {
            sprite.spriteFrame = this.selectedSprite;
        }
    }

    /**
     * 判断是否应该停止抽奖
     */
    private shouldStop(): boolean {
        return this.rotationCount >= this.MIN_ROTATIONS && 
               this.currentIndex === this.targetIndex;
    }

    /**
     * 停止抽奖并显示结果
     */
    private stopDrawing(): void {
        // 停止旋转动画
        this.unschedule(this.rotateToNext);
        this.isDrawing = false;
        
        // 处理中奖奖品
        this.handlePrizeWon();
        
        // 更新UI
        this.updateUI();
        
        // 显示中奖弹窗
        this.showWinningPopup();
    }

    /**
     * 处理中奖奖品的逻辑
     */
    private handlePrizeWon(): void {
        // 标记奖品为已领取
        this.claimedPrizes[this.targetIndex] = true;
        
        // 显示对应的已领取节点
        if (this.claimedNodes[this.targetIndex]) {
            this.claimedNodes[this.targetIndex].active = true;
        }
        
        // 从可抽奖列表中移除该奖品
        const indexToRemove = this.availablePrizeIndices.indexOf(this.targetIndex);
        if (indexToRemove > -1) {
            this.availablePrizeIndices.splice(indexToRemove, 1);
        }
        
        // 如果当前索引被移除了，重置到第一个可用位置
        if (this.availablePrizeIndices.length > 0) {
            this.currentIndex = this.availablePrizeIndices[0];
        }
    }

    /**
     * 显示中奖弹窗
     */
    private showWinningPopup(): void {
        if (!this.winningPopup) return;

        // 显示中奖弹窗背景（保持背景蒙版）
        if (this.winningBackground) {
            this.winningBackground.active = true;
        }
        
        // 设置中奖信息
        this.setupWinningInfo();
        
        // 显示弹窗
        this.winningPopup.active = true;
    }

    /**
     * 设置中奖信息
     */
    private setupWinningInfo(): void {
        const winningNode = this.prizeNodes[this.targetIndex];
        if (!winningNode || !this.prizeContent) return;

        // 设置中奖内容文本
        const winningLabel = winningNode.getComponentInChildren(Label);
        if (winningLabel) {
            this.prizeContent.string = winningLabel.string;
        } else {
            this.prizeContent.string = winningNode.name;
        }
    }

    /**
     * 确认按钮点击事件
     */
    private onConfirmButtonClick(): void {
        this.hideWinningPopup();
    }

    /**
     * 隐藏中奖弹窗
     */
    private hideWinningPopup(): void {
        if (this.winningPopup) {
            this.winningPopup.active = false;
        }
        if (this.winningBackground) {
            this.winningBackground.active = false;
        }
    }

    /**
     * 显示抽奖弹窗 - 供外部按钮调用
     * 点击首页时调用此方法显示抽奖页面（背景蒙版保持）
     */
    public showLuckyDrawPopup(): void {
        // 显示整个抽奖界面
        if (this.luckyDrawRoot) {
            this.luckyDrawRoot.active = true;
        } else if (this.node) {
            this.node.active = true;
        }
        
        // 显示背景蒙版
        if (this.spriteSplash) {
            this.spriteSplash.active = true;
        }
    }

    /**
     * 隐藏抽奖弹窗 - 供外部调用
     */
    public hideLuckyDrawPopup(): void {
        // 隐藏整个抽奖界面
        if (this.luckyDrawRoot) {
            this.luckyDrawRoot.active = false;
        } else if (this.node) {
            this.node.active = false;
        }
        
        // 隐藏背景蒙版
        if (this.spriteSplash) {
            this.spriteSplash.active = false;
        }
        
        // 隐藏中奖弹窗
        this.hideWinningPopup();
    }

    /**
     * 组件销毁时清理
     */
    onDestroy(): void {
        // 清理定时器
        this.unscheduleAllCallbacks();
        
        // 清理事件监听
        if (this.drawButton && this.drawButton.isValid) {
            this.drawButton.off(Node.EventType.TOUCH_END, this.onDrawButtonClick, this);
        }
        
        if (this.confirmButton && this.confirmButton.isValid && this.confirmButton.node && this.confirmButton.node.isValid) {
            this.confirmButton.node.off(Node.EventType.TOUCH_END, this.onConfirmButtonClick, this);
        }
        
        // 重置状态变量
        this.isDrawing = false;
        this.currentIndex = 0;
        this.targetIndex = -1;
        this.rotationCount = 0;
    }
} 