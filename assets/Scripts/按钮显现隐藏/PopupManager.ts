import { _decorator, Component, Node, Prefab, instantiate, UITransform, Widget, Vec3, tween, Color, Graphics, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopupManager')
export class PopupManager extends Component {
    // 弹窗预制体引用
    @property(Prefab)
    private popupPrefab: Prefab = null!;
    
    // 弹窗容器节点
    @property(Node)
    private popupContainer: Node = null!;
    
    // 当前显示的弹窗实例
    private currentPopup: Node = null!;
    
    // 是否正在显示弹窗
    private isShowingPopup: boolean = false;
    
    /**
     * 显示弹窗
     * @param callback 弹窗显示完成后的回调函数
     */
    public showPopup(callback?: Function) {
        // 如果已经在显示弹窗，则返回
        if (this.isShowingPopup) {
            return;
        }
        
        this.isShowingPopup = true;
        
        // 如果没有指定容器，则使用当前节点作为容器
        if (!this.popupContainer) {
            this.popupContainer = this.node;
        }
        
        // 实例化弹窗预制体
        if (!this.currentPopup && this.popupPrefab) {
            this.currentPopup = instantiate(this.popupPrefab);
            this.popupContainer.addChild(this.currentPopup);
            
            // 设置弹窗位置为中心点，防止偏移
            this.currentPopup.position = new Vec3(0, 0, 0);
            
            // 设置弹窗初始状态
            this.currentPopup.scale = new Vec3(0.8, 0.8, 1);
            
            // 添加UIOpacity组件并设置透明度
            let uiOpacity = this.currentPopup.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = this.currentPopup.addComponent(UIOpacity);
            }
            uiOpacity.opacity = 0;
            
            // 创建背景遮罩
            this.createBackgroundMask();
        }
        
        // 显示弹窗动画
        this.currentPopup.active = true;
        
        // 获取UIOpacity组件
        const uiOpacity = this.currentPopup.getComponent(UIOpacity);
        
        // 使用缓动动画显示弹窗
        tween(this.currentPopup)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
            
        if (uiOpacity) {
            tween(uiOpacity)
                .to(0.3, { opacity: 255 })
                .call(() => {
                    // 动画完成后执行回调
                    if (callback) {
                        callback();
                    }
                })
                .start();
        }
        
        console.log('弹窗显示成功');
    }
    
    /**
     * 隐藏弹窗
     * @param callback 弹窗隐藏完成后的回调函数
     */
    public hidePopup(callback?: Function) {
        if (!this.currentPopup || !this.isShowingPopup) {
            return;
        }
        
        // 获取UIOpacity组件
        const uiOpacity = this.currentPopup.getComponent(UIOpacity);
        
        // 使用缓动动画隐藏弹窗
        tween(this.currentPopup)
            .to(0.2, { scale: new Vec3(0.8, 0.8, 1) })
            .start();
            
        if (uiOpacity) {
            tween(uiOpacity)
                .to(0.2, { opacity: 0 })
                .call(() => {
                    // 隐藏弹窗
                    this.currentPopup.active = false;
                    this.isShowingPopup = false;
                    
                    // 移除背景遮罩
                    this.removeBackgroundMask();
                    
                    // 动画完成后执行回调
                    if (callback) {
                        callback();
                    }
                })
                .start();
        } else {
            // 如果没有UIOpacity组件，直接隐藏
            this.currentPopup.active = false;
            this.isShowingPopup = false;
            this.removeBackgroundMask();
            if (callback) {
                callback();
            }
        }
        
        console.log('弹窗隐藏成功');
    }
    
    /**
     * 创建背景遮罩
     */
    private createBackgroundMask() {
        // 检查是否已存在背景遮罩
        let mask = this.popupContainer.getChildByName('PopupBackgroundMask');
        if (!mask) {
            // 创建背景遮罩节点
            mask = new Node('PopupBackgroundMask');
            this.popupContainer.insertChild(mask, 0); // 插入到最底层
            
            // 添加UITransform组件
            const transform = mask.addComponent(UITransform);
            transform.setContentSize(2000, 2000); // 设置足够大的尺寸
            
            // 添加Widget组件，使其填满父节点
            const widget = mask.addComponent(Widget);
            widget.isAlignTop = true;
            widget.isAlignBottom = true;
            widget.isAlignLeft = true;
            widget.isAlignRight = true;
            widget.top = 0;
            widget.bottom = 0;
            widget.left = 0;
            widget.right = 0;
            widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
            
            // 添加Graphics组件绘制背景
            const graphics = mask.addComponent(Graphics);
            graphics.fillColor = new Color(0, 0, 0, 150); // 黑色半透明
            graphics.rect(-1000, -1000, 2000, 2000);
            graphics.fill();
            
            // 添加UIOpacity组件
            const uiOpacity = mask.addComponent(UIOpacity);
            uiOpacity.opacity = 0;
            
            // 添加点击事件（可选，点击背景关闭弹窗）
            mask.on(Node.EventType.TOUCH_END, () => {
                this.hidePopup();
            });
        }
        
        // 显示背景遮罩
        mask.active = true;
        
        // 获取UIOpacity组件
        const uiOpacity = mask.getComponent(UIOpacity);
        if (uiOpacity) {
            tween(uiOpacity)
                .to(0.3, { opacity: 255 })
                .start();
        }
    }
    
    /**
     * 移除背景遮罩
     */
    private removeBackgroundMask() {
        const mask = this.popupContainer.getChildByName('PopupBackgroundMask');
        if (mask) {
            const uiOpacity = mask.getComponent(UIOpacity);
            if (uiOpacity) {
                tween(uiOpacity)
                    .to(0.2, { opacity: 0 })
                    .call(() => {
                        mask.active = false;
                    })
                    .start();
            } else {
                mask.active = false;
            }
        }
    }
} 