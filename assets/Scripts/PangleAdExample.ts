import { _decorator, Component, Node, Button, Label, log, error } from 'cc';
import { PangleAdManager, PangleAdEventCallback, PangleAd } from './PangleAdManager';

const { ccclass, property } = _decorator;

/**
 * 穿山甲广告使用示例
 * 展示如何在游戏中集成和使用穿山甲广告
 */
@ccclass('PangleAdExample')
export class PangleAdExample extends Component {

    @property(Button)
    initButton: Button = null;

    @property(Button)
    loadAdButton: Button = null;

    @property(Button)
    showAdButton: Button = null;

    @property(Button)
    checkAdButton: Button = null;

    @property(Button)
    destroyAdButton: Button = null;

    @property(Button)
    quickShowButton: Button = null;

    @property(Label)
    statusLabel: Label = null;

    private adManager: PangleAdManager = null;

    start() {
        // 获取穿山甲广告管理器实例
        this.adManager = PangleAdManager.getInstance();
        
        // 设置广告事件回调
        this.setupAdCallbacks();
        
        // 绑定按钮事件
        this.setupButtons();
        
        this.updateStatus('穿山甲广告示例已初始化');
        log('穿山甲广告示例已启动');
    }

    /**
     * 设置广告事件回调
     */
    private setupAdCallbacks() {
        const callback: PangleAdEventCallback = {
            onInitResult: (success: boolean, message: string) => {
                this.updateStatus(`SDK初始化: ${success ? '成功' : '失败'} - ${message}`);
                log(`SDK初始化结果: ${success ? '成功' : '失败'} - ${message}`);
            },

            onAdLoadResult: (success: boolean, message: string) => {
                this.updateStatus(`广告加载: ${success ? '成功' : '失败'} - ${message}`);
                log(`广告加载结果: ${success ? '成功' : '失败'} - ${message}`);
            },

            onAdRenderResult: (success: boolean, message: string) => {
                this.updateStatus(`广告渲染: ${success ? '成功' : '失败'} - ${message}`);
                log(`广告渲染结果: ${success ? '成功' : '失败'} - ${message}`);
            },

            onAdShowResult: (success: boolean, message: string, ecpmInfo?: string) => {
                this.updateStatus(`广告展示: ${success ? '成功' : '失败'} - ${message}`);
                log(`广告展示结果: ${success ? '成功' : '失败'} - ${message}`);
                
                if (success && ecpmInfo) {
                    log(`广告收益信息: ${ecpmInfo}`);
                }
            },

            onAdClick: () => {
                this.updateStatus('广告被点击');
                log('广告被点击');
            },

            onAdClose: (closeType: number) => {
                this.updateStatus(`广告关闭，关闭类型: ${closeType}`);
                log(`广告关闭，关闭类型: ${closeType}`);
                
                // 根据关闭类型处理不同逻辑
                this.handleAdClose(closeType);
            }
        };

        this.adManager.setCallback(callback);
        log('广告事件回调已设置');
    }

    /**
     * 设置按钮事件
     */
    private setupButtons() {
        if (this.initButton) {
            this.initButton.node.on(Button.EventType.CLICK, this.onInitButtonClick, this);
        }

        if (this.loadAdButton) {
            this.loadAdButton.node.on(Button.EventType.CLICK, this.onLoadAdButtonClick, this);
        }

        if (this.showAdButton) {
            this.showAdButton.node.on(Button.EventType.CLICK, this.onShowAdButtonClick, this);
        }

        if (this.checkAdButton) {
            this.checkAdButton.node.on(Button.EventType.CLICK, this.onCheckAdButtonClick, this);
        }

        if (this.destroyAdButton) {
            this.destroyAdButton.node.on(Button.EventType.CLICK, this.onDestroyAdButtonClick, this);
        }

        if (this.quickShowButton) {
            this.quickShowButton.node.on(Button.EventType.CLICK, this.onQuickShowButtonClick, this);
        }
    }

    /**
     * 初始化SDK按钮点击事件
     */
    private async onInitButtonClick() {
        try {
            this.updateStatus('正在初始化SDK...');
            const success = await this.adManager.initSDK();
            
            if (success) {
                this.updateStatus('SDK初始化成功');
            } else {
                this.updateStatus('SDK初始化失败');
            }
        } catch (err) {
            this.updateStatus(`SDK初始化异常: ${err.message}`);
            error('SDK初始化异常:', err);
        }
    }

    /**
     * 加载广告按钮点击事件
     */
    private async onLoadAdButtonClick() {
        try {
            if (!this.adManager.getInitStatus()) {
                this.updateStatus('请先初始化SDK');
                return;
            }

            this.updateStatus('正在加载开屏广告...');
            const success = await this.adManager.loadSplashAd();
            
            if (success) {
                this.updateStatus('开屏广告加载成功');
            } else {
                this.updateStatus('开屏广告加载失败');
            }
        } catch (err) {
            this.updateStatus(`加载广告异常: ${err.message}`);
            error('加载广告异常:', err);
        }
    }

    /**
     * 展示广告按钮点击事件
     */
    private async onShowAdButtonClick() {
        try {
            if (!this.adManager.getInitStatus()) {
                this.updateStatus('请先初始化SDK');
                return;
            }

            this.updateStatus('正在展示开屏广告...');
            const success = await this.adManager.showSplashAd();
            
            if (success) {
                this.updateStatus('开屏广告展示成功');
            } else {
                this.updateStatus('开屏广告展示失败');
            }
        } catch (err) {
            this.updateStatus(`展示广告异常: ${err.message}`);
            error('展示广告异常:', err);
        }
    }

    /**
     * 检查广告状态按钮点击事件
     */
    private async onCheckAdButtonClick() {
        try {
            if (!this.adManager.getInitStatus()) {
                this.updateStatus('请先初始化SDK');
                return;
            }

            this.updateStatus('正在检查广告状态...');
            const isReady = await this.adManager.isAdReady();
            
            this.updateStatus(`广告状态: ${isReady ? '已准备' : '未准备'}`);
        } catch (err) {
            this.updateStatus(`检查广告状态异常: ${err.message}`);
            error('检查广告状态异常:', err);
        }
    }

    /**
     * 销毁广告按钮点击事件
     */
    private onDestroyAdButtonClick() {
        this.adManager.destroyAd();
        this.updateStatus('广告已销毁');
    }

    /**
     * 快速展示广告按钮点击事件（一键操作）
     */
    private async onQuickShowButtonClick() {
        try {
            this.updateStatus('正在快速展示开屏广告...');
            
            // 使用便捷方法，自动处理初始化、加载和展示
            const success = await PangleAd.showSplashAd({
                onInitResult: (success: boolean, message: string) => {
                    log(`快速模式 - SDK初始化: ${success ? '成功' : '失败'} - ${message}`);
                },
                onAdLoadResult: (success: boolean, message: string) => {
                    log(`快速模式 - 广告加载: ${success ? '成功' : '失败'} - ${message}`);
                },
                onAdShowResult: (success: boolean, message: string, ecpmInfo?: string) => {
                    log(`快速模式 - 广告展示: ${success ? '成功' : '失败'} - ${message}`);
                    if (ecpmInfo) {
                        log(`快速模式 - 收益信息: ${ecpmInfo}`);
                    }
                },
                onAdClick: () => {
                    log('快速模式 - 广告被点击');
                },
                onAdClose: (closeType: number) => {
                    log(`快速模式 - 广告关闭，关闭类型: ${closeType}`);
                    this.handleAdClose(closeType);
                }
            });
            
            if (success) {
                this.updateStatus('快速展示开屏广告成功');
            } else {
                this.updateStatus('快速展示开屏广告失败');
            }
        } catch (err) {
            this.updateStatus(`快速展示广告异常: ${err.message}`);
            error('快速展示广告异常:', err);
        }
    }

    /**
     * 处理广告关闭事件
     */
    private handleAdClose(closeType: number) {
        // 根据关闭类型处理不同的业务逻辑
        switch (closeType) {
            case 1:
                // 用户主动关闭
                log('用户主动关闭广告，可能没有获得奖励');
                break;
            case 2:
                // 广告播放完成后关闭
                log('广告播放完成，用户可以获得奖励');
                this.giveUserReward();
                break;
            case 3:
                // 点击广告后关闭
                log('用户点击广告后关闭');
                break;
            default:
                log('广告关闭，未知关闭类型');
                break;
        }
    }

    /**
     * 给用户奖励的示例方法
     */
    private giveUserReward() {
        log('给用户发放奖励');
        this.updateStatus('恭喜！您获得了观看广告的奖励');
        
        // 在这里添加具体的奖励逻辑
        // 比如增加金币、道具等
    }

    /**
     * 更新状态显示
     */
    private updateStatus(message: string) {
        if (this.statusLabel) {
            this.statusLabel.string = `状态: ${message}`;
        }
        log(`状态更新: ${message}`);
    }

    /**
     * 游戏启动时自动展示开屏广告的示例
     */
    public async showSplashAdOnGameStart() {
        try {
            log('游戏启动，准备展示开屏广告');
            
            // 延迟一点时间，确保游戏界面加载完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const success = await PangleAd.showSplashAd({
                onAdShowResult: (success: boolean, message: string) => {
                    if (success) {
                        log('游戏启动开屏广告展示成功');
                    } else {
                        log('游戏启动开屏广告展示失败，继续进入游戏');
                        this.enterMainGame();
                    }
                },
                onAdClose: (closeType: number) => {
                    log('开屏广告关闭，进入游戏主界面');
                    this.enterMainGame();
                }
            });
            
            if (!success) {
                // 如果广告展示失败，直接进入游戏
                this.enterMainGame();
            }
        } catch (error) {
            log('展示启动开屏广告失败，直接进入游戏');
            this.enterMainGame();
        }
    }

    /**
     * 进入游戏主界面
     */
    private enterMainGame() {
        log('进入游戏主界面');
        // 在这里添加进入游戏主界面的逻辑
    }

    onDestroy() {
        // 清理按钮事件
        if (this.initButton) {
            this.initButton.node.off(Button.EventType.CLICK, this.onInitButtonClick, this);
        }
        if (this.loadAdButton) {
            this.loadAdButton.node.off(Button.EventType.CLICK, this.onLoadAdButtonClick, this);
        }
        if (this.showAdButton) {
            this.showAdButton.node.off(Button.EventType.CLICK, this.onShowAdButtonClick, this);
        }
        if (this.checkAdButton) {
            this.checkAdButton.node.off(Button.EventType.CLICK, this.onCheckAdButtonClick, this);
        }
        if (this.destroyAdButton) {
            this.destroyAdButton.node.off(Button.EventType.CLICK, this.onDestroyAdButtonClick, this);
        }
        if (this.quickShowButton) {
            this.quickShowButton.node.off(Button.EventType.CLICK, this.onQuickShowButtonClick, this);
        }
    }
}