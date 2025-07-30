import { _decorator, Component, director, log, game, Game } from 'cc';
import { OnlineTimeManager } from './任务中心/OnlineTimeManager';

const { ccclass, property } = _decorator;

/**
 * 游戏启动管理器
 * 负责初始化全局系统，包括在线时长管理器
 */
@ccclass('GameLauncher')
export class GameLauncher extends Component {

    onLoad() {
        this.initializeGlobalSystems();
    }

    /**
     * 初始化全局系统
     */
    private initializeGlobalSystems(): void {
        log('GameLauncher: 开始初始化全局系统');

        // 初始化全局在线时长管理器
        OnlineTimeManager.initializeGlobal();

        // 监听游戏暂停/恢复事件
        this.setupGameLifecycleEvents();

        log('GameLauncher: 全局系统初始化完成');
    }

    /**
     * 设置游戏生命周期事件监听
     */
    private setupGameLifecycleEvents(): void {
        // 监听游戏暂停事件
        game.on(Game.EVENT_PAUSE, this.onGamePause, this);
        
        // 监听游戏恢复事件
        game.on(Game.EVENT_RESUME, this.onGameResume, this);

        // 监听游戏隐藏事件
        game.on(Game.EVENT_HIDE, this.onGameHide, this);

        // 监听游戏显示事件
        game.on(Game.EVENT_SHOW, this.onGameShow, this);
    }

    private onGamePause(): void {
        log('GameLauncher: 游戏暂停，停止在线时长计时');
        const timeManager = OnlineTimeManager.getInstance();
        if (timeManager) {
            timeManager.stopTiming();
        }
    }

    private onGameResume(): void {
        log('GameLauncher: 游戏恢复，开始在线时长计时');
        const timeManager = OnlineTimeManager.getInstance();
        if (timeManager) {
            timeManager.startTiming();
        }
    }

    private onGameHide(): void {
        log('GameLauncher: 游戏隐藏，停止在线时长计时');
        const timeManager = OnlineTimeManager.getInstance();
        if (timeManager) {
            timeManager.stopTiming();
        }
    }

    private onGameShow(): void {
        log('GameLauncher: 游戏显示，开始在线时长计时');
        const timeManager = OnlineTimeManager.getInstance();
        if (timeManager) {
            timeManager.startTiming();
        }
    }

    onDestroy() {
        // 移除事件监听
        game.off(Game.EVENT_PAUSE, this.onGamePause, this);
        game.off(Game.EVENT_RESUME, this.onGameResume, this);
        game.off(Game.EVENT_HIDE, this.onGameHide, this);
        game.off(Game.EVENT_SHOW, this.onGameShow, this);
    }
}
