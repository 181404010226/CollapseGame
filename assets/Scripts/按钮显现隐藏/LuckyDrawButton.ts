import { _decorator, Component, Node, Button, Prefab, instantiate, find } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 抽奖按钮绑定脚本
 * 将此脚本挂载到需要显示抽奖弹窗的按钮上
 * 
 * 使用方式（按优先级）：
 * 1. 设置 luckyDrawComponent - 直接引用抽奖组件
 * 2. 设置 luckyDrawPrefab - 使用预制体实例化
 * 3. 自动查找场景中的LuckyDraw组件
 */
@ccclass('LuckyDrawButton')
export class LuckyDrawButton extends Component {
    
    @property({
        type: Prefab,
        tooltip: '抽奖预制体 - 拖入包含LuckyDraw脚本的预制体'
    })
    public luckyDrawPrefab: Prefab = null!;
    
    @property({
        type: Component,
        tooltip: '抽奖脚本组件引用 - 可选，如果设置了会优先使用这个'
    })
    public luckyDrawComponent: Component = null!;

    // 运行时实例化的抽奖节点
    private luckyDrawInstance: Node = null!;

    start() {
        this.setupButtonEvent();
        this.setupLuckyDrawInstance();
    }

    /**
     * 设置抽奖实例
     */
    private setupLuckyDrawInstance(): void {
        // 如果直接设置了组件引用，优先使用
        if (this.luckyDrawComponent) {
            console.log('[抽奖按钮] 使用直接设置的组件引用');
            return;
        }

        // 如果没有预制体，尝试在场景中查找
        if (!this.luckyDrawPrefab) {
            console.warn('[抽奖按钮] 没有设置预制体，尝试在场景中查找LuckyDraw组件');
            this.findLuckyDrawInScene();
            return;
        }

        // 检查Canvas下是否已有实例
        const canvas = find('Canvas');
        if (canvas) {
            const existingInstance = canvas.getChildByName('LuckyDrawInstance');
            if (existingInstance) {
                this.luckyDrawInstance = existingInstance;
                console.log('[抽奖按钮] 使用已存在的抽奖实例');
                return;
            }
        }

        // 实例化预制体
        this.luckyDrawInstance = instantiate(this.luckyDrawPrefab);
        this.luckyDrawInstance.name = 'LuckyDrawInstance';
        
        // 添加到Canvas下
        if (canvas) {
            canvas.addChild(this.luckyDrawInstance);
            // 初始隐藏整个实例
            this.luckyDrawInstance.active = false;
            
            // 确保子节点也是正确的初始状态
            const luckyDrawComp = this.luckyDrawInstance.getComponent('LuckyDraw') as any;
            if (luckyDrawComp) {
                // 隐藏所有弹窗相关的节点
                if (luckyDrawComp.winningPopup) {
                    luckyDrawComp.winningPopup.active = false;
                }
                if (luckyDrawComp.spriteSplash) {
                    luckyDrawComp.spriteSplash.active = false;
                }
                if (luckyDrawComp.winningBackground) {
                    luckyDrawComp.winningBackground.active = false;
                }
            }
        }
        
        console.log('[抽奖按钮] 预制体实例化完成');
    }

    /**
     * 在场景中查找LuckyDraw组件
     */
    private findLuckyDrawInScene(): void {
        const canvas = find('Canvas');
        if (!canvas) return;

        // 递归查找LuckyDraw组件
        const findLuckyDraw = (node: Node): Component | null => {
            const luckyDraw = node.getComponent('LuckyDraw');
            if (luckyDraw) return luckyDraw;

            for (const child of node.children) {
                const result = findLuckyDraw(child);
                if (result) return result;
            }
            return null;
        };

        const foundComponent = findLuckyDraw(canvas);
        if (foundComponent) {
            this.luckyDrawComponent = foundComponent;
            console.log('[抽奖按钮] 在场景中找到了LuckyDraw组件');
        } else {
            console.error('[抽奖按钮] 场景中没有找到LuckyDraw组件，请设置预制体或组件引用');
        }
    }

    /**
     * 设置按钮点击事件
     */
    private setupButtonEvent(): void {
        // 确保按钮有 Button 组件
        let button = this.getComponent(Button);
        if (!button) {
            button = this.addComponent(Button);
        }

        // 绑定点击事件
        this.node.on(Node.EventType.TOUCH_END, this.onButtonClick, this);
        console.log('[抽奖按钮] 已绑定点击事件');
    }

    /**
     * 公共方法：显示抽奖UI - 供GameProgressManager调用
     */
    public showLuckyDrawUI(): void {
        this.triggerLuckyDraw();
    }

    /**
     * 按钮点击事件处理
     */
    private onButtonClick(): void {
        this.triggerLuckyDraw();
    }

    /**
     * 触发抽奖UI显示的核心逻辑
     */
    private triggerLuckyDraw(): void {
        console.log('[抽奖按钮] 按钮被点击');
        
        // 直接使用组件引用
        let luckyDrawComp: any = null;

        // 获取LuckyDraw组件
        if (this.luckyDrawComponent) {
            luckyDrawComp = this.luckyDrawComponent;
        } else if (this.luckyDrawInstance) {
            luckyDrawComp = this.luckyDrawInstance.getComponent('LuckyDraw');
        }

        if (!luckyDrawComp) {
            console.error('[抽奖按钮] 找不到LuckyDraw组件，请检查设置');
            return;
        }

        // 调用抽奖脚本的显示方法
        if (luckyDrawComp.showLuckyDrawPopup) {
            luckyDrawComp.showLuckyDrawPopup();
        } else {
            console.error('[抽奖按钮] 组件没有showLuckyDrawPopup方法');
        }
    }

    onDestroy(): void {
        // 清理事件监听
        if (this.node && this.node.isValid) {
            this.node.off(Node.EventType.TOUCH_END, this.onButtonClick, this);
        }
    }
}