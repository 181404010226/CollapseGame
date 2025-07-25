import { _decorator, Component, AudioClip, AudioSource, director, Director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    private static instance: AudioManager = null;
    private bgmAudioSource: AudioSource = null;

    // 允许播放音效的场景列表 - 更新为你的实际场景名称
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

        this.bgmAudioSource = this.node.addComponent(AudioSource);
        this.bgmAudioSource.loop = true;
        this.bgmAudioSource.volume = 0.3;

        // 监听场景切换事件 - 使用静态成员
        director.on(Director.EVENT_BEFORE_SCENE_LAUNCH, this.onSceneChange, this);
        // 备用方案：定时检查
        this.schedule(this.checkSceneAndStopIfNeeded, 1.0);
    }

    /**
     * 检查当前场景是否允许播放音效
     */
    private isCurrentSceneAllowed(): boolean {
        const currentScene = director.getScene();
        if (!currentScene) return false;

        const sceneName = currentScene.name;
        console.log(`当前场景: ${sceneName}, 允许的场景: ${this.allowedScenes.join(', ')}`);
        return this.allowedScenes.includes(sceneName);
    }

    /**
     * 播放背景音乐
     */
    public playHomeBGM() {
        if (!this.isCurrentSceneAllowed()) {
            console.log('当前场景不允许播放背景音乐');
            return;
        }

        if (!this.bgmClip) {
            console.error('背景音乐文件未设置');
            return;
        }

        if (!this.bgmAudioSource) {
            console.error('音频源组件未初始化');
            return;
        }

        this.bgmAudioSource.clip = this.bgmClip;
        this.bgmAudioSource.play();
        console.log('首页背景音乐开始播放');
    }

    /**
     * 播放金币音效
     */
    public playCoinSound() {
        if (!this.isCurrentSceneAllowed()) {
            return; // 静默返回，不播放音效
        }

        if (!this.coinSoundClip) {
            console.warn('金币音效文件未设置');
            return;
        }
        this.bgmAudioSource.playOneShot(this.coinSoundClip, 0.5);
    }

    /**
     * 播放掉落碰撞音效
     */
    public playDropSound() {
        if (!this.isCurrentSceneAllowed()) {
            return; // 静默返回，不播放音效
        }

        if (!this.dropSoundClip) {
            console.warn('掉落音效文件未设置');
            return;
        }
        this.bgmAudioSource.playOneShot(this.dropSoundClip, 0.3);
    }

    /**
     * 停止背景音乐
     */
    public stopBGM() {
        if (this.bgmAudioSource && this.bgmAudioSource.playing) {
            this.bgmAudioSource.stop();
        }
    }

    /**
     * 设置背景音乐音量
     */
    public setBGMVolume(volume: number) {
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
    public pauseBGM() {
        if (this.bgmAudioSource && this.bgmAudioSource.playing) {
            this.bgmAudioSource.pause();
        }
    }

    /**
     * 恢复背景音乐
     */
    public resumeBGM() {
        if (this.bgmAudioSource) {
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
     * 场景切换时的处理
     */
    private onSceneChange(scene: any) {
        const sceneName = scene.name;
        console.log(`场景切换到: ${sceneName}`);

        if (!this.allowedScenes.includes(sceneName)) {
            console.log(`离开允许音效的场景，停止背景音乐`);
            this.stopBGM();
        }
    }

    /**
     * 定时检查场景，确保只在允许的场景播放
     */
    private checkSceneAndStopIfNeeded() {
        if (!this.isCurrentSceneAllowed() && this.isBGMPlaying()) {
            console.log('检测到不在允许的场景，停止背景音乐');
            this.stopBGM();
        }
    }

    protected onDestroy() {
        director.off(Director.EVENT_BEFORE_SCENE_LAUNCH, this.onSceneChange, this);
        this.unschedule(this.checkSceneAndStopIfNeeded);
    }
}









