import { _decorator, Component, Node, Button } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 弹窗隐藏组件
 * 将此组件绑定到按钮上，可以实现点击按钮隐藏指定弹窗的功能
 */
@ccclass('PopupHider')
export class PopupHider extends Component {
    @property({
        type: Node,
        tooltip: '要隐藏的弹窗节点'
    })
    popupNode: Node | null = null;

    start() {
        // 获取当前节点上的Button组件
        const button = this.getComponent(Button);
        
        // 如果存在Button组件，添加点击事件监听
        if (button) {
            this.node.on(Button.EventType.CLICK, this.hidePopup, this);
        } else {
            console.warn('PopupHider组件所在节点没有Button组件，无法响应点击事件');
        }
    }

    /**
     * 隐藏弹窗
     */
    hidePopup() {
        if (this.popupNode) {
            this.popupNode.active = false;
        } else {
            console.warn('未设置要隐藏的弹窗节点');
        }
    }

    onDestroy() {
        // 移除事件监听，防止内存泄漏
        if (this.node) {
            this.node.off(Button.EventType.CLICK, this.hidePopup, this);
        }
    }
}