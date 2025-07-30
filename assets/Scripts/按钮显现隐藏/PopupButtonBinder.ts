import { _decorator, Component, Node, Prefab, instantiate, Button, UIOpacity, tween, Vec3, UITransform, find } from 'cc';
const { ccclass, property } = _decorator;

/**
 * PopupButtonBinder
 * 弹窗显示组件，负责实例化和显示弹窗预制体
 * 
 * 功能：
 * 1. 点击按钮时显示指定的弹窗预制体
 * 2. 支持动画显示效果
 * 3. 可自定义弹窗容器节点
 * 
 * 注意：此组件仅负责显示弹窗，不负责隐藏弹窗
 * 隐藏弹窗功能请使用 PopupHiderButton 组件
 */
@ccclass('PopupButtonBinder')
export class PopupButtonBinder extends Component {
    @property({
        type: Prefab,
        tooltip: '要实例化的弹窗预制体（必填）',
    })
    public popupPrefab: Prefab | null = null;

    @property({
        type: Node,
        tooltip: '弹窗父节点（默认为当前节点的父节点）',
    })
    public popupContainer: Node | null = null;

    @property({
        tooltip: '是否播放入场/离场动画',
    })
    public useAnimation: boolean = true;

    @property({
        tooltip: '动画时长（秒）',
        visible: function (this: any) { return this.useAnimation; },
    })
    public animationDuration: number = 0.3;

    /* ================================================================ */
    // 运行时数据
    private currentPopup: Node | null = null;
    private isShowingPopup: boolean = false;
    private popupId: string = '';

    /* ============================ 生命周期 ============================ */
    start() {
        this.registerButtonEvent();

        if (!this.popupPrefab) {
            console.error('[PopupButtonBinder] 请在 Inspector 中指定 popupPrefab');
            return;
        }

        // 根据预制体名称与按钮 UUID 生成唯一标识
        this.popupId = `Popup_${this.popupPrefab.name}_${this.node.uuid.substring(0, 8)}`;
    }

    /* ============================ 事件绑定 ============================ */
    private registerButtonEvent() {
        // 若按钮上没有 Button 组件，则补加一个以支持点击事件
        if (!this.getComponent(Button)) {
            this.addComponent(Button);
        }
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    private onClick() {
        console.log('[PopupButtonBinder] 按钮被点击');
        // 无论当前状态如何，都尝试显示弹窗
        this.showPopup();
    }

    /* ============================ 显示弹窗 ============================ */
    public showPopup(callback?: () => void) {
        // 添加调试日志
        console.log('[PopupButtonBinder] showPopup 调用, isShowing=', this.isShowingPopup);
        
        // 如果当前已经在显示弹窗，先销毁当前弹窗再创建新的
        if (this.isShowingPopup) {
            this.cleanup();
        }
        
        if (!this.popupPrefab) {
            console.error('[PopupButtonBinder] popupPrefab 为空，无法实例化弹窗');
            return;
        }

        // 优先使用用户指定的容器；若未指定，则尝试使用 Canvas；最后回退到当前节点父级。
        let container = this.popupContainer;
        if (!container) {
            const canvasNode = find('Canvas');
            if (canvasNode) {
                container = canvasNode;
                console.log('[PopupButtonBinder] 未指定容器，自动使用 Canvas 作为弹窗父节点');
            } else {
                container = this.node.parent;
                console.log('[PopupButtonBinder] 未找到 Canvas，使用按钮父节点作为弹窗父节点');
            }
        }

        this.isShowingPopup = true;

        // 始终创建新的弹窗实例，避免与历史节点耦合
        this.currentPopup = instantiate(this.popupPrefab);
        this.currentPopup.name = this.popupId;
        container.addChild(this.currentPopup);
        
        // 保持预制体自身的 AnchorPoint，不再强制修改，避免位置被意外平移
        const popupTransform = this.currentPopup.getComponent(UITransform);
        if (popupTransform) {
            console.log('[PopupButtonBinder] 弹窗 AnchorPoint=', popupTransform.anchorPoint);
        }
        const containerTransform = container?.getComponent(UITransform);
        if (containerTransform) {
            console.log('[PopupButtonBinder] 容器锚点:', containerTransform.anchorPoint, '尺寸:', containerTransform.contentSize);
        }
        console.log('[PopupButtonBinder] 弹窗初始位置', this.currentPopup.position);
        this.currentPopup.position = new Vec3(0, 0, 0);

        // 直接显示弹窗，不播放入场动画
        const uiOpacity = this.currentPopup.getComponent(UIOpacity) || this.currentPopup.addComponent(UIOpacity);
        uiOpacity.opacity = 255;  // 设置为完全不透明
        this.currentPopup.scale = new Vec3(1, 1, 1);  // 设置为正常大小
        
        console.log('[PopupButtonBinder] 弹窗直接显示，无动画效果');
        
        if (callback) {
            callback();
        }
        // 调用后再次打印世界坐标
        console.log('[PopupButtonBinder] 弹窗世界坐标:', this.currentPopup.worldPosition);
    }

    /* ============================ 公共方法 ============================ */
    /**
     * 检查当前是否有弹窗在显示
     * @returns 是否有弹窗正在显示
     */
    public isPopupShowing(): boolean {
        return this.isShowingPopup && this.currentPopup != null && this.currentPopup.isValid;
    }
    
    /* ============================ 隐藏弹窗 ============================ */
    public hidePopup(callback?: () => void) {
        if (!this.currentPopup || !this.isShowingPopup) {
            return;
        }

        if (this.useAnimation) {
            const uiOpacity = this.currentPopup.getComponent(UIOpacity);
            
            // 延迟到下一帧播放动画
            this.scheduleOnce(() => {
                if (uiOpacity) {
                    tween(this.currentPopup)
                        .to(this.animationDuration / 2, { scale: new Vec3(0.8, 0.8, 1) })
                        .start();

                    tween(uiOpacity)
                        .to(this.animationDuration / 2, { opacity: 0 })
                        .call(() => {
                            this.cleanup();
                            if (callback) callback();
                        })
                        .start();
                } else {
                    // 没有透明度组件时仅做缩放动画
                    tween(this.currentPopup)
                        .to(this.animationDuration / 2, { scale: new Vec3(0.8, 0.8, 1) })
                        .call(() => {
                            this.cleanup();
                            if (callback) callback();
                        })
                        .start();
                }
            }, 0);
        } else {
            this.cleanup();
            if (callback) callback();
        }
    }

    /* ============================ 状态复位 ============================ */
    // 移除 forceReset 方法，因为不再需要被 PopupHiderButton 调用

    /* ============================ 内部方法 ============================ */
    private cleanup() {
        // 取消所有可能正在进行的动画
        this.unscheduleAllCallbacks();
        
        if (this.currentPopup && this.currentPopup.isValid) {
            // 停止所有可能的 tween 动画
            if (this.useAnimation) {
                tween(this.currentPopup).stop();
                const uiOpacity = this.currentPopup.getComponent(UIOpacity);
                if (uiOpacity) {
                    tween(uiOpacity).stop();
                }
            }
            
            // 销毁当前弹窗节点
            this.currentPopup.destroy();
        }
        
        // 重置状态
        this.currentPopup = null;
        this.isShowingPopup = false;
        
        console.log('[PopupButtonBinder] 弹窗已清理，可以重新显示');
    }

    onDestroy() {
        if (this.node) {
            this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
        }
        this.unscheduleAllCallbacks();
        this.cleanup();
    }
}