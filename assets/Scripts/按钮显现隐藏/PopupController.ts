import { _decorator, Component, Node, Button } from 'cc';
import { PopupManager } from './PopupManager';

const { ccclass, property } = _decorator;

@ccclass('PopupController')
export class PopupController extends Component {
    // 弹窗管理器引用
    @property(PopupManager)
    private popupManager: PopupManager = null!;
    
    // 触发弹窗的按钮
    @property(Node)
    private triggerButton: Node = null!;
    
    // 弹窗关闭按钮
    @property(Node)
    private closeButton: Node = null!;
    
    start() {
        this.setupEventListeners();
    }
    
    /**
     * 设置事件监听器
     */
    private setupEventListeners() {
        // 检查触发按钮是否存在
        if (this.triggerButton) {
            // 添加点击事件
            this.triggerButton.on(Node.EventType.TOUCH_END, () => {
                this.showPopup();
            });
            
            console.log('弹窗触发按钮事件监听器已设置');
        } else {
            console.warn('弹窗触发按钮未设置');
        }
        
        // 检查关闭按钮是否存在
        if (this.closeButton) {
            // 添加点击事件
            this.closeButton.on(Node.EventType.TOUCH_END, () => {
                this.hidePopup();
            });
            
            console.log('弹窗关闭按钮事件监听器已设置');
        } else {
            console.warn('弹窗关闭按钮未设置');
        }
    }
    
    /**
     * 显示弹窗
     */
    public showPopup() {
        if (this.popupManager) {
            this.popupManager.showPopup(() => {
                console.log('弹窗显示完成回调');
                // 这里可以添加弹窗显示完成后的逻辑
            });
        } else {
            console.error('弹窗管理器未设置，无法显示弹窗');
        }
    }
    
    /**
     * 隐藏弹窗
     */
    public hidePopup() {
        if (this.popupManager) {
            this.popupManager.hidePopup(() => {
                console.log('弹窗隐藏完成回调');
                // 这里可以添加弹窗隐藏完成后的逻辑
            });
        } else {
            console.error('弹窗管理器未设置，无法隐藏弹窗');
        }
    }
    
    /**
     * 组件销毁时清理事件监听器
     */
    onDestroy() {
        // 清理触发按钮事件监听器
        if (this.triggerButton) {
            this.triggerButton.off(Node.EventType.TOUCH_END);
        }
        
        // 清理关闭按钮事件监听器
        if (this.closeButton) {
            this.closeButton.off(Node.EventType.TOUCH_END);
        }
        
        console.log('弹窗控制器已销毁，事件监听器已清理');
    }
} 