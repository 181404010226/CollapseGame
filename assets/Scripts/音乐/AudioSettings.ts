import { AudioManager } from './AudioManager';

/**
 * 音频设置管理类
 * 
 * 这个类的作用就像是游戏的"音频设置存档"，负责：
 * 1. 记住玩家的音频设置（音量大小、是否开启背景音乐）
 * 2. 当玩家重新打开游戏时，自动恢复之前的设置
 * 3. 当玩家在设置界面调整音频时，立即生效并保存
 * 
 * 举个例子：
 * - 玩家把音量调到50%，关闭游戏
 * - 第二天打开游戏，音量还是50%（而不是重置为默认值）
 * - 玩家在设置界面关闭背景音乐，立即停止播放并记住这个选择
 */
export class AudioSettings {
    // 存储键名 - 用于在浏览器本地存储中保存数据
    private static BGM_VOLUME_KEY = 'bgm_volume';     // 背景音乐音量的存储键
    private static BGM_ENABLED_KEY = 'bgm_enabled';   // 背景音乐开关的存储键
    
    /**
     * 设置背景音乐音量
     * 
     * 这个方法做两件事：
     * 1. 把音量值保存到浏览器存储中（下次打开游戏时能记住）
     * 2. 立即应用到当前的音频管理器（马上生效）
     * 
     * @param volume 音量值，范围 0.0 到 1.0（0是静音，1是最大音量）
     * 
     * 使用场景：在设置界面的音量滑块被拖动时调用
     */
    public static setBGMVolume(volume: number) {
        // 第1步：保存到浏览器存储，下次打开游戏时能恢复
        localStorage.setItem(this.BGM_VOLUME_KEY, volume.toString());
        
        // 第2步：立即应用到当前播放的音频
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.setBGMVolume(volume);  // 音量立即改变
        }
    }
    
    /**
     * 获取背景音乐音量
     * 
     * 从浏览器存储中读取玩家之前设置的音量
     * 如果是第一次玩游戏（没有保存过设置），返回默认音量0.3
     * 
     * @returns 音量值，范围 0.0 到 1.0
     * 
     * 使用场景：
     * 1. 游戏启动时恢复音量设置
     * 2. 设置界面显示当前音量值
     */
    public static getBGMVolume(): number {
        const stored = localStorage.getItem(this.BGM_VOLUME_KEY);
        return stored ? parseFloat(stored) : 0.3;  // 默认音量30%
    }
    
    /**
     * 设置背景音乐开关
     * 
     * 这个方法做两件事：
     * 1. 把开关状态保存到浏览器存储中
     * 2. 立即执行播放或停止音乐
     * 
     * @param enabled true=开启背景音乐，false=关闭背景音乐
     * 
     * 使用场景：在设置界面的"背景音乐"开关被点击时调用
     */
    public static setBGMEnabled(enabled: boolean) {
        // 第1步：保存开关状态
        localStorage.setItem(this.BGM_ENABLED_KEY, enabled.toString());
        
        // 第2步：立即执行相应操作
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            if (enabled) {
                audioManager.playHomeBGM();  // 开启：立即播放音乐
            } else {
                audioManager.stopBGM();      // 关闭：立即停止音乐
            }
        }
    }
    
    /**
     * 获取背景音乐开关状态
     * 
     * 从浏览器存储中读取玩家之前设置的开关状态
     * 如果是第一次玩游戏，默认开启背景音乐
     * 
     * @returns true=背景音乐开启，false=背景音乐关闭
     * 
     * 使用场景：
     * 1. 游戏启动时判断是否要播放背景音乐
     * 2. 设置界面显示开关的当前状态
     */
    public static getBGMEnabled(): boolean {
        const stored = localStorage.getItem(this.BGM_ENABLED_KEY);
        return stored ? stored === 'true' : true; // 默认启用背景音乐
    }
    
    /**
     * 初始化音频设置
     * 
     * 这是游戏启动时调用的方法，作用是恢复玩家之前的所有音频设置
     * 
     * 具体流程：
     * 1. 读取保存的音量设置并应用
     * 2. 读取保存的开关设置，决定是否播放背景音乐
     * 
     * 使用场景：在游戏初始化时调用（比如在GameProgressManager的初始化方法中）
     */
    public static initializeAudioSettings(): void {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            // 恢复音量设置
            const volume = this.getBGMVolume();
            audioManager.setBGMVolume(volume);
            
            // 恢复背景音乐开关状态
            const enabled = this.getBGMEnabled();
            if (enabled) {
                audioManager.playHomeBGM();  // 如果之前是开启的，就播放音乐
            }
            // 如果之前是关闭的，就不播放（什么都不做）
        }
    }
}

/*
总结这个类的作用：

想象你在玩一个手机游戏：
1. 你觉得背景音乐太吵，把音量调到20%
2. 你关闭游戏去做别的事
3. 第二天你重新打开游戏
4. 如果没有AudioSettings类：音量又变回默认的100%，你又要重新调整
5. 如果有AudioSettings类：音量还是你设置的20%，不需要重新调整

这就是AudioSettings的核心价值：让游戏"记住"玩家的音频偏好设置。

在代码层面：
- setBGMVolume/setBGMEnabled：保存设置 + 立即生效
- getBGMVolume/getBGMEnabled：读取之前保存的设置
- initializeAudioSettings：游戏启动时恢复所有设置
*/

