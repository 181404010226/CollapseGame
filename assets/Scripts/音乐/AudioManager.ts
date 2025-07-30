import { _decorator, Component, AudioClip, AudioSource, director, Director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    private static instance: AudioManager = null;
    private bgmAudioSource: AudioSource = null;
    private currentSceneName: string = ''; // 手动跟踪当前场景名

    // 允许播放音效的场景列表
    private allowedScenes: string[] = ['首页'];

    @property({
        type: AudioClip,
        tooltip: '背景音乐音频文件'
    })
    public bgmClip: AudioClip = null;

    @property({
        type: AudioClip,
        tooltip: '金币音效'
    })
    public coinSoundClip: AudioClip = null;

    @property({
        type: AudioClip,
        tooltip: '掉落碰撞音效'
    })
    public dropSoundClip: AudioClip = null;

    public static getInstance(): AudioManager {
        return AudioManager.instance;
    }

    protected onLoad() {
        if (AudioManager.instance) {
            this.node.destroy();
            return;
        }
        AudioManager.instance = this;
        director.addPersistRootNode(this.node);

        this.initAudioSource();
        this.updateCurrentSceneName();

        // 监听场景切换事件
        director.on(Director.EVENT_BEFORE_SCENE_LAUNCH, this.onBeforeSceneChange, this);
        director.on(Director.EVENT_AFTER_SCENE_LAUNCH, this.onAfterSceneChange, this);
        
        // 定时检查（作为备用方案）
        this.schedule(this.checkSceneAndStopIfNeeded, 1.0);
    }

    /**
     * 初始化音频源
     */
    private initAudioSource(): void {
        if (!this.bgmAudioSource) {
            this.bgmAudioSource = this.node.addComponent(AudioSource);
        }
        this.bgmAudioSource.loop = true;
        this.bgmAudioSource.volume = 0.3;
    }

    /**
     * 更新当前场景名称
     */
    private updateCurrentSceneName(): void {
        const currentScene = director.getScene();
        this.currentSceneName = currentScene ? currentScene.name : '';
        // console.log(`AudioManager: 当前场景更新为: ${this.currentSceneName}`);
    }

    /**
     * 检查当前场景是否允许播放音效
     */
    private isCurrentSceneAllowed(): boolean {
        // 优先使用手动跟踪的场景名
        if (this.currentSceneName) {
            const allowed = this.allowedScenes.includes(this.currentSceneName);
            //console.log(`当前场景: ${this.currentSceneName}, 允许的场景: ${this.allowedScenes.join(', ')}, 是否允许: ${allowed}`);
            return allowed;
        }

        // 备用方案：直接获取当前场景
        const currentScene = director.getScene();
        if (!currentScene) {
            console.log('无法获取当前场景');
            return false;
        }

        const sceneName = currentScene.name;
        const allowed = this.allowedScenes.includes(sceneName);
        // console.log(`当前场景(备用): ${sceneName}, 允许的场景: ${this.allowedScenes.join(', ')}, 是否允许: ${allowed}`);
        return allowed;
    }

    /**
     * 强制停止背景音乐
     */
    private forceStopBGM(): void {
        if (this.bgmAudioSource) {
            if (this.bgmAudioSource.playing) {
                this.bgmAudioSource.stop();
                console.log('AudioManager: 背景音乐已强制停止');
            }
            // 清除音频剪辑，确保彻底停止
            this.bgmAudioSource.clip = null;
        }
    }

    /**
     * 场景切换前的处理
     */
    private onBeforeSceneChange(scene: any): void {
        const targetSceneName = scene.name;
        console.log(`AudioManager: 准备切换到场景: ${targetSceneName}`);

        // 如果目标场景不允许播放音乐，立即停止
        if (!this.allowedScenes.includes(targetSceneName)) {
            console.log(`AudioManager: 目标场景不允许音乐，停止播放`);
            this.forceStopBGM();
        }
    }

    /**
     * 场景切换后的处理
     */
    private onAfterSceneChange(): void {
        // 延迟更新场景名称，确保场景完全加载
        this.scheduleOnce(() => {
            this.updateCurrentSceneName();
            
            // 再次检查并处理音频状态
            if (!this.isCurrentSceneAllowed()) {
                console.log(`AudioManager: 场景切换后检查，当前场景不允许音乐`);
                this.forceStopBGM();
            } else {
                console.log(`AudioManager: 场景切换后检查，当前场景允许音乐`);
                // 可选：自动播放背景音乐
                if (this.bgmClip && !this.isBGMPlaying()) {
                    this.playHomeBGM();
                }
            }
        }, 0.1);
    }

    /**
     * 播放背景音乐
     */
    public playHomeBGM(): void {
        if (!this.isCurrentSceneAllowed()) {
            console.log('AudioManager: 当前场景不允许播放背景音乐');
            return;
        }

        if (!this.bgmClip) {
            console.error('AudioManager: 背景音乐文件未设置');
            return;
        }

        // 确保音频源存在且正常
        if (!this.bgmAudioSource) {
            console.warn('AudioManager: 音频源不存在，重新初始化');
            this.initAudioSource();
        }

        this.bgmAudioSource.clip = this.bgmClip;
        this.bgmAudioSource.play();
        console.log('AudioManager: 背景音乐开始播放');
    }

    /**
     * 播放金币音效
     */
    public playCoinSound(): void {
        if (!this.isCurrentSceneAllowed()) {
            return;
        }

        if (!this.coinSoundClip) {
            console.warn('AudioManager: 金币音效文件未设置');
            return;
        }

        if (!this.bgmAudioSource) {
            this.initAudioSource();
        }

        this.bgmAudioSource.playOneShot(this.coinSoundClip, 0.5);
    }

    /**
     * 播放掉落碰撞音效
     */
    public playDropSound(): void {
        if (!this.isCurrentSceneAllowed()) {
            return;
        }

        if (!this.dropSoundClip) {
            console.warn('AudioManager: 掉落音效文件未设置');
            return;
        }

        if (!this.bgmAudioSource) {
            this.initAudioSource();
        }

        this.bgmAudioSource.playOneShot(this.dropSoundClip, 0.3);
    }

    /**
     * 停止背景音乐
     */
    public stopBGM(): void {
        this.forceStopBGM();
    }

    /**
     * 设置背景音乐音量
     */
    public setBGMVolume(volume: number): void {
        if (this.bgmAudioSource) {
            this.bgmAudioSource.volume = volume;
        }
    }

    /**
     * 获取当前背景音乐音量
     */
    public getBGMVolume(): number {
        return this.bgmAudioSource ? this.bgmAudioSource.volume : 0;
    }

    /**
     * 暂停背景音乐
     */
    public pauseBGM(): void {
        if (this.bgmAudioSource && this.bgmAudioSource.playing) {
            this.bgmAudioSource.pause();
        }
    }

    /**
     * 恢复背景音乐
     */
    public resumeBGM(): void {
        if (this.bgmAudioSource && this.isCurrentSceneAllowed()) {
            this.bgmAudioSource.play();
        }
    }

    /**
     * 检查背景音乐是否正在播放
     */
    public isBGMPlaying(): boolean {
        return this.bgmAudioSource && this.bgmAudioSource.playing;
    }

    /**
     * 定时检查场景，确保只在允许的场景播放
     */
    private checkSceneAndStopIfNeeded(): void {
        // 更新场景名称
        this.updateCurrentSceneName();
        
        if (!this.isCurrentSceneAllowed() && this.isBGMPlaying()) {
            console.log('AudioManager: 定时检查发现不在允许的场景，停止背景音乐');
            this.forceStopBGM();
        }
    }

    /**
     * 设置允许播放音乐的场景
     */
    public setAllowedScenes(scenes: string[]): void {
        this.allowedScenes = [...scenes];
        console.log(`AudioManager: 已更新允许播放音乐的场景: ${this.allowedScenes.join(', ')}`);
        
        // 立即检查当前场景
        if (!this.isCurrentSceneAllowed() && this.isBGMPlaying()) {
            console.log('AudioManager: 当前场景不在新的允许列表中，停止背景音乐');
            this.forceStopBGM();
        }
    }

    protected onDestroy(): void {
        director.off(Director.EVENT_BEFORE_SCENE_LAUNCH, this.onBeforeSceneChange, this);
        director.off(Director.EVENT_AFTER_SCENE_LAUNCH, this.onAfterSceneChange, this);
        this.unschedule(this.checkSceneAndStopIfNeeded);
    }
}










