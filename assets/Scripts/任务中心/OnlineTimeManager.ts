import { _decorator, Component, log, warn, director, Node, game } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 在线时长数据结构
 */
export interface OnlineTimeData {
    sessionStartTime: number;    // 本次会话开始时间
    totalOnlineTime: number;     // 今日总在线时长（秒）
    lastSaveTime: number;        // 最后保存时间
    lastResetDate: string;       // 最后重置日期（用于每日重置）
    completedTasks: number[];    // 已完成的任务索引列表
}

/**
 * 全局在线时长管理器
 * 负责追踪用户在线时长，支持每日重置和任务完成状态管理
 * 游戏启动时自动开始计时，退出游戏时停止
 */
@ccclass('OnlineTimeManager')
export class OnlineTimeManager extends Component {

    private static instance: OnlineTimeManager = null;

    // 计时相关
    private sessionStartTime: number = 0;
    private totalOnlineTime: number = 0;
    private lastSaveTime: number = 0;
    private completedTasks: Set<number> = new Set();
    private isTimingActive: boolean = false;

    // 定时器
    private saveTimer: number = null;
    private readonly SAVE_INTERVAL = 2; // 每2秒保存一次

    // 存储键名
    private readonly STORAGE_KEY = 'online_time_data';

    /**
     * 获取单例实例
     */
    public static getInstance(): OnlineTimeManager {
        return OnlineTimeManager.instance;
    }

    /**
     * 初始化全局在线时长管理器
     * 应该在游戏启动时调用
     */
    public static initializeGlobal(): OnlineTimeManager {
        if (OnlineTimeManager.instance) {
            return OnlineTimeManager.instance;
        }

        // 查找或创建持久化节点
        let persistentNode = director.getScene().getChildByName('GlobalManagers');
        if (!persistentNode) {
            persistentNode = new Node('GlobalManagers');
            director.getScene().addChild(persistentNode);
            game.addPersistRootNode(persistentNode); // 设置为常驻节点
        }

        const timeManager = persistentNode.addComponent(OnlineTimeManager);
        log('OnlineTimeManager: 全局在线时长管理器已初始化');
        return timeManager;
    }

    onLoad() {
        if (OnlineTimeManager.instance) {
            this.destroy();
            return;
        }

        OnlineTimeManager.instance = this;
        this.loadOnlineTimeData();
        this.autoStartTiming();
        log('OnlineTimeManager: 在线时长管理器已初始化');
    }

    onDestroy() {
        this.stopTiming();
        if (OnlineTimeManager.instance === this) {
            OnlineTimeManager.instance = null;
        }
    }

    /**
     * 自动开始计时
     */
    private autoStartTiming(): void {
        if (!this.isTimingActive) {
            this.startTiming();
        }
    }

    /**
     * 开始计时
     */
    public startTiming(): void {
        if (this.isTimingActive) {
            log('OnlineTimeManager: 计时已在进行中');
            return;
        }

        const now = Date.now();
        this.sessionStartTime = now;
        this.lastSaveTime = now;
        this.isTimingActive = true;

        // 检查是否需要每日重置
        this.checkDailyReset();

        // 启动定时保存
        this.startTimer();

        log('OnlineTimeManager: 开始计时，会话开始时间:', new Date(this.sessionStartTime).toLocaleString());
    }

    /**
     * 停止计时
     */
    public stopTiming(): void {
        if (!this.isTimingActive) {
            return;
        }

        this.stopTimer();
        this.updateTotalTime();
        this.saveOnlineTimeData();
        this.isTimingActive = false;

        log('OnlineTimeManager: 停止计时，总在线时长:', this.formatTime(this.totalOnlineTime));
    }

    /**
     * 获取计时状态
     */
    public isActive(): boolean {
        return this.isTimingActive;
    }

    /**
     * 启动定时器
     */
    private startTimer(): void {
        this.stopTimer(); // 确保没有重复的定时器

        this.saveTimer = window.setInterval(() => {
            this.updateAndSaveTime();
        }, this.SAVE_INTERVAL * 1000);

        log(`OnlineTimeManager: 定时器已启动，每${this.SAVE_INTERVAL}秒保存一次`);
    }

    /**
     * 停止定时器
     */
    private stopTimer(): void {
        if (this.saveTimer) {
            window.clearInterval(this.saveTimer);
            this.saveTimer = null;
            log('OnlineTimeManager: 定时器已停止');
        }
    }

    /**
     * 更新并保存时间
     */
    private updateAndSaveTime(): void {
        this.updateTotalTime();
        this.saveOnlineTimeData();

        log(`OnlineTimeManager: 时间已更新，当前总在线时长: ${this.formatTime(this.totalOnlineTime)}`);
    }

    /**
     * 更新总在线时长
     */
    private updateTotalTime(): void {
        if (this.sessionStartTime > 0) {
            const now = Date.now();
            const sessionTime = Math.floor((now - this.lastSaveTime) / 1000);
            this.totalOnlineTime += sessionTime;
            this.lastSaveTime = now;
        }
    }

    /**
     * 检查是否需要每日重置
     */
    private checkDailyReset(): void {
        const today = new Date().toDateString();
        const data = this.loadStoredData();

        if (data && data.lastResetDate !== today) {
            log('OnlineTimeManager: 检测到新的一天，重置在线时长和任务状态');
            this.totalOnlineTime = 0;
            this.completedTasks.clear();
            this.saveOnlineTimeData();
        }
    }

    /**
     * 获取当前总在线时长（秒）
     */
    public getTotalOnlineTime(): number {
        this.updateTotalTime();
        return this.totalOnlineTime;
    }

    /**
     * 获取当前总在线时长（分钟）
     */
    public getTotalOnlineTimeInMinutes(): number {
        return Math.floor(this.getTotalOnlineTime() / 60);
    }

    /**
     * 检查指定时长的任务是否可以领取
     * @param requiredMinutes 需要的在线时长（分钟）
     * @returns 是否可以领取
     */
    public canClaimTask(requiredMinutes: number): boolean {
        const currentMinutes = this.getTotalOnlineTimeInMinutes();
        return currentMinutes >= requiredMinutes;
    }

    /**
     * 检查任务是否已完成
     * @param taskIndex 任务索引
     * @returns 是否已完成
     */
    /**
     * 检查任务是否已完成
     */
    public isTaskCompleted(taskIndex: number): boolean {
        const isCompleted = this.completedTasks.has(taskIndex);
        console.log(`OnlineTimeManager.isTaskCompleted(${taskIndex}): ${isCompleted}, 已完成任务列表: [${Array.from(this.completedTasks).join(', ')}]`);
        return isCompleted;
    }

    /**
     * 标记任务为已完成
     * @param taskIndex 任务索引
     */
    public markTaskCompleted(taskIndex: number): void {
        this.completedTasks.add(taskIndex);
        this.saveOnlineTimeData();
        log(`OnlineTimeManager: 任务${taskIndex}已标记为完成`);
    }

    /**
     * 获取任务状态
     * @param taskIndex 任务索引
     * @param requiredMinutes 需要的时长（分钟）
     * @returns 任务状态：'completed' | 'claimable' | 'in_progress'
     */
    public getTaskStatus(taskIndex: number, requiredMinutes: number): 'completed' | 'claimable' | 'in_progress' {
        if (this.isTaskCompleted(taskIndex)) {
            return 'completed';
        }

        if (this.canClaimTask(requiredMinutes)) {
            return 'claimable';
        }

        return 'in_progress';
    }

    /**
     * 保存在线时长数据到本地存储
     */
    private saveOnlineTimeData(): void {
        try {
            const data: OnlineTimeData = {
                sessionStartTime: this.sessionStartTime,
                totalOnlineTime: this.totalOnlineTime,
                lastSaveTime: this.lastSaveTime,
                lastResetDate: new Date().toDateString(),
                completedTasks: Array.from(this.completedTasks)
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            log('OnlineTimeManager: 数据已保存到本地存储');
        } catch (error) {
            warn('OnlineTimeManager: 保存数据失败:', error);
        }
    }

    /**
     * 从本地存储加载在线时长数据
     */
    private loadOnlineTimeData(): void {
        const data = this.loadStoredData();
        if (data) {
            this.sessionStartTime = data.sessionStartTime || 0;
            this.totalOnlineTime = data.totalOnlineTime || 0;
            this.lastSaveTime = data.lastSaveTime || Date.now();
            this.completedTasks = new Set(data.completedTasks || []);
            
            log('OnlineTimeManager: 已加载本地数据，总在线时长:', this.formatTime(this.totalOnlineTime));
        } else {
            log('OnlineTimeManager: 未找到本地数据，使用默认值');
        }
    }

    /**
     * 从存储中加载原始数据
     */
    private loadStoredData(): OnlineTimeData | null {
        try {
            const dataStr = localStorage.getItem(this.STORAGE_KEY);
            if (dataStr) {
                return JSON.parse(dataStr);
            }
        } catch (error) {
            warn('OnlineTimeManager: 加载本地数据失败:', error);
        }
        return null;
    }

    /**
     * 格式化时间显示
     */
    private formatTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}时${minutes}分${secs}秒`;
    }

    /**
     * 获取调试信息
     */
    public getDebugInfo(): string {
        const currentMinutes = this.getTotalOnlineTimeInMinutes();
        const currentSeconds = this.getTotalOnlineTime();

        return `在线时长: ${currentMinutes}分钟 (${currentSeconds}秒)\n` +
            `已完成任务: [${Array.from(this.completedTasks).join(', ')}]\n` +
            `会话开始: ${this.sessionStartTime > 0 ? new Date(this.sessionStartTime).toLocaleString() : '未开始'}`;
    }
}

