import { _decorator, Component, Node, Prefab, instantiate, Button, Label, Sprite, SpriteFrame, resources } from 'cc';
import { SignInService, ActiveTaskResponse, ActiveTaskData } from './SignInService';
import { OnlineTimeManager } from './OnlineTimeManager';

const { ccclass, property } = _decorator;

/**
 * 任务按钮状态枚举
 */
export enum TaskButtonState {
    IN_PROGRESS = 'in_progress',    // 进行中（黄色）
    COUNTDOWN = 'countdown',        // 倒计时（黄色，显示具体时间）
    CLAIMABLE = 'claimable',        // 可领取（红色）
    COMPLETED = 'completed'         // 已完成（灰色）
}

/**
 * 按钮状态配置
 */
interface ButtonStateConfig {
    text: string;
    interactable: boolean;
    spritePath: string;
}

/**
 * 倒计时任务信息
 */
interface CountdownTaskInfo {
    taskIndex: number;
    remainingSeconds: number;
    totalSeconds: number;
}

@ccclass('TaskCenterPageController')
export class TaskCenterPageController extends Component {

    @property(Prefab)
    taskNodePrefab: Prefab = null;

    @property(Node)
    taskContainer: Node = null;

    @property(SignInService)
    signInService: SignInService = null;

    // 私有属性
    private taskNodes: Node[] = [];
    private taskData: ActiveTaskResponse = null;
    private currentCountdownTask: CountdownTaskInfo = null;
    private countdownTimer: number = null;

    // 按钮状态配置映射
    private readonly BUTTON_STATE_CONFIG: Record<TaskButtonState, ButtonStateConfig> = {
        [TaskButtonState.IN_PROGRESS]: {
            text: '进行中',
            interactable: false,
            spritePath: '切图/任务中心/进行中/spriteFrame'
        },
        [TaskButtonState.COUNTDOWN]: {
            text: '00:00',
            interactable: false,
            spritePath: '切图/任务中心/进行中/spriteFrame'
        },
        [TaskButtonState.CLAIMABLE]: {
            text: '领取',
            interactable: true,
            spritePath: '切图/任务中心/领取/spriteFrame'
        },
        [TaskButtonState.COMPLETED]: {
            text: '明日再来',
            interactable: false,
            spritePath: '切图/任务中心/明日再来/spriteFrame'
        }
    };

    start() {
        console.log('=== TaskCenterPageController 启动 ===');

        // 添加全局调试方法
        (window as any).debugTaskCenter = () => {
            console.log(this.getDebugInfo());
        };

        // 添加手动启动倒计时的方法
        (window as any).startTaskCountdown = () => {
            console.log('手动启动倒计时系统...');
            this.initializeCountdownSystem();
        };

        this.loadActiveTasks();
    }

    onDestroy() {
        this.stopCountdownTimer();
        this.clearTaskNodes();
    }

    /**
     * 加载活跃任务数据
     */
    private async loadActiveTasks() {
        try {
            console.log('开始加载活跃任务数据...');

            if (!this.signInService) {
                console.error('SignInService 未设置，使用测试数据');
                this.useTestData();
                return;
            }

            this.taskData = await this.signInService.queryActiveTasks();
            console.log('获取到任务数据:', this.taskData);

            if (!this.validateTaskData(this.taskData)) {
                console.warn('任务数据验证失败，使用测试数据');
                this.useTestData();
                return;
            }

            this.createTaskNodes();
            this.initializeCountdownSystem();
        } catch (error) {
            console.error('加载活跃任务失败，使用测试数据:', error);
            this.useTestData();
        }
    }

    /**
     * 验证任务数据完整性
     */
    private validateTaskData(data: ActiveTaskResponse): boolean {
        if (!data || !data.taskMap || !Array.isArray(data.taskMap)) {
            console.error('任务数据格式错误');
            return false;
        }

        if (data.taskMap.length === 0) {
            console.warn('taskMap为空数组');
            return false;
        }

        // 验证每个任务数据的完整性
        for (let i = 0; i < data.taskMap.length; i++) {
            const task = data.taskMap[i];
            if (typeof task.gold !== 'number' || typeof task.time !== 'number') {
                console.error(`任务${i}数据格式错误:`, task);
                return false;
            }
        }

        console.log('任务数据验证通过');
        return true;
    }

    /**
     * 使用测试数据
     */
    private useTestData() {
        console.log('使用测试数据创建任务节点');

        this.taskData = {
            activeTask: null,
            taskMap: [
                { gold: 500, time: 10, status: 0 },
                { gold: 1000, time: 100, status: 0 },
                { gold: 1500, time: 1000, status: 0 },
                { gold: 2000, time: 10000, status: 0 },
                { gold: 2500, time: 10, status: 0 },
                { gold: 3000, time: 10, status: 0 },
                { gold: 3500, time: 10, status: 0 },
                { gold: 4000, time: 10, status: 0 }
            ]
        };

        this.createTaskNodes();
        this.initializeCountdownSystem();
    }

    /**
     * 验证组件完整性
     */
    private validateComponents(): boolean {
        if (!this.taskNodePrefab) {
            console.error('taskNodePrefab 未设置');
            return false;
        }

        if (!this.taskContainer) {
            console.error('taskContainer 未设置');
            return false;
        }

        return true;
    }

    /**
     * 根据后端数据创建任务节点
     */
    private createTaskNodes() {
        console.log('开始创建任务节点...');

        if (!this.validateComponents()) {
            return;
        }

        // 清除现有的任务节点
        this.clearTaskNodes();

        // 根据后端返回的taskMap数据创建节点
        this.taskData.taskMap.forEach((taskData, index) => {
            console.log(`创建第${index}个任务节点:`, taskData);
            this.createSingleTaskNode(taskData, index);
        });

        console.log(`成功创建${this.taskNodes.length}个任务节点`);
    }

    /**
     * 创建单个任务节点
     */
    private createSingleTaskNode(taskData: ActiveTaskData, index: number) {
        // 实例化预制体
        const taskNode = instantiate(this.taskNodePrefab);
        if (!taskNode) {
            console.error('无法实例化任务节点预制体');
            return;
        }

        // 添加到容器
        this.taskContainer.addChild(taskNode);
        this.taskNodes.push(taskNode);

        // 设置节点名称和位置
        taskNode.name = `TaskNode_${index}`;
        const nodeHeight = 120;
        const spacing = 10;
        const yPos = -(index * (nodeHeight + spacing));
        taskNode.setPosition(0, yPos, 0);

        // 填充数据
        this.updateTaskNodeData(taskNode, taskData, index);
    }

    /**
     * 更新任务节点数据
     */
    private updateTaskNodeData(taskNode: Node, taskData: ActiveTaskData, index: number) {
        // 计算当前任务的实际时长（非累计时长）
        const actualTaskTime = this.calculateActualTaskTime(index);

        // 更新时间显示 - 显示实际任务时长
        const timeLabel = this.findChildByName(taskNode, 'TimeLabel')?.getComponent(Label);
        if (timeLabel) {
            timeLabel.string = `${actualTaskTime}分钟`;
        }

        // 更新金币显示
        const goldLabel = this.findChildByName(taskNode, 'GoldLabel')?.getComponent(Label);
        if (goldLabel) {
            goldLabel.string = taskData.gold.toString();
        }

        // 立即设置按钮状态
        this.setTaskButtonState(taskNode, index, taskData);
    }
    /**
     * 设置任务按钮状态（核心方法）
     */
    private setTaskButtonState(taskNode: Node, taskIndex: number, taskData: ActiveTaskData): void {
        console.log(`=== 设置任务${taskIndex}按钮状态 ===`);

        // 直接确保OnlineTimeManager存在
        const timeManager = this.ensureOnlineTimeManager();

        console.log(`OnlineTimeManager状态正常，开始确定任务${taskIndex}状态...`);

        // 获取任务状态
        const currentState = this.determineTaskState(timeManager, taskIndex, taskData);

        console.log(`任务${taskIndex}最终状态: ${currentState}`);

        // 应用按钮状态
        this.applyButtonState(taskNode, currentState, taskIndex, taskData);
    }

    /**
    * 确定任务状态（基于累计在线时长）
    */
    private determineTaskState(timeManager: OnlineTimeManager, taskIndex: number, taskData: ActiveTaskData): TaskButtonState {
        console.log(`确定任务${taskIndex}状态:`);

        // 1. 检查前面的任务是否都已完成
        if (!this.areAllPreviousTasksCompleted(timeManager, taskIndex)) {
            console.log(`- 前面任务未完成，状态: 进行中`);
            return TaskButtonState.IN_PROGRESS;
        }

        // 2. 使用精确的秒数检查累计在线时长是否达到要求
        const currentOnlineSeconds = timeManager.getTotalOnlineTime();
        const requiredCumulativeMinutes = this.calculateCumulativeTime(taskIndex);
        const requiredSeconds = requiredCumulativeMinutes * 60;

        console.log(`- 累计在线时长: ${currentOnlineSeconds}秒`);
        console.log(`- 需要累计时长: ${requiredSeconds}秒(${requiredCumulativeMinutes}分钟)`);

        // 3. 检查是否已完成
        const isCompleted = timeManager.isTaskCompleted(taskIndex);
        const timeReached = currentOnlineSeconds >= requiredSeconds;

        console.log(`- 是否已完成: ${isCompleted}`);
        console.log(`- 时长是否达到: ${timeReached}`);

        // 4. 如果时长达到要求但还未标记为已完成，自动标记
        if (timeReached && !isCompleted) {
            console.log(`- 时长已达到但未标记完成，自动标记任务${taskIndex}为已完成`);
            timeManager.markTaskCompleted(taskIndex);
        }

        // 5. 如果已完成或时长已达到要求，显示为可领取
        if (isCompleted || timeReached) {
            console.log(`- 状态: 可领取`);
            return TaskButtonState.CLAIMABLE;
        }

        // 6. 检查是否是当前倒计时任务
        const isCurrentCountdown = this.currentCountdownTask && this.currentCountdownTask.taskIndex === taskIndex;
        console.log(`- 是否当前倒计时任务: ${isCurrentCountdown}`);
        if (isCurrentCountdown) {
            return TaskButtonState.COUNTDOWN;
        }

        // 7. 默认为进行中
        console.log(`- 默认状态: 进行中`);
        return TaskButtonState.IN_PROGRESS;
    }
    /**
     * 检查任务是否准备好领取（基于累计时长）
     */
    private isTaskReadyToClaim(taskIndex: number): boolean {
        const timeManager = OnlineTimeManager.getInstance();
        if (!timeManager) return false;

        // 检查前面的任务是否都已完成
        if (!this.areAllPreviousTasksCompleted(timeManager, taskIndex)) {
            console.log(`任务${taskIndex}不能领取：前面有任务未完成`);
            return false;
        }

        // 使用精确的秒数进行比较，而不是只用分钟
        const currentOnlineSeconds = timeManager.getTotalOnlineTime(); // 获取精确的总秒数
        const requiredCumulativeMinutes = this.calculateCumulativeTime(taskIndex);
        const requiredSeconds = requiredCumulativeMinutes * 60; // 转换为秒

        const timeReached = currentOnlineSeconds >= requiredSeconds;
        console.log(`任务${taskIndex}时长检查: ${currentOnlineSeconds}秒 >= ${requiredSeconds}秒(${requiredCumulativeMinutes}分钟), 达到要求: ${timeReached}`);

        return timeReached;
    }

    /**
     * 应用按钮状态（更新以支持倒计时）
     */
    private applyButtonState(taskNode: Node, state: TaskButtonState, taskIndex: number, taskData?: ActiveTaskData): void {
        const button = this.findTaskButton(taskNode);
        const label = this.findTaskButtonLabel(taskNode);

        if (!button || !label) {
            console.warn(`任务节点${taskIndex}未找到按钮或标签组件`);
            return;
        }

        const config = this.BUTTON_STATE_CONFIG[state];

        // 设置文本（倒计时状态特殊处理）
        if (state === TaskButtonState.COUNTDOWN && this.currentCountdownTask) {
            label.string = this.formatCountdownTime(this.currentCountdownTask.remainingSeconds);
        } else {
            label.string = config.text;
        }

        // 设置交互性
        button.interactable = config.interactable;

        // 设置背景图片
        this.setButtonBackground(button.node, config.spritePath);

        // 清除之前的事件监听
        button.node.off(Button.EventType.CLICK);

        // 根据状态绑定事件
        this.bindButtonEvent(button, state, taskIndex, taskData);

        console.log(`按钮状态已应用: ${state} - 任务${taskIndex}`);
    }

    /**
     * 绑定按钮事件（更新以支持倒计时）
     */
    private bindButtonEvent(button: Button, state: TaskButtonState, taskIndex: number, taskData?: ActiveTaskData): void {
        switch (state) {
            case TaskButtonState.CLAIMABLE:
                button.node.on(Button.EventType.CLICK, () => {
                    this.onClaimTaskReward(taskIndex, taskData);
                }, this);
                break;

            case TaskButtonState.IN_PROGRESS:
            case TaskButtonState.COUNTDOWN:
                button.node.on(Button.EventType.CLICK, () => {
                    this.onShowTaskProgress(taskIndex, taskData);
                }, this);
                break;

            case TaskButtonState.COMPLETED:
                // 已完成状态不绑定任何事件
                break;
        }
    }

    /**
     * 查找任务按钮
     */
    private findTaskButton(taskNode: Node): Button | null {
        const buttonNames = ['TomorrowComeImage', 'TomorrowComeAgain', 'TaskButton', 'ClaimButton'];

        for (const name of buttonNames) {
            const node = this.findChildByName(taskNode, name);
            if (node) {
                const button = node.getComponent(Button);
                if (button) return button;
            }
        }

        return null;
    }

    /**
     * 查找任务按钮标签
     */
    private findTaskButtonLabel(taskNode: Node): Label | null {
        const labelNames = ['TomorrowComeAgain', 'TomorrowComeImage', 'TaskButtonLabel', 'ClaimButtonLabel'];

        for (const name of labelNames) {
            const node = this.findChildByName(taskNode, name);
            if (node) {
                const label = node.getComponent(Label);
                if (label) return label;

                // 检查子节点中的Label
                const childLabel = node.getChildByName('Label')?.getComponent(Label);
                if (childLabel) return childLabel;
            }
        }

        return null;
    }

    /**
     * 设置按钮背景
     */
    private setButtonBackground(buttonNode: Node, spritePath: string): void {
        const sprite = buttonNode.getComponent(Sprite);
        if (!sprite) {
            console.warn('按钮节点没有Sprite组件');
            return;
        }

        resources.load(spritePath, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.warn(`加载按钮背景失败: ${spritePath}`, err);
                return;
            }
            sprite.spriteFrame = spriteFrame;
            console.log(`按钮背景已更新: ${spritePath}`);
        });
    }

    /**
     * 领取任务奖励（更新以支持倒计时流转）
     */
    private async onClaimTaskReward(taskIndex: number, taskData: ActiveTaskData): Promise<void> {
        console.log(`尝试领取任务${taskIndex}奖励`);

        const timeManager = OnlineTimeManager.getInstance();
        if (!timeManager) {
            console.error('OnlineTimeManager未初始化');
            return;
        }

        // 防止重复点击
        if (timeManager.isTaskCompleted(taskIndex)) {
            console.warn(`任务${taskIndex}已经完成`);
            return;
        }

        try {
            // 调用后端API领取奖励
            const success = await this.claimTaskRewardFromServer(taskIndex, taskData);

            if (success) {
                // 标记为已完成
                timeManager.markTaskCompleted(taskIndex);

                // 显示奖励效果
                this.showRewardEffect(taskData.gold);

                console.log(`任务${taskIndex}奖励领取成功，获得${taskData.gold}金币`);

                // 开始下一个任务的倒计时
                this.startNextTaskCountdown();

                // 更新所有UI
                this.updateAllTasksUI();
            } else {
                console.error(`任务${taskIndex}奖励领取失败`);
                this.showClaimFailedTip();
            }
        } catch (error) {
            console.error('领取奖励过程中发生错误:', error);
            this.showClaimFailedTip();
        }
    }

    /**
     * 显示任务进度（更新以支持倒计时信息）
     */
    private onShowTaskProgress(taskIndex: number, taskData: ActiveTaskData): void {
        if (this.currentCountdownTask && this.currentCountdownTask.taskIndex === taskIndex) {
            // 显示倒计时进度
            const progress = 1 - (this.currentCountdownTask.remainingSeconds / this.currentCountdownTask.totalSeconds);
            const remainingTime = this.formatCountdownTime(this.currentCountdownTask.remainingSeconds);
            console.log(`任务${taskIndex}倒计时进度: ${(progress * 100).toFixed(1)}%, 剩余时间: ${remainingTime}`);
            this.showCountdownProgressTip(remainingTime, taskData.gold);
        } else {
            // 显示普通进度
            console.log(`任务${taskIndex}: 等待前面任务完成`);
            this.showWaitingTip(taskIndex);
        }
    }

    /**
     * 从服务器领取任务奖励
     */
    private async claimTaskRewardFromServer(taskIndex: number, taskData: ActiveTaskData): Promise<boolean> {
        if (!this.signInService) {
            console.error('SignInService未设置');
            return false;
        }

        try {
            return await this.signInService.claimTaskReward(taskIndex, taskData);
        } catch (error) {
            console.error('服务器领取奖励失败:', error);
            return false;
        }
    }

    /**
     * 刷新单个任务UI
     */
    private refreshSingleTaskUI(taskIndex: number): void {
        if (!this.taskData?.taskMap || taskIndex >= this.taskData.taskMap.length || taskIndex >= this.taskNodes.length) {
            return;
        }

        const taskNode = this.taskNodes[taskIndex];
        const taskData = this.taskData.taskMap[taskIndex];

        if (!taskNode || !taskData) {
            return;
        }

        // 获取时间管理器 - 确保全局一致
        const timeManager = this.ensureOnlineTimeManager();

        // 打印详细的任务状态信息，帮助调试
        const isCompleted = timeManager.isTaskCompleted(taskIndex);
        const previousCompleted = this.areAllPreviousTasksCompleted(timeManager, taskIndex);
        const canClaim = this.isTaskReadyToClaim(taskIndex);

        console.log(`任务${taskIndex}: 已完成=${isCompleted}, 前面任务完成=${previousCompleted}, 可领取=${canClaim}`);
        console.log(`任务${taskIndex}: timeManager实例ID=${timeManager.uuid || 'unknown'}`);

        // 设置任务按钮状态
        this.setTaskButtonState(taskNode, taskIndex, taskData);
    }
    /**
     * 刷新所有任务UI
     */
    public refreshAllTasksUI(): void {
        if (!this.taskData?.taskMap) return;

        this.taskData.taskMap.forEach((taskData, index) => {
            this.refreshSingleTaskUI(index);
        });

        console.log('所有任务UI已刷新');
    }

    /**
     * 递归查找子节点
     */
    private findChildByName(parent: Node, name: string): Node | null {
        // 直接查找子节点
        const child = parent.getChildByName(name);
        if (child) return child;

        // 递归查找孙子节点
        for (let i = 0; i < parent.children.length; i++) {
            const found = this.findChildByName(parent.children[i], name);
            if (found) return found;
        }

        return null;
    }

    /**
     * 清除所有任务节点
     */
    private clearTaskNodes() {
        this.taskNodes.forEach(node => {
            if (node && node.isValid) {
                node.destroy();
            }
        });
        this.taskNodes = [];

        if (this.taskContainer) {
            this.taskContainer.removeAllChildren();
        }
    }

    /**
     * 刷新任务数据
     */
    public async refreshTasks() {
        await this.loadActiveTasks();
    }

    /**
     * 显示时长不足提示
     */
    private showTimeInsufficientTip(requiredMinutes: number, currentMinutes: number): void {
        const remainingMinutes = requiredMinutes - currentMinutes;
        console.log(`时长不足提示: 还需要${remainingMinutes}分钟`);
    }

    /**
     * 显示进度提示
     */
    private showProgressTip(currentMinutes: number, requiredMinutes: number, goldReward: number): void {
        const remainingMinutes = Math.max(0, requiredMinutes - currentMinutes);
        console.log(`进度提示: 当前${currentMinutes}分钟，还需${remainingMinutes}分钟可获得${goldReward}金币`);
    }

    /**
     * 显示奖励效果
     */
    private showRewardEffect(goldAmount: number): void {
        console.log(`显示奖励效果: +${goldAmount}金币`);
    }

    /**
     * 显示领取失败提示
     */
    private showClaimFailedTip(): void {
        console.log('显示领取失败提示');
    }

    /**
  * 获取任务状态调试信息
  */
    public getTaskStatusDebugInfo(): string {
        const timeManager = OnlineTimeManager.getInstance();
        if (!timeManager || !this.taskData?.taskMap) {
            return '无法获取任务状态信息';
        }

        let info = `=== 任务状态调试信息 ===\n`;
        info += `当前在线时长: ${Math.floor(timeManager.getTotalOnlineTime() / 60)}分${timeManager.getTotalOnlineTime() % 60}秒\n`;
        info += `已完成任务: [${Array.from(timeManager['completedTasks'] || []).join(', ')}]\n\n`;

        this.taskData.taskMap.forEach((taskData, index) => {
            const actualTime = this.calculateActualTaskTime(index);
            const cumulativeTime = this.calculateCumulativeTime(index);
            const state = this.determineTaskState(timeManager, index, taskData);
            info += `任务${index}: 实际${actualTime}分钟 (累计${cumulativeTime}分钟) -> ${state} (奖励: ${taskData.gold}金币)\n`;
        });

        return info;
    }
    /**
    * 初始化倒计时系统
    */
    private initializeCountdownSystem(): void {
        console.log('=== 开始初始化倒计时系统 ===');

        // 直接确保OnlineTimeManager存在
        const timeManager = this.ensureOnlineTimeManager();

        console.log('OnlineTimeManager状态检查:');
        console.log('- 实例存在:', !!timeManager);
        console.log('- 总在线时长:', timeManager.getTotalOnlineTimeInMinutes(), '分钟');

        // 找到第一个未完成的任务
        const nextTaskIndex = this.findNextCountdownTask();
        console.log('下一个需要倒计时的任务索引:', nextTaskIndex);

        if (nextTaskIndex !== -1) {
            console.log(`开始任务${nextTaskIndex}的倒计时`);
            this.startTaskCountdown(nextTaskIndex);
        } else {
            console.log('没有找到需要倒计时的任务');
        }

        console.log('=== 倒计时系统初始化完成 ===');
    }

    /**
     * 确保OnlineTimeManager初始化的方法
     */
    private ensureOnlineTimeManager(): OnlineTimeManager {
        let timeManager = OnlineTimeManager.getInstance();

        if (!timeManager) {
            console.log('OnlineTimeManager未初始化，立即创建...');
            timeManager = this.createOnlineTimeManager();
        }

        return timeManager;
    }

    /**
     * 创建OnlineTimeManager实例
     */
    private createOnlineTimeManager(): OnlineTimeManager {
        // 优先级顺序：PangleAdRoot > Canvas > 当前节点
        const targetNodes = [
            this.node.scene.getChildByName('PangleAdRoot'),
            this.node.scene.getChildByName('Canvas'),
            this.node
        ];

        for (const targetNode of targetNodes) {
            if (targetNode) {
                // 检查是否已有组件
                let timeManager = targetNode.getComponent(OnlineTimeManager);
                if (timeManager) {
                    console.log(`在${targetNode.name}找到OnlineTimeManager`);
                    return timeManager;
                }

                // 创建新组件
                timeManager = targetNode.addComponent(OnlineTimeManager);
                console.log(`在${targetNode.name}创建OnlineTimeManager`);

                // 立即启动计时
                if (timeManager.startTiming) {
                    timeManager.startTiming();
                }

                return timeManager;
            }
        }

        throw new Error('无法创建OnlineTimeManager：找不到合适的节点');
    }

    /**
     * 开始第一个任务倒计时
     */
    private startFirstTaskCountdown(): void {
        console.log('=== 开始第一个任务倒计时 ===');

        const timeManager = OnlineTimeManager.getInstance();
        if (!timeManager) {
            console.error('OnlineTimeManager仍然未初始化');
            return;
        }

        console.log('OnlineTimeManager状态检查:');
        console.log('- 实例存在:', !!timeManager);
        console.log('- 总在线时长:', timeManager.getTotalOnlineTimeInMinutes(), '分钟');

        // 找到第一个未完成的任务
        const nextTaskIndex = this.findNextCountdownTask();
        console.log('下一个需要倒计时的任务索引:', nextTaskIndex);

        if (nextTaskIndex !== -1) {
            console.log(`开始任务${nextTaskIndex}的倒计时`);
            this.startTaskCountdown(nextTaskIndex);
        } else {
            console.log('没有找到需要倒计时的任务');
        }
    }

    /**
     * 查找下一个需要倒计时的任务
     */
    private findNextCountdownTask(): number {
        const timeManager = OnlineTimeManager.getInstance();
        if (!timeManager || !this.taskData?.taskMap) return -1;

        console.log('=== 查找下一个倒计时任务 ===');

        // 遍历所有任务，找到第一个未完成且前面任务都已完成的任务
        for (let i = 0; i < this.taskData.taskMap.length; i++) {
            const isCompleted = timeManager.isTaskCompleted(i);
            const previousCompleted = this.areAllPreviousTasksCompleted(timeManager, i);
            const readyToClaim = this.isTaskReadyToClaim(i);

            console.log(`任务${i}: 已完成=${isCompleted}, 前面任务完成=${previousCompleted}, 可领取=${readyToClaim}`);

            // 如果当前任务未完成且前面的任务都已完成
            if (!isCompleted && previousCompleted) {
                // 检查是否已经达到了可领取状态
                if (!readyToClaim) {
                    console.log(`找到需要倒计时的任务: ${i}`);
                    return i; // 找到了需要倒计时的任务
                }
            }
        }

        console.log('没有找到需要倒计时的任务');
        return -1; // 没有找到需要倒计时的任务
    }

    /**
     * 开始任务倒计时（基于累计时长）
     */
    private startTaskCountdown(taskIndex: number): void {
        console.log(`=== 开始任务${taskIndex}倒计时 ===`);

        if (!this.taskData?.taskMap[taskIndex]) {
            console.error(`任务${taskIndex}数据不存在`);
            return;
        }

        const timeManager = OnlineTimeManager.getInstance();
        if (!timeManager) {
            console.error('OnlineTimeManager未初始化');
            return;
        }

        // 使用精确的秒数计算，而不是只用分钟
        const currentOnlineSeconds = timeManager.getTotalOnlineTime(); // 获取精确的总秒数
        const requiredCumulativeMinutes = this.calculateCumulativeTime(taskIndex);
        const requiredSeconds = requiredCumulativeMinutes * 60;

        // 计算剩余时间（精确到秒）
        const remainingSeconds = Math.max(0, requiredSeconds - currentOnlineSeconds);

        // 计算当前任务的实际时长用于显示进度
        const actualTaskTime = this.calculateActualTaskTime(taskIndex);
        const totalSeconds = actualTaskTime * 60;

        this.currentCountdownTask = {
            taskIndex: taskIndex,
            remainingSeconds: remainingSeconds,
            totalSeconds: totalSeconds
        };

        console.log(`任务${taskIndex}倒计时信息:`);
        console.log(`- 需要累计时长: ${requiredCumulativeMinutes}分钟 (${requiredSeconds}秒)`);
        console.log(`- 当前累计时长: ${currentOnlineSeconds}秒`);
        console.log(`- 当前任务实际时长: ${actualTaskTime}分钟`);
        console.log(`- 剩余时间: ${remainingSeconds}秒`);

        // 如果剩余时间大于0，启动倒计时定时器
        if (remainingSeconds > 0) {
            this.startCountdownTimer();
            console.log(`任务${taskIndex}倒计时已启动`);
        } else {
            // 如果剩余时间为0，直接标记为可领取
            console.log(`任务${taskIndex}可立即领取`);
            this.currentCountdownTask = null;
        }

        // 立即更新一次UI
        this.updateAllTasksUI();
    }

    /**
    * 启动倒计时定时器（基于累计在线时长）
    */
    private startCountdownTimer(): void {
        console.log('=== 启动倒计时定时器 ===');

        this.stopCountdownTimer(); // 确保没有重复的定时器

        this.countdownTimer = window.setInterval(() => {
            if (this.currentCountdownTask) {
                // 正常递减1秒
                this.currentCountdownTask.remainingSeconds = Math.max(0, this.currentCountdownTask.remainingSeconds - 1);

                // 每2秒验证一次在线时长，但不覆盖倒计时
                if (this.currentCountdownTask.remainingSeconds % 2 === 0) {
                    const timeManager = OnlineTimeManager.getInstance();
                    if (timeManager && this.taskData?.taskMap[this.currentCountdownTask.taskIndex]) {
                        // 使用精确的秒数进行验证
                        const currentOnlineSeconds = timeManager.getTotalOnlineTime();
                        const requiredCumulativeMinutes = this.calculateCumulativeTime(this.currentCountdownTask.taskIndex);
                        const requiredSeconds = requiredCumulativeMinutes * 60;

                        console.log(`任务${this.currentCountdownTask.taskIndex}倒计时: ${this.formatCountdownTime(this.currentCountdownTask.remainingSeconds)} (累计${currentOnlineSeconds}秒/${requiredSeconds}秒)`);

                        // 如果在线时长已经达到要求，直接结束倒计时
                        if (currentOnlineSeconds >= requiredSeconds) {
                            console.log(`在线时长已达到要求，结束倒计时`);
                            this.currentCountdownTask.remainingSeconds = 0;
                        }
                    }
                }

                // 更新倒计时显示
                this.updateCountdownDisplay();

                // 检查倒计时是否结束 - 倒计时清零就代表任务已完成
                if (this.currentCountdownTask.remainingSeconds <= 0) {
                    this.onCountdownComplete();
                }
            } else {
                console.warn('倒计时定时器运行但currentCountdownTask为空');
                this.stopCountdownTimer();
            }
        }, 1000);

        console.log('倒计时定时器已启动，每秒递减显示');
    }
    /**
     * 停止倒计时定时器
     */
    private stopCountdownTimer(): void {
        if (this.countdownTimer) {
            window.clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    /**
  * 更新倒计时显示
  */
    private updateCountdownDisplay(): void {
        if (!this.currentCountdownTask) return;

        const taskIndex = this.currentCountdownTask.taskIndex;
        const taskNode = this.taskNodes[taskIndex];
        if (!taskNode) return;

        const button = this.findTaskButton(taskNode);
        const label = this.findTaskButtonLabel(taskNode);
        if (!button || !label) return;

        // 格式化倒计时时间
        const timeText = this.formatCountdownTime(this.currentCountdownTask.remainingSeconds);
        label.string = timeText;

        // 只在整分钟时输出日志，减少日志量
        if (this.currentCountdownTask.remainingSeconds % 60 === 0) {
            console.log(`任务${taskIndex}倒计时: ${timeText}`);
        }
    }
    /**
 * 格式化倒计时时间
 */
    private formatCountdownTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    /**
     * 倒计时完成处理
     */
    private onCountdownComplete(): void {
        if (!this.currentCountdownTask) return;

        const taskIndex = this.currentCountdownTask.taskIndex;
        console.log(`任务${taskIndex}倒计时完成，自动标记为已完成`);

        // 获取时间管理器
        const timeManager = OnlineTimeManager.getInstance();
        if (timeManager) {
            // 倒计时结束后自动标记为已完成
            timeManager.markTaskCompleted(taskIndex);
            console.log(`任务${taskIndex}已自动标记为完成`);
        }

        // 停止当前倒计时
        this.stopCountdownTimer();

        // 清除倒计时任务
        this.currentCountdownTask = null;

        // 更新UI状态 - 这时该任务应该显示为可领取状态
        this.updateAllTasksUI();

        console.log(`任务${taskIndex}状态已更新为可领取`);

        // 自动开始下一个任务的倒计时
        this.startNextTaskCountdown();
    }

    /**
     * 开始下一个任务的倒计时
     */
    private startNextTaskCountdown(): void {
        console.log('=== 开始下一个任务倒计时 ===');

        const nextTaskIndex = this.findNextCountdownTask();
        if (nextTaskIndex !== -1) {
            console.log(`开始下一个任务${nextTaskIndex}的倒计时`);
            this.startTaskCountdown(nextTaskIndex);
        } else {
            console.log('所有任务已完成或没有找到需要倒计时的任务');
        }
    }

    /**
     * 更新所有任务UI
     */
    private updateAllTasksUI(): void {
        if (!this.taskData?.taskMap) return;

        console.log('=== 更新所有任务UI ===');

        // 先刷新所有任务UI
        this.taskData.taskMap.forEach((taskData, index) => {
            this.refreshSingleTaskUI(index);
        });

        // 检查是否需要启动新的倒计时
        if (!this.currentCountdownTask) {
            // 强制重新检查一次OnlineTimeManager状态
            const timeManager = this.ensureOnlineTimeManager();
            console.log('OnlineTimeManager状态:', timeManager ? '正常' : '未初始化');

            if (timeManager) {
                console.log('已完成任务列表:', Array.from(timeManager['completedTasks'] || []));
            }

            const nextTaskIndex = this.findNextCountdownTask();
            if (nextTaskIndex !== -1) {
                console.log(`UI更新后启动任务${nextTaskIndex}的倒计时`);
                this.startTaskCountdown(nextTaskIndex);
            }
        }

        console.log('所有任务UI已更新');
    }

    /**
     * 显示倒计时进度提示
     */
    private showCountdownProgressTip(remainingTime: string, goldReward: number): void {
        console.log(`倒计时进度提示: 还需${remainingTime}可获得${goldReward}金币`);
    }

    /**
     * 显示等待提示
     */
    private showWaitingTip(taskIndex: number): void {
        console.log(`等待提示: 任务${taskIndex}需要等待前面的任务完成`);
    }

    /**
     * 获取倒计时状态调试信息
     */
    public getCountdownDebugInfo(): string {
        let info = `=== 倒计时状态调试信息 ===\n`;

        if (this.currentCountdownTask) {
            const task = this.currentCountdownTask;
            info += `当前倒计时任务: ${task.taskIndex}\n`;
            info += `剩余时间: ${this.formatCountdownTime(task.remainingSeconds)}\n`;
            info += `总时间: ${this.formatCountdownTime(task.totalSeconds)}\n`;
        } else {
            info += `当前无倒计时任务\n`;
        }

        const nextTask = this.findNextCountdownTask();
        info += `下一个任务: ${nextTask !== -1 ? nextTask : '无'}\n`;

        return info;
    }

    /**
     * 获取调试信息
     */
    public getDebugInfo(): string {
        let info = `=== 任务中心调试信息 ===\n`;

        const timeManager = OnlineTimeManager.getInstance();
        info += `OnlineTimeManager: ${timeManager ? '已初始化' : '未初始化'}\n`;

        if (timeManager) {
            info += `在线时长: ${timeManager.getTotalOnlineTimeInMinutes()}分钟\n`;
            info += `已完成任务: [${Array.from(timeManager['completedTasks'] || []).join(', ')}]\n`;
        }

        if (this.currentCountdownTask) {
            const task = this.currentCountdownTask;
            info += `当前倒计时任务: ${task.taskIndex}\n`;
            info += `剩余时间: ${this.formatCountdownTime(task.remainingSeconds)}\n`;
        } else {
            info += `当前倒计时任务: 无\n`;
        }

        info += `定时器状态: ${this.countdownTimer ? '运行中' : '未运行'}\n`;
        info += `任务节点数量: ${this.taskNodes.length}\n`;

        return info;
    }

    /**
    * 计算累计时长要求（直接使用后台返回的累计时长）
    */
    private calculateCumulativeTime(taskIndex: number): number {
        if (!this.taskData?.taskMap || taskIndex >= this.taskData.taskMap.length) {
            return 0;
        }

        // 后台返回的time字段本身就是累计时长，直接返回
        return this.taskData.taskMap[taskIndex].time;
    }

    /**
     * 检查前面的任务是否都已完成
     */
    private areAllPreviousTasksCompleted(timeManager: OnlineTimeManager, taskIndex: number): boolean {
        // 如果是第一个任务，没有前置任务，直接返回true
        if (taskIndex === 0) {
            return true;
        }

        // 确保使用同一个timeManager实例
        const currentTimeManager = timeManager || this.ensureOnlineTimeManager();

        console.log(`检查任务${taskIndex}的前置任务完成状态:`);

        // 检查前面所有任务是否都已完成
        for (let i = 0; i < taskIndex; i++) {
            const isCompleted = currentTimeManager.isTaskCompleted(i);
            console.log(`- 任务${i}完成状态: ${isCompleted}`);

            if (!isCompleted) {
                console.log(`任务${taskIndex}的前置任务${i}未完成`);
                return false;
            }
        }

        console.log(`任务${taskIndex}的所有前置任务都已完成`);
        return true;
    }

    /**
     * 计算单个任务的实际时长（非累计时长）
     */
    private calculateActualTaskTime(taskIndex: number): number {
        if (!this.taskData?.taskMap || taskIndex >= this.taskData.taskMap.length) {
            return 0;
        }

        const currentCumulativeTime = this.taskData.taskMap[taskIndex].time;

        if (taskIndex === 0) {
            // 第一个任务的实际时长就是累计时长
            return currentCumulativeTime;
        }

        // 其他任务的实际时长 = 当前累计时长 - 前一个任务的累计时长
        const previousCumulativeTime = this.taskData.taskMap[taskIndex - 1].time;
        return currentCumulativeTime - previousCumulativeTime;
    }
}
