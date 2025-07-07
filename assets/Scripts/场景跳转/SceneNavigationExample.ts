import { _decorator, Component, Node, Button } from 'cc';
import { SceneNavigator } from './SceneNavigator';
const { ccclass, property } = _decorator;

/**
 * 场景导航示例
 * 演示如何使用SceneNavigator组件以及如何通过代码控制场景跳转
 */
@ccclass('SceneNavigationExample')
export class SceneNavigationExample extends Component {
    @property({ type: Node, tooltip: '需要添加导航功能的按钮节点' })
    public navigationButton: Node = null;
    
    @property({ type: String, tooltip: '目标场景名称' })
    public targetSceneName: string = '';
    
    start() {
        // 检查是否已经设置了按钮节点
        if (this.navigationButton && this.navigationButton.isValid) {
            try {
                // 获取或添加SceneNavigator组件
                let navigator = this.navigationButton.getComponent(SceneNavigator);
                if (!navigator) {
                    navigator = this.navigationButton.addComponent(SceneNavigator);
                }
                
                // 设置目标场景名称
                if (navigator) {
                    navigator.targetSceneName = this.targetSceneName;
                    console.log(`已为按钮设置场景导航: ${this.targetSceneName}`);
                } else {
                    console.warn('SceneNavigationExample: 无法添加SceneNavigator组件!');
                }
            } catch (error) {
                console.error('SceneNavigationExample: 设置场景导航时出错:', error);
            }
        } else {
            console.warn('SceneNavigationExample: 未设置导航按钮节点或节点无效!');
        }
    }
    
    /**
     * 通过代码方式跳转到指定场景
     * 可以绑定到UI按钮的点击事件
     * @param sceneName 可选的场景名称，如果不提供则使用预设的targetSceneName
     */
    public navigateToScene(sceneName?: string) {
        try {
            const targetScene = sceneName || this.targetSceneName;
            
            if (targetScene && targetScene.trim() !== '') {
                // 获取当前节点上的SceneNavigator组件
                const navigator = this.getComponent(SceneNavigator);
                if (navigator) {
                    navigator.setTargetAndNavigate(targetScene);
                } else {
                    // 如果当前节点没有SceneNavigator组件，则创建一个临时的
                    const tempNavigator = this.addComponent(SceneNavigator);
                    if (tempNavigator) {
                        tempNavigator.setTargetAndNavigate(targetScene);
                    } else {
                        console.warn('SceneNavigationExample: 无法创建临时SceneNavigator组件!');
                    }
                }
            } else {
                console.warn('SceneNavigationExample: 未指定目标场景名称!');
            }
        } catch (error) {
            console.error('SceneNavigationExample: 场景导航时出错:', error);
        }
    }
} 