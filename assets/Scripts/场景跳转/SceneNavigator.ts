import { _decorator, Component, Node, Button, director } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 场景导航器
 * 用于实现按钮点击跳转到其他场景的功能
 */
@ccclass('SceneNavigator')
export class SceneNavigator extends Component {
    @property({ type: String, tooltip: '目标场景名称' })
    public targetSceneName: string = '';

    @property({ tooltip: '是否在点击时自动跳转场景' })
    public autoNavigateOnClick: boolean = true;

    private _button: Button = null;

    start() {
        // 获取按钮组件
        this._button = this.getComponent(Button);
        
        // 如果启用了自动导航，则添加点击事件监听器
        if (this.autoNavigateOnClick && this._button && this._button.node) {
            this._button.node.on(Button.EventType.CLICK, this.navigateToScene, this);
        }
    }

    /**
     * 导航到目标场景
     */
    public navigateToScene() {
        if (this.targetSceneName && this.targetSceneName.trim() !== '') {
            console.log(`正在跳转到场景: ${this.targetSceneName}`);
            director.loadScene(this.targetSceneName);
        } else {
            console.warn('SceneNavigator: 未设置目标场景名称!');
        }
    }

    /**
     * 设置目标场景并导航
     * @param sceneName 目标场景名称
     */
    public setTargetAndNavigate(sceneName: string) {
        this.targetSceneName = sceneName;
        this.navigateToScene();
    }
} 