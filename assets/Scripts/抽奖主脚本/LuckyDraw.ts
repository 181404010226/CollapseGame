import { _decorator, Component, Node, Sprite, SpriteFrame, Button, Label, find, Vec3 } from 'cc';
import { ApiConfig, LotteryItem, BaseReq, AjaxResult } from '../../API/ApiConfig';
import { GameProgressManager } from '../GameProgressManager';
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

    @property(Label)
    public extraRemainingLabel: Label = null; // 额外剩余次数文本

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
        type: Label,
        tooltip: '重置倒计时显示'
    })
    public resetCountdownLabel: Label = null;  // 重置倒计时显示

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
    private previousClaimed: boolean[] = []; // 记录抽奖前的已领取状态
    
    // 公共参数
    public resetTime: number = 0;  // 重置时间戳

    // 常量配置
    private readonly MIN_ROTATIONS = 20;  // 最少旋转次数

    onLoad() {
        this.initializeSystem();
    }

    start() {
        this.setupEventListeners();
        
        // 检查是否需要重置抽奖状态
        if (this.shouldReset()) {
            this.resetLotteryState();
        }
        
        // 获取抽奖数据并更新UI
        this.fetchLotteryData().then(() => {
            this.updateUI();
        }).catch(error => {
            console.error('LuckyDraw: 获取抽奖数据失败:', error);
            this.updateUI(); // 即使失败也要更新UI
        });
    }

    /**
     * 初始化抽奖系统
     */
    private async initializeSystem(): Promise<void> {
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
        this.previousClaimed = [...this.claimedPrizes]; // Initialize previous claimed state

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

    private async fetchLotteryData(): Promise<void> {
        try {
            const url = ApiConfig.getFullUrl(ApiConfig.ENDPOINTS.LOTTERY);
            const token = ApiConfig.getUserData()?.access_token;
            if (!token) throw new Error('No token');
            
            // 输出请求信息
            console.log('=== 网络请求 - 获取抽奖数据 ===');
            console.log('请求URL:', url);
            console.log('请求方法: GET');
            console.log('请求头:', { Authorization: `Bearer ${token}` });
            console.log('请求体: 无');

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                console.log('=== 网络响应错误 - 获取抽奖数据 ===');
                console.log('HTTP状态码:', response.status);
                throw new Error('Fetch failed');
            }
            
            const rawData = await response.json();
            
            // 输出响应信息
            console.log('=== 网络响应 - 获取抽奖数据 ===');
            console.log('响应状态:', response.status);
            console.log('响应数据:', rawData);
            
            if (rawData.code !== 200) throw new Error('API error: ' + rawData.msg);
            
            const prizes = rawData.data.detail;
            console.log('Prize details:', JSON.stringify(prizes));
            
            // 更新剩余抽奖次数
            this.remainingDraws = rawData.data.count;
            
            // 更新重置时间
            if (rawData.data.resetTime) {
                this.resetTime = rawData.data.resetTime;
                console.log('Updated resetTime:', this.resetTime);
            }
            
            let data: LotteryItem[] = Array.isArray(prizes) ? prizes : [prizes];
            if (data.length !== 8) {
                console.warn('Unexpected number of prizes:', data.length);
            }
            
            // Setup prizes based on data (assume 8 items)
            this.availablePrizeIndices = [];
            this.claimedPrizes = new Array(8).fill(false);
            
            data.forEach((item, index) => {
                // Set prize node labels etc.
                const prizeNode = this.prizeNodes[index];
                if (prizeNode) {
                    const label = prizeNode.getComponentInChildren(Label);
                    if (label) {
                        label.string = `${item.rewardNum} ${item.rewardType === 'gold' ? '金币' : '红包'}`;
                    }
                }
                if (item.isWin) {
                    this.claimedPrizes[index] = true;
                    this.claimedNodes[index].active = true;
                } else {
                    this.availablePrizeIndices.push(index);
                }
            });
            
            // 更新UI显示
            this.updateUI();
            
        } catch (error) {
            console.error('Failed to fetch lottery data:', error);
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
     * 获取重置时间
     * @returns 重置时间戳
     */
    public getResetTime(): number {
        return this.resetTime;
    }

    /**
     * 设置重置时间
     * @param resetTime 重置时间戳
     */
    public setResetTime(resetTime: number): void {
        this.resetTime = resetTime;
        console.log('LuckyDraw: 重置时间已更新为:', resetTime);
    }

    /**
     * 检查是否需要重置抽奖状态
     * @returns 是否需要重置
     */
    public shouldReset(): boolean {
        if (this.resetTime <= 0) {
            return false;
        }
        const currentTime = Date.now();
        return currentTime >= this.resetTime;
    }

    /**
     * 重置抽奖状态
     */
    public resetLotteryState(): void {
        console.log('LuckyDraw: 重置抽奖状态');
        
        // 重置已领取状态
        this.claimedPrizes = new Array(this.prizeNodes.length).fill(false);
        
        // 隐藏所有已领取节点
        this.claimedNodes.forEach(node => {
            if (node) {
                node.active = false;
            }
        });
        
        // 重置可用奖品索引
        this.availablePrizeIndices = [];
        for (let i = 0; i < this.prizeNodes.length; i++) {
            this.availablePrizeIndices.push(i);
        }
        
        // 重置重置时间
        this.resetTime = 0;
        
        // 更新UI
        this.updateUI();
    }

    /**
     * 更新重置倒计时显示
     */
    private updateResetCountdown(): void {
        if (!this.resetCountdownLabel) {
            return;
        }

        if (this.resetTime <= 0) {
            this.resetCountdownLabel.string = '';
            return;
        }

        // 修复：直接使用服务器返回的resetTime作为小时数，不需要计算时间差
        // 服务器返回的resetTime就是剩余小时数
        const remainingHours = this.resetTime;
        
        if (remainingHours <= 0) {
            this.resetCountdownLabel.string = '可重置';
            return;
        }

        this.resetCountdownLabel.string = `${remainingHours}小时后重置`;
    }

    /**
     * 更新UI显示
     */
    private updateUI(): void {
        // 更新剩余次数
        if (this.remainingLabel) {
            this.remainingLabel.string = `剩余${this.remainingDraws}次`;
        }

        if (this.extraRemainingLabel) {
            this.extraRemainingLabel.string = `剩余${this.remainingDraws}次`;
        }

        // 更新重置倒计时
        this.updateResetCountdown();

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
    private async startDrawing(): Promise<void> {
        // 检查是否还有可抽奖的奖品
        if (this.availablePrizeIndices.length === 0) {
            return;
        }
        
        // 设置抽奖状态
        this.isDrawing = true;
        this.rotationCount = 0;
        
        try {
            // 修复：先从服务器获取抽奖结果，再开始动画
            console.log('LuckyDraw: 开始从服务器获取抽奖结果...');
            const prizeResult = await this.drawPrize();
            this.targetIndex = prizeResult.id;
            
            console.log(`LuckyDraw: 服务器返回中奖索引: ${this.targetIndex}`);
            
            // 减少剩余次数（在获取到服务器结果后）
            this.remainingDraws--;
            
            // 更新UI
            this.updateUI();
            
            // 开始循环动画
            this.schedule(this.rotateToNext, this.rotateSpeed);
            
        } catch (error) {
            console.error('LuckyDraw: 获取抽奖结果失败:', error);
            // 恢复状态
            this.isDrawing = false;
            this.updateUI();
        }
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
        
        // 延迟处理中奖结果，让动画效果更好
        this.scheduleOnce(() => {
            // 修复：先显示中奖弹窗，再更新已领取状态
            // 显示中奖弹窗
            this.showWinningPopup();
        }, 0.5); // 延迟0.5秒，让用户看清最终停止位置
    }

    /**
     * 处理中奖奖品的逻辑
     */
    private async handlePrizeWon(): Promise<void> {
        try {
            // 修复：在用户确认后同步服务器数据并更新UI状态
            console.log('LuckyDraw: 开始同步服务器数据...');
            
            // 重新获取抽奖数据以更新状态
            await this.fetchLotteryData();
            
            // 同步用户进度信息
            const manager = find('GameProgressManager')?.getComponent(GameProgressManager);
            if (manager) {
                try {
                    await manager.loadServerProgress();
                    console.log('LuckyDraw: 用户信息同步成功');
                } catch (syncError) {
                    console.warn('LuckyDraw: 用户信息同步失败:', syncError);
                }
            } else {
                console.warn('LuckyDraw: 未找到GameProgressManager，无法同步用户信息');
            }
            
            console.log('LuckyDraw: 服务器数据同步完成');
            
        } catch (error) {
            console.error('LuckyDraw: 同步服务器数据失败:', error);
            
            // 如果同步失败，使用本地逻辑更新状态
            console.log('LuckyDraw: 使用本地逻辑更新中奖状态');
            
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
    private async onConfirmButtonClick(): Promise<void> {
        try {
            // 修复：在用户确认后才更新已领取状态
            await this.handlePrizeWon();
            
            // 更新UI
            this.updateUI();
            
        } catch (error) {
            console.error('LuckyDraw: 处理中奖确认失败:', error);
        } finally {
            // 无论成功失败都隐藏弹窗
            this.hideWinningPopup();
        }
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
    public async showLuckyDrawPopup(): Promise<void> {
        await this.fetchLotteryData();
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

    private async drawPrize(): Promise<{id: number}> {
        try {
            const url = ApiConfig.getFullUrl(ApiConfig.ENDPOINTS.PRIZE);
            const token = ApiConfig.getUserData()?.access_token;
            if (!token) throw new Error('No token');
            
            // 从ApiConfig获取设备信息，避免依赖DeviceInfoCollector组件
            const deviceInfo = ApiConfig.getDefaultDeviceInfo();
            
            // 保存抽奖前的已领取状态
            this.previousClaimed = [...this.claimedPrizes];
            
            const req: BaseReq = {
                androidId: deviceInfo.androidId || '',
                deviceId: deviceInfo.deviceId || '',
                requestId: `draw_${Date.now()}`,
                timeStamp: Date.now(),
                packageName: ApiConfig.getPackageName()
            };
            
            // 输出请求信息
            console.log('=== 网络请求 - 抽奖 ===');
            console.log('请求URL:', url);
            console.log('请求方法: POST');
            console.log('请求头:', { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });
            console.log('请求体:', req);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(req)
            });
            
            if (!response.ok) {
                console.log('=== 网络响应错误 - 抽奖 ===');
                console.log('HTTP状态码:', response.status);
                throw new Error('Draw failed');
            }
            
            const data: {code: number, msg: string, data: any} = await response.json();
            
            // 输出响应信息
            console.log('=== 网络响应 - 抽奖 ===');
            console.log('响应状态:', response.status);
            console.log('响应数据:', data);
            
            // 检查API响应状态：code为200表示成功
            if (data.code !== 200) {
                throw new Error(`Draw failed: ${data.msg || 'Unknown error'}`);
            }
            
            console.log('LuckyDraw: 抽奖成功，获取中奖结果');
            
            // 修复：不在这里立即更新状态，只获取中奖信息用于动画
            // 从API响应中获取中奖的奖品ID
            const prizeId = data.data?.prizeId || 1; // 假设API返回prizeId字段
            
            // 将prizeId转换为数组索引（prizeId通常从1开始，数组索引从0开始）
            const wonIndex = prizeId - 1;
            
            console.log(`LuckyDraw: 服务器返回中奖ID: ${prizeId}, 对应索引: ${wonIndex}`);
            
            // 验证索引有效性
            if (wonIndex >= 0 && wonIndex < this.prizeNodes.length) {
                return {id: wonIndex};
            } else {
                console.warn(`LuckyDraw: 中奖索引 ${wonIndex} 无效，使用第一个可用奖品`);
                return {id: this.availablePrizeIndices.length > 0 ? this.availablePrizeIndices[0] : 0};
            }
            
        } catch (error) {
            console.error('LuckyDraw: 抽奖失败:', error);
            throw error;
        }
    }
}