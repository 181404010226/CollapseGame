import { _decorator, Component, Node, Sprite, SpriteFrame, Button, Label, tween, find, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LuckyDraw')
export class LuckyDraw extends Component {
    @property([Node])
    public prizeNodes: Node[] = [];  // 8个奖品节点

    @property([Node])
    public claimedNodes: Node[] = [];  // 8个已领取节点（对应奖品节点）

    @property(SpriteFrame)
    public selectedSprite: SpriteFrame = null;  // 选中时要显示的图片

    @property(Node)
    public drawButton: Node = null;  // 抽奖按钮

    // 关闭按钮功能已移至PopupManager

    @property(Label)
    public remainingLabel: Label = null;  // 剩余次数文本

    @property(Label)
    public probabilityLabel: Label = null;  // 中奖概率文本

    @property
    public rotateSpeed: number = 0.15;  // 转动速度，数值越大越慢

    @property
    public fadeOutTime: number = 0.5;   // 淡出动画时间

    @property
    public sceneName: string = '首页';  // 返回的场景名称

    @property({
        type: Node,
        tooltip: '幸运抽奖弹窗节点'
    })
    public winningPopup: Node = null;  // 幸运抽奖弹窗节点

    @property({
        type: Label,
        tooltip: '"幸运抽奖"标题'
    })
    public titleLabel: Label = null;  // "幸运抽奖"标题

    @property({
        type: Label,
        tooltip: '"恭喜你获得了奖励"文本'
    })
    public congratsLabel: Label = null;  // "恭喜你获得了奖励"文本

    @property({
        type: Sprite,
        tooltip: '奖品图片'
    })
    public prizeImage: Sprite = null;  // 奖品图片

    @property({
        type: Label,
        tooltip: '中奖内容（例如：1.5元）'
    })
    public prizeContent: Label = null;  // 中奖内容

    @property({
        type: Button,
        tooltip: '"开心收下"按钮'
    })
    public confirmButton: Button = null;  // "开心收下"按钮

    @property({
        type: Node,
        tooltip: '半透明背景遮罩节点'
    })
    public spriteSplash: Node | null = null;  // 半透明背景遮罩节点

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
    private readonly MIN_ROTATIONS = 20;  // 最少旋转次数(至少2.5圈)

    onLoad() {
        try {
            console.log('[系统] 开始onLoad阶段，检查组件初始化状态');
            console.log('[调试] this对象状态:', this ? '存在' : '未定义');
            console.log('[调试] prizeNodes数组长度:', this.prizeNodes ? this.prizeNodes.length : '未定义');
            console.log('[调试] claimedNodes数组长度:', this.claimedNodes ? this.claimedNodes.length : '未定义');
            console.log('[调试] selectedSprite状态:', this.selectedSprite ? '已设置' : '未设置');
            console.log('[调试] drawButton状态:', this.drawButton ? '已设置' : '未设置');
            
            this.initializeSystem();
            console.log('[系统] onLoad阶段完成');
        } catch (error) {
            console.error('[系统错误] onLoad过程中发生错误:', error);
            console.error('[错误详情] 错误类型:', typeof error);
            console.error('[错误详情] 错误消息:', error.message);
            console.error('[错误详情] 错误堆栈:', error.stack);
        }
    }

    start() {
        try {
            console.log('[系统] 开始start阶段，检查节点状态');
            console.log('[调试] Canvas状态:', find('Canvas') ? '找到Canvas' : 'Canvas未找到');
            
            // 检查所有关键节点的状态
            this.validateCriticalNodes();
            
            this.setupEventListeners();
            this.updateUI();
            console.log('[系统] start阶段完成');
        } catch (error) {
            console.error('[系统错误] start过程中发生错误:', error);
            console.error('[错误详情] 错误类型:', typeof error);
            console.error('[错误详情] 错误消息:', error.message);
            console.error('[错误详情] 错误堆栈:', error.stack);
        }
    }

    /**
     * 验证关键节点状态
     */
    private validateCriticalNodes(): void {
        console.log('[验证] 开始验证关键节点状态');
        
        // 验证奖品节点
        if (!this.prizeNodes || this.prizeNodes.length === 0) {
            console.error('[验证错误] prizeNodes未设置或为空数组');
            return;
        }
        
        this.prizeNodes.forEach((node, index) => {
            if (!node) {
                console.error(`[验证错误] prizeNodes[${index}]为null或undefined`);
            } else {
                const sprite = node.getComponent(Sprite);
                console.log(`[验证] prizeNodes[${index}]: 节点名称=${node.name}, Sprite组件=${sprite ? '存在' : '缺失'}`);
                if (!sprite) {
                    console.warn(`[验证警告] prizeNodes[${index}]缺少Sprite组件`);
                } else if (!sprite.spriteFrame) {
                    console.warn(`[验证警告] prizeNodes[${index}]的Sprite组件缺少spriteFrame`);
                }
            }
        });
        
        // 验证已领取节点
        if (!this.claimedNodes || this.claimedNodes.length === 0) {
            console.error('[验证错误] claimedNodes未设置或为空数组');
        } else {
            this.claimedNodes.forEach((node, index) => {
                if (!node) {
                    console.error(`[验证错误] claimedNodes[${index}]为null或undefined`);
                } else {
                    console.log(`[验证] claimedNodes[${index}]: 节点名称=${node.name}, 激活状态=${node.active}`);
                }
            });
        }
        
        // 验证按钮节点
        console.log('[验证] drawButton状态:', this.drawButton ? `存在(${this.drawButton.name})` : '缺失');
        // 关闭按钮验证已移除
        console.log('[验证] confirmButton状态:', this.confirmButton ? `存在(${this.confirmButton.node.name})` : '缺失');
        
        // 验证弹窗节点
        console.log('[验证] winningPopup状态:', this.winningPopup ? `存在(${this.winningPopup.name})` : '缺失');
        console.log('[验证] spriteSplash状态:', this.spriteSplash ? `存在(${this.spriteSplash.name})` : '缺失');
        
        console.log('[验证] 关键节点验证完成');
    }

    /**
     * 初始化抽奖系统
     */
    private initializeSystem(): void {
        console.log('[抽奖系统] 开始初始化');
        
        try {
            // 保存原始图片
            this.saveOriginalSprites();
            
            // 初始化已领取状态
            this.initializeClaimedStatus();
            
            // 设置弹窗层级
            this.setupPopupLayers();
            
            console.log('[抽奖系统] 初始化完成');
        } catch (error) {
            console.error('[抽奖系统错误] 初始化过程中发生错误:', error);
            console.error('[错误详情] 错误消息:', error.message);
            console.error('[错误详情] 错误堆栈:', error.stack);
        }
    }

    /**
     * 保存所有奖品节点的原始图片
     */
    private saveOriginalSprites(): void {
        console.log('[保存图片] 开始保存原始图片');
        this.originalSprites = [];
        
        if (!this.prizeNodes) {
            console.error('[保存图片错误] prizeNodes为null或undefined');
            return;
        }
        
        this.prizeNodes.forEach((node, index) => {
            try {
                console.log(`[保存图片] 处理节点${index}: ${node ? node.name : 'null/undefined'}`);
                
                if (!node) {
                    console.error(`[保存图片错误] 节点${index}为null或undefined`);
                    return;
                }
                
                const sprite = node.getComponent(Sprite);
                if (!sprite) {
                    console.error(`[保存图片错误] 节点${index}(${node.name})没有Sprite组件`);
                    return;
                }
                
                if (!sprite.spriteFrame) {
                    console.error(`[保存图片错误] 节点${index}(${node.name})的Sprite组件没有spriteFrame`);
                    return;
                }
                
                this.originalSprites.push(sprite.spriteFrame);
                console.log(`[初始化] 保存节点${index}原始图片: ${node.name}`);
            } catch (error) {
                console.error(`[保存图片错误] 处理节点${index}时发生错误:`, error);
                console.error('[错误详情] 错误消息:', error.message);
            }
        });
        console.log(`[初始化] 共保存${this.originalSprites.length}个原始图片`);
    }

    /**
     * 初始化已领取状态
     */
    private initializeClaimedStatus(): void {
        // 初始化已领取状态数组
        this.claimedPrizes = new Array(this.prizeNodes.length).fill(false);
        
        // 初始化可抽奖索引数组（包含所有奖品）
        this.availablePrizeIndices = [];
        for (let i = 0; i < this.prizeNodes.length; i++) {
            this.availablePrizeIndices.push(i);
        }
        
        // 隐藏所有已领取节点
        this.claimedNodes.forEach((node, index) => {
            if (node) {
                node.active = false;
                console.log(`[初始化] 隐藏已领取节点${index}: ${node.name}`);
            }
        });
        
        console.log(`[初始化] 可抽奖奖品数量: ${this.availablePrizeIndices.length}`);
    }

    /**
     * 设置弹窗和遮罩的层级关系
     */
    private setupPopupLayers(): void {
        const canvas = find('Canvas');
        if (!canvas) return;

        // 设置遮罩层级
        if (this.spriteSplash) {
            this.spriteSplash.parent = canvas;
            this.spriteSplash.setSiblingIndex(998);
            this.spriteSplash.active = false;
        }

        // 设置弹窗层级
        if (this.winningPopup) {
            this.winningPopup.parent = canvas;
            this.winningPopup.setSiblingIndex(999);
            this.winningPopup.active = false;
        }
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        console.log('[事件监听] 开始设置事件监听器');
        
        try {
            // 抽奖按钮
            if (this.drawButton) {
                console.log('[事件监听] 设置抽奖按钮事件监听器');
                this.drawButton.on(Node.EventType.TOUCH_END, this.onDrawButtonClick, this);
            } else {
                console.error('[事件监听错误] drawButton未设置，无法添加事件监听器');
            }

            // 关闭按钮功能已移至PopupManager

            // 确认按钮
            if (this.confirmButton) {
                if (this.confirmButton.node) {
                    console.log('[事件监听] 设置确认按钮事件监听器');
                    this.confirmButton.node.on(Node.EventType.TOUCH_END, this.onConfirmButtonClick, this);
                } else {
                    console.error('[事件监听错误] confirmButton.node为null或undefined');
                }
            } else {
                console.error('[事件监听错误] confirmButton未设置，无法添加事件监听器');
            }
            
            console.log('[事件监听] 事件监听器设置完成');
        } catch (error) {
            console.error('[事件监听错误] 设置事件监听器时发生错误:', error);
            console.error('[错误详情] 错误消息:', error.message);
            console.error('[错误详情] 错误堆栈:', error.stack);
        }
    }

    /**
     * 更新UI显示
     */
    private updateUI(): void {
        console.log('[UI更新] 开始更新UI显示');
        
        try {
            // 更新剩余次数
            if (this.remainingLabel) {
                console.log('[UI更新] 更新剩余次数标签');
                this.remainingLabel.string = `剩余${this.remainingDraws}次`;
            } else {
                console.error('[UI更新错误] remainingLabel未设置');
            }

            // 更新按钮内的次数显示
            if (this.drawButton) {
                console.log('[UI更新] 查找抽奖按钮内的Label组件');
                const buttonLabel = this.drawButton.getComponentInChildren(Label);
                if (buttonLabel) {
                    console.log('[UI更新] 更新按钮内的次数显示');
                    buttonLabel.string = `剩余${this.remainingDraws}次`;
                } else {
                    console.warn('[UI更新警告] 抽奖按钮内没有找到Label组件');
                }
            } else {
                console.error('[UI更新错误] drawButton未设置');
            }

            // 更新概率显示
            if (this.probabilityLabel) {
                console.log('[UI更新] 更新概率显示');
                this.probabilityLabel.string = '100%中奖';
            } else {
                console.error('[UI更新错误] probabilityLabel未设置');
            }

            // 更新按钮状态
            console.log('[UI更新] 准备更新按钮状态');
            this.updateButtonState();
            
            console.log('[UI更新] UI更新完成');
        } catch (error) {
            console.error('[UI更新错误] 更新UI时发生错误:', error);
            console.error('[错误详情] 错误消息:', error.message);
            console.error('[错误详情] 错误堆栈:', error.stack);
        }
    }

    /**
     * 更新按钮交互状态
     */
    private updateButtonState(): void {
        console.log('[按钮状态] 开始更新按钮交互状态');
        
        try {
            if (this.drawButton) {
                console.log('[按钮状态] 抽奖按钮存在，查找Button组件');
                const button = this.drawButton.getComponent(Button);
                
                if (button) {
                    const shouldBeInteractable = this.remainingDraws > 0 && !this.isDrawing;
                    console.log(`[按钮状态] Button组件存在，设置交互状态: ${shouldBeInteractable}`);
                    console.log(`[按钮状态] 剩余次数: ${this.remainingDraws}, 是否正在抽奖: ${this.isDrawing}`);
                    
                    // 检查Button组件的当前状态
                    if (button.node) {
                        console.log(`[按钮状态] Button节点存在: ${button.node.name}`);
                    } else {
                        console.error('[按钮状态错误] Button组件的node属性为null或undefined');
                    }
                    
                    button.interactable = shouldBeInteractable;
                    console.log(`[按钮状态] 按钮交互状态已更新为: ${button.interactable}`);
                } else {
                    console.error('[按钮状态错误] 抽奖按钮没有Button组件');
                }
            } else {
                console.error('[按钮状态错误] drawButton为null或undefined');
            }
            
            console.log('[按钮状态] 按钮状态更新完成');
        } catch (error) {
            console.error('[按钮状态错误] 更新按钮状态时发生错误:', error);
            console.error('[错误详情] 错误类型:', typeof error);
            console.error('[错误详情] 错误消息:', error.message);
            console.error('[错误详情] 错误堆栈:', error.stack);
            
            // 打印更多调试信息
            console.error('[调试信息] this对象:', this);
            console.error('[调试信息] this.drawButton:', this.drawButton);
            console.error('[调试信息] this.remainingDraws:', this.remainingDraws);
            console.error('[调试信息] this.isDrawing:', this.isDrawing);
        }
    }

    /**
     * 抽奖按钮点击事件
     */
    private onDrawButtonClick(): void {
        if (this.canStartDraw()) {
            this.startDrawing();
        }
    }

    /**
     * 检查是否可以开始抽奖
     */
    private canStartDraw(): boolean {
        return !this.isDrawing && this.remainingDraws > 0 && this.availablePrizeIndices.length > 0;
    }

    /**
     * 开始抽奖流程
     */
    private startDrawing(): void {
        console.log('[抽奖] 开始抽奖');
        
        // 检查是否还有可抽奖的奖品
        if (this.availablePrizeIndices.length === 0) {
            console.log('[抽奖] 所有奖品都已被领取！');
            return;
        }
        
        // 设置抽奖状态
        this.isDrawing = true;
        this.remainingDraws--;
        this.rotationCount = 0;
        
        // 从可抽奖的奖品中随机选择目标位置
        const randomIndex = Math.floor(Math.random() * this.availablePrizeIndices.length);
        this.targetIndex = this.availablePrizeIndices[randomIndex];
        console.log('[抽奖] 目标位置:', this.targetIndex, '可选范围:', this.availablePrizeIndices);
        
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
        
        // 移动到下一个位置（只在可抽奖的奖品中循环）
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
        try {
            console.log(`[图片恢复] 准备恢复索引${this.currentIndex}的原始图片`);
            
            if (!this.prizeNodes) {
                console.error('[图片恢复错误] prizeNodes为null或undefined');
                return;
            }
            
            if (this.currentIndex < 0 || this.currentIndex >= this.prizeNodes.length) {
                console.error(`[图片恢复错误] currentIndex(${this.currentIndex})超出范围 [0, ${this.prizeNodes.length - 1}]`);
                return;
            }
            
            const currentNode = this.prizeNodes[this.currentIndex];
            if (!currentNode) {
                console.error(`[图片恢复错误] prizeNodes[${this.currentIndex}]为null或undefined`);
                return;
            }
            
            const sprite = currentNode.getComponent(Sprite);
            if (!sprite) {
                console.error(`[图片恢复错误] 节点${this.currentIndex}(${currentNode.name})没有Sprite组件`);
                return;
            }
            
            if (!this.originalSprites || this.currentIndex >= this.originalSprites.length) {
                console.error(`[图片恢复错误] originalSprites数组无效或索引${this.currentIndex}超出范围`);
                return;
            }
            
            const originalSprite = this.originalSprites[this.currentIndex];
            if (!originalSprite) {
                console.error(`[图片恢复错误] originalSprites[${this.currentIndex}]为null或undefined`);
                return;
            }
            
            sprite.spriteFrame = originalSprite;
            console.log(`[图片恢复] 成功恢复节点${this.currentIndex}(${currentNode.name})的原始图片`);
        } catch (error) {
            console.error('[图片恢复错误] 恢复原始图片时发生错误:', error);
            console.error('[错误详情] 错误消息:', error.message);
            console.error('[错误详情] currentIndex:', this.currentIndex);
            console.error('[错误详情] prizeNodes长度:', this.prizeNodes?.length);
            console.error('[错误详情] originalSprites长度:', this.originalSprites?.length);
        }
    }

    /**
     * 移动到下一个可抽奖的索引位置
     */
    private moveToNextAvailableIndex(): void {
        // 在可抽奖的奖品索引中循环
        const currentAvailableIndex = this.availablePrizeIndices.indexOf(this.currentIndex);
        if (currentAvailableIndex >= 0) {
            // 如果当前索引在可抽奖列表中，移动到下一个
            const nextAvailableIndex = (currentAvailableIndex + 1) % this.availablePrizeIndices.length;
            this.currentIndex = this.availablePrizeIndices[nextAvailableIndex];
        } else {
            // 如果当前索引不在可抽奖列表中，移动到第一个可抽奖的
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
     * 处理中奖奖品的逻辑
     */
    private handlePrizeWon(): void {
        console.log('[中奖处理] 处理中奖奖品，索引:', this.targetIndex);
        
        // 标记奖品为已领取
        this.claimedPrizes[this.targetIndex] = true;
        
        // 显示对应的已领取节点
        if (this.claimedNodes[this.targetIndex]) {
            this.claimedNodes[this.targetIndex].active = true;
            console.log('[中奖处理] 显示已领取节点:', this.claimedNodes[this.targetIndex].name);
        }
        
        // 从可抽奖列表中移除该奖品
        const indexToRemove = this.availablePrizeIndices.indexOf(this.targetIndex);
        if (indexToRemove > -1) {
            this.availablePrizeIndices.splice(indexToRemove, 1);
            console.log('[中奖处理] 移除奖品索引:', this.targetIndex, '剩余可抽奖:', this.availablePrizeIndices);
        }
        
        // 如果当前索引被移除了，重置到第一个可用位置
        if (this.availablePrizeIndices.length > 0) {
            this.currentIndex = this.availablePrizeIndices[0];
        }
    }

    /**
     * 停止抽奖并显示结果
     */
    private stopDrawing(): void {
        console.log('[抽奖] 停止抽奖');
        
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
     * 显示中奖弹窗
     */
    private showWinningPopup(): void {
        console.log('[弹窗] 显示中奖结果');
        
        if (!this.winningPopup) {
            console.error('[弹窗] 中奖弹窗未设置');
            return;
        }

        // 显示遮罩和弹窗
        this.showPopupBackground();
        
        // 设置中奖信息
        this.setupWinningInfo();
        
        // 播放弹窗动画
        this.playPopupShowAnimation();
    }

    /**
     * 显示弹窗背景和遮罩
     */
    private showPopupBackground(): void {
        if (this.spriteSplash) {
            this.spriteSplash.active = true;
        }
        this.winningPopup.active = true;
    }

    /**
     * 设置中奖信息
     */
    private setupWinningInfo(): void {
        const winningNode = this.prizeNodes[this.targetIndex];
        if (!winningNode) return;

        // 设置中奖内容文本 - 读取奖品节点上Label的文本内容
        if (this.prizeContent) {
            const winningLabel = winningNode.getComponentInChildren(Label);
            if (winningLabel) {
                this.prizeContent.string = winningLabel.string;
                console.log('[弹窗] 已设置中奖内容:', winningLabel.string);
            } else {
                console.warn('[弹窗] 未找到奖品节点的Label组件');
                this.prizeContent.string = winningNode.name; // 降级方案
            }
        }

        // 设置中奖图片
        this.setupWinningImage(winningNode);
    }

    /**
     * 设置中奖图片
     */
    private setupWinningImage(winningNode: Node): void {
        if (!this.prizeImage) return;

        // 从Canvas下的奖品图片容器获取对应图片
        const canvas = find('Canvas');
        const prizeContainer = canvas?.getChildByName('抽奖奖品图片');
        const prizeNode = prizeContainer?.getChildByName(winningNode.name);
        const prizeSprite = prizeNode?.getComponent(Sprite);

        if (prizeSprite?.spriteFrame) {
            this.prizeImage.node.active = true;
            this.prizeImage.spriteFrame = prizeSprite.spriteFrame;
            this.prizeImage.node.scale = Vec3.ONE;
            console.log('[弹窗] 已设置中奖图片:', winningNode.name);
        }
    }

    /**
     * 播放弹窗显示动画
     */
    private playPopupShowAnimation(): void {
        const animationNodes = [
            this.titleLabel?.node,
            this.congratsLabel?.node,
            this.prizeContent?.node,
            this.confirmButton?.node
        ];

        // 初始化节点状态
        animationNodes.forEach(node => {
            if (node && node !== this.prizeImage?.node) {
                node.active = true;
                node.scale = Vec3.ZERO;
            }
        });

        // 依次播放动画
        this.playNodesAnimation(animationNodes, 0);
    }

    /**
     * 依次播放节点动画
     */
    private playNodesAnimation(nodes: (Node | null | undefined)[], index: number): void {
        if (index >= nodes.length) return;

        const node = nodes[index];
        if (!node) {
            this.playNodesAnimation(nodes, index + 1);
            return;
        }

        // 播放缩放动画
        tween(node)
            .to(0.2, { scale: new Vec3(1.1, 1.1, 1) })
            .to(0.1, { scale: Vec3.ONE })
            .call(() => {
                this.playNodesAnimation(nodes, index + 1);
            })
            .start();
    }

    /**
     * 确认按钮点击事件
     */
    private onConfirmButtonClick(): void {
        console.log('[弹窗] 点击确认按钮');
        this.hideWinningPopup();
    }

    /**
     * 隐藏中奖弹窗
     */
    private hideWinningPopup(): void {
        if (!this.winningPopup) return;

        // 播放关闭动画
        tween(this.winningPopup)
            .to(0.2, { scale: Vec3.ZERO })
            .call(() => {
                this.winningPopup.active = false;
                if (this.spriteSplash) {
                    this.spriteSplash.active = false;
                }
                // 重置弹窗缩放
                this.winningPopup.scale = Vec3.ONE;
            })
            .start();
    }

    // 关闭按钮功能已移至PopupManager

    /**
     * 组件销毁时清理
     */
    onDestroy(): void {
        console.log('[销毁] 开始销毁组件，进行资源清理');
        
        try {
            // 清理定时器
            console.log('[销毁] 清理所有定时器');
            this.unscheduleAllCallbacks();
            
            // 清理事件监听
            console.log('[销毁] 开始清理事件监听器');
            
            if (this.drawButton) {
                console.log('[销毁] 清理抽奖按钮事件监听器');
                this.drawButton.off(Node.EventType.TOUCH_END, this.onDrawButtonClick, this);
            } else {
                console.warn('[销毁警告] drawButton为null，跳过事件清理');
            }
            
            // 关闭按钮清理代码已移至PopupManager
            
            if (this.confirmButton) {
                if (this.confirmButton.node) {
                    console.log('[销毁] 清理确认按钮事件监听器');
                    this.confirmButton.node.off(Node.EventType.TOUCH_END, this.onConfirmButtonClick, this);
                } else {
                    console.warn('[销毁警告] confirmButton.node为null，跳过事件清理');
                }
            } else {
                console.warn('[销毁警告] confirmButton为null，跳过事件清理');
            }
            
            // 清理状态变量
            console.log('[销毁] 重置状态变量');
            this.isDrawing = false;
            this.currentIndex = 0;
            this.targetIndex = -1;
            this.rotationCount = 0;
            
            console.log('[系统] 抽奖组件已销毁');
        } catch (error) {
            console.error('[销毁错误] 销毁组件时发生错误:', error);
            console.error('[错误详情] 错误消息:', error.message);
            console.error('[错误详情] 错误堆栈:', error.stack);
        }
    }
} 