import { _decorator, Component, Node, Button } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 弹窗隐藏按钮组件
 * 将此组件添加到预制体中的按钮上，点击按钮时会隐藏整个弹窗
 * 
 * 功能：
 * 1. 点击按钮时隐藏指定的弹窗节点
 * 2. 可选择隐藏后是否销毁节点
 * 3. 支持隐藏完成后的回调函数
 * 
 * 注意：此组件仅负责隐藏弹窗，不负责显示弹窗
 * 显示弹窗功能请使用 PopupButtonBinder 组件
 */
@ccclass('PopupHiderButton')
export class PopupHiderButton extends Component {
    // 要隐藏的弹窗根节点，如果不指定，默认使用当前节点的父节点
    @property({
        type: Node,
        tooltip: '要隐藏的弹窗根节点，如果不指定，默认使用当前节点的父节点'
    })
    public popupRoot: Node | null = null;
    
    // 是否在隐藏后销毁节点
    @property({
        tooltip: '是否在隐藏后销毁节点（如果设为false，则只是隐藏节点）'
    })
    public destroyAfterHide: boolean = false;
    
    // 隐藏完成后的回调函数
    private onHideComplete: Function | null = null;
    
    start() {
        this.setupEventListener();
        
        // 确保默认不销毁节点，这样可以重复使用
        if (this.destroyAfterHide === undefined) {
            this.destroyAfterHide = false;
        }
        
        console.log('PopupHiderButton 初始化完成，destroyAfterHide =', this.destroyAfterHide);
    }
    
    /**
     * 设置按钮点击事件监听
     */
    private setupEventListener() {
        // 检查节点上是否有Button组件
        let button = this.getComponent(Button);
        if (!button) {
            // 如果没有Button组件，添加一个
            button = this.addComponent(Button);
        }
        
        // 添加点击事件监听
        this.node.on(Node.EventType.TOUCH_END, this.onButtonClick, this);
        
        console.log('弹窗隐藏按钮事件监听器已设置');
    }
    
    /**
     * 按钮点击事件处理
     */
    private onButtonClick() {
        console.log('弹窗隐藏按钮被点击');
        this.hidePopup();
    }
    
    /**
     * 隐藏弹窗
     * @param callback 隐藏完成后的回调函数
     */
    public hidePopup(callback?: Function) {
        // 保存回调函数
        this.onHideComplete = callback || null;
        
        // 获取要隐藏的弹窗根节点
        const popupNode = this.popupRoot || this.node.parent;
        if (!popupNode) {
            console.error('弹窗根节点不存在，无法隐藏弹窗');
            return;
        }
        
        console.log('开始隐藏弹窗:', popupNode.name);
        
        // 直接隐藏
        popupNode.active = false;
        this.onHideFinished(popupNode);
    }
    
    /**
     * 隐藏完成后的处理
     * @param popupNode 被隐藏的弹窗节点
     */
    private onHideFinished(popupNode: Node) {
        console.log('弹窗隐藏完成，准备重置状态');
        
        // 如果设置了隐藏后销毁，则销毁节点；否则只是隐藏节点
        if (this.destroyAfterHide) {
            console.log('销毁弹窗节点');
            popupNode.destroy();
        } else {
            console.log('弹窗节点已隐藏，但未销毁，可以再次显示');
            
            // 保留节点但隐藏，确保后续可以再次显示
            popupNode.active = false;
        }
        
        // 执行回调
        if (this.onHideComplete) {
            console.log('执行隐藏完成回调');
            this.onHideComplete();
            this.onHideComplete = null;
        }
        
        console.log('弹窗隐藏流程全部完成');
    }
    
    /**
     * 组件销毁时清理事件监听
     */
    onDestroy() {
        // 移除点击事件监听
        this.node.off(Node.EventType.TOUCH_END, this.onButtonClick, this);
        console.log('弹窗隐藏按钮事件监听器已移除');
    }
} 