import { _decorator, Component, Node, Button, director } from 'cc';
import { GameProgressManager } from '../GameProgressManager';
const { ccclass, property } = _decorator;

/**
 * 场景导航器
 * 用于实现按钮点击跳转到其他场景的功能
 * 支持在跳转到首页场景时自动初始化游戏进度管理器
 * 支持保存和恢复游戏场景中的物品状态
 */
@ccclass('SceneNavigator')
export class SceneNavigator extends Component {
    @property({ type: String, tooltip: '目标场景名称' })
    public targetSceneName: string = '';

    @property({ tooltip: '是否在点击时自动跳转场景' })
    public autoNavigateOnClick: boolean = true;

    @property({ tooltip: '是否在跳转后自动初始化游戏进度（适用于首页等需要初始化的场景）' })
    public autoInitializeProgress: boolean = true;

    @property({ tooltip: '是否在跳转前保存当前场景状态（物品位置等）' })
    public autoSaveSceneState: boolean = true;

    @property({ type: [String], tooltip: '需要自动初始化游戏进度的场景名称列表' })
    public progressInitScenes: string[] = ['首页', 'main', 'home', 'index'];

    @property({ type: [String], tooltip: '需要保存和恢复场景状态的场景名称列表' })
    public sceneStateSaveScenes: string[] = ['首页', 'main', 'home', 'index'];

    private _button: Button = null;

    start() {
        // 初始化数组属性
        this.initializeArrayProperties();
        
        // 获取按钮组件
        this._button = this.getComponent(Button);
        
        // 如果启用了自动导航，则添加点击事件监听器
        if (this.autoNavigateOnClick && this._button && this._button.node) {
            this._button.node.on(Button.EventType.CLICK, this.navigateToScene, this);
        }
    }

    /**
     * 初始化数组属性，确保它们不为 null
     */
    private initializeArrayProperties(): void {
        if (!this.progressInitScenes) {
            this.progressInitScenes = ['首页', 'main', 'home', 'index'];
            console.log('SceneNavigator: 初始化 progressInitScenes 数组');
        }
        
        if (!this.sceneStateSaveScenes) {
            this.sceneStateSaveScenes = ['首页', 'main', 'home', 'index'];
            console.log('SceneNavigator: 初始化 sceneStateSaveScenes 数组');
        }
    }

    /**
     * 导航到目标场景
     */
    public async navigateToScene(): Promise<void> {
        if (!this.targetSceneName || this.targetSceneName.trim() === '') {
            console.warn('SceneNavigator: 未设置目标场景名称!');
            return;
        }

        try {
            console.log(`SceneNavigator: 正在跳转到场景: ${this.targetSceneName}`);
            
            // 在跳转前停止所有GameProgressManager的定时器，防止数据覆盖
            this.stopAllProgressManagerTimers();
            
       
            // 执行场景跳转
            const success = await director.loadScene(this.targetSceneName);
            
            if (success) {
                console.log(`SceneNavigator: 场景跳转成功: ${this.targetSceneName}`);
                
                // 检查是否需要初始化游戏进度和恢复场景状态
                if (this.shouldInitializeProgress()) {
                    await this.initializeGameProgressAfterNavigation();
                }
            } else {
                console.error(`SceneNavigator: 场景跳转失败: ${this.targetSceneName}`);
            }
        } catch (error) {
            console.error(`SceneNavigator: 场景跳转异常: ${this.targetSceneName}`, error);
        }
    }

    /**
     * 设置目标场景并导航
     * @param sceneName 目标场景名称
     */
    public async setTargetAndNavigate(sceneName: string): Promise<void> {
        this.targetSceneName = sceneName;
        await this.navigateToScene();
    }

    
    /**
     * 检查当前目标场景是否需要初始化游戏进度
     */
    private shouldInitializeProgress(): boolean {
        if (!this.autoInitializeProgress) {
            return false;
        }

        if (!this.progressInitScenes || this.progressInitScenes.length === 0) {
            return false;
        }

        // 检查目标场景是否在需要初始化的场景列表中
        const normalizedTargetName = this.targetSceneName.toLowerCase().trim();
        return this.progressInitScenes.some(sceneName => 
            sceneName && sceneName.toLowerCase().trim() === normalizedTargetName
        );
    }

    /**
     * 检查当前目标场景是否需要保存/恢复场景状态
     */
    private shouldSaveRestoreSceneState(): boolean {
        if (!this.sceneStateSaveScenes || this.sceneStateSaveScenes.length === 0) {
            return false;
        }
        
        const normalizedTargetName = this.targetSceneName.toLowerCase().trim();
        return this.sceneStateSaveScenes.some(sceneName => 
            sceneName && sceneName.toLowerCase().trim() === normalizedTargetName
        );
    }

    /**
     * 在场景跳转后初始化游戏进度管理器
     */
    private async initializeGameProgressAfterNavigation(): Promise<void> {
        try {
            console.log('SceneNavigator: 开始初始化跳转后场景中的游戏进度管理器...');
            
            // 等待一段时间确保场景完全加载
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // 使用统一的数据同步和恢复方法
            await GameProgressManager.syncAndRestoreGameData();
            
            console.log('SceneNavigator: 游戏进度管理器初始化完成');
            
        } catch (error) {
            console.error('SceneNavigator: 游戏进度管理器初始化失败:', error);
        }
    }



    /**
     * 添加需要初始化游戏进度的场景名称
     * @param sceneName 场景名称
     */
    public addProgressInitScene(sceneName: string): void {
        if (sceneName && this.progressInitScenes.indexOf(sceneName) === -1) {
            this.progressInitScenes.push(sceneName);
            console.log(`SceneNavigator: 已添加需要初始化进度的场景: ${sceneName}`);
        }
    }

    /**
     * 移除不需要初始化游戏进度的场景名称
     * @param sceneName 场景名称
     */
    public removeProgressInitScene(sceneName: string): void {
        const index = this.progressInitScenes.indexOf(sceneName);
        if (index > -1) {
            this.progressInitScenes.splice(index, 1);
            console.log(`SceneNavigator: 已移除不需要初始化进度的场景: ${sceneName}`);
        }
    }

    /**
     * 添加需要保存场景状态的场景名称
     * @param sceneName 场景名称
     */
    public addSceneStateSaveScene(sceneName: string): void {
        if (sceneName && this.sceneStateSaveScenes.indexOf(sceneName) === -1) {
            this.sceneStateSaveScenes.push(sceneName);
            console.log(`SceneNavigator: 已添加需要保存场景状态的场景: ${sceneName}`);
        }
    }

    /**
     * 设置是否自动初始化游戏进度
     * @param enabled 是否启用
     */
    public setAutoInitializeProgress(enabled: boolean): void {
        this.autoInitializeProgress = enabled;
        console.log(`SceneNavigator: 自动初始化游戏进度已${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 设置是否自动保存场景状态
     * @param enabled 是否启用
     */
    public setAutoSaveSceneState(enabled: boolean): void {
        this.autoSaveSceneState = enabled;
        console.log(`SceneNavigator: 自动保存场景状态已${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 获取当前配置信息（用于调试）
     */
    public getConfiguration(): any {
        return {
            targetSceneName: this.targetSceneName,
            autoNavigateOnClick: this.autoNavigateOnClick,
            autoInitializeProgress: this.autoInitializeProgress,
            autoSaveSceneState: this.autoSaveSceneState,
            progressInitScenes: [...this.progressInitScenes],
            sceneStateSaveScenes: [...this.sceneStateSaveScenes]
        };
    }

    /**
     * 停止所有GameProgressManager的定时器
     */
    private stopAllProgressManagerTimers(): void {
        try {
            const scene = director.getScene();
            if (!scene) {
                console.warn('SceneNavigator: 当前场景不存在，跳过停止定时器');
                return;
            }

            const managers = scene.getComponentsInChildren(GameProgressManager);
            managers.forEach(manager => {
                manager.stopTimers();
                console.log('SceneNavigator: 已停止GameProgressManager定时器');
            });
        } catch (error) {
            console.error('SceneNavigator: 停止定时器时发生错误:', error);
        }
    }

    protected onDestroy(): void {
      
        
        // 清理事件监听器
        if (this._button && this._button.node) {
            this._button.node.off(Button.EventType.CLICK, this.navigateToScene, this);
        }
    }
} 