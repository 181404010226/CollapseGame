// 导入Cocos Creator引擎所需的模块
import { _decorator, Component, Node, Collider2D, Contact2DType, IPhysics2DContact, RigidBody2D, Vec3, instantiate, Prefab, UITransform, BoxCollider2D, PhysicsSystem2D } from 'cc';
// 导入ItemDropGame组件，用于游戏重启时的交互
import { ItemDropGame } from './ItemDropGame';
// 解构装饰器，用于组件声明和属性绑定
const { ccclass, property } = _decorator;

/**
 * 游戏失败管理器组件
 * 负责检测物品堆积超过分隔线的情况，并触发游戏失败机制
 */
@ccclass('GameFailureManager')
export class GameFailureManager extends Component {
    
    // ========== 公共属性配置区域 ==========
    
    @property(Node)
    public dividerLine: Node = null!;
    
    @property(Prefab)
    public failureUIPrefab: Prefab = null!;
    
    @property(Node)
    public gameContainer: Node = null!;

    @property({ type: Number, displayName: "触发失败延迟时间(秒)", tooltip: "物品接触虚线后多少秒触发游戏失败" })
    public failureDelay: number = 3;
    
    // ========== 私有状态变量区域 ==========
    
    private isGameOver: boolean = false;
    private failureUIInstance: Node | null = null;

        // 接触计时相关
    private contactingItems: Map<Node, number> = new Map(); // 存储接触物品和开始时间
    private failureTimer: Function | null = null; // 失败计时器回调
    
    // ========== 生命周期方法区域 ==========
    
    onLoad() {
        this.setupDividerLineCollider();
        this.setupGameContainer();
        
        // 添加全局碰撞监听器
        PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT, (selfCollider: Collider2D, otherCollider: Collider2D) => {
            if (selfCollider.node === this.dividerLine || otherCollider.node === this.dividerLine) {
                this.onDividerContactStart(selfCollider, otherCollider);
            }
        }, this);
        
        // 添加碰撞结束监听器
        PhysicsSystem2D.instance.on(Contact2DType.END_CONTACT, (selfCollider: Collider2D, otherCollider: Collider2D) => {
            if (selfCollider.node === this.dividerLine || otherCollider.node === this.dividerLine) {
                this.onDividerContactEnd(selfCollider, otherCollider);
            }
        }, this);
    }
    
    start() {
        // 确保物理系统启用
        if (!PhysicsSystem2D.instance.enable) {
            PhysicsSystem2D.instance.enable = true;
        }
        

    }
    
    // ========== 初始化方法区域 ==========
    
    private setupGameContainer(): void {
        if (!this.gameContainer) {
            this.gameContainer = this.node;
        }
    }
    
    private setupDividerLineCollider(): void {
        if (!this.dividerLine) {
            console.error('GameFailureManager: dividerLine 未设置！');
            return;
        }
        
        // 添加刚体组件
        let rigidBody = this.dividerLine.getComponent(RigidBody2D);
        if (!rigidBody) {
            rigidBody = this.dividerLine.addComponent(RigidBody2D);
            rigidBody.type = 0; // Static 静态刚体
            rigidBody.group = 1;
            rigidBody.enabledContactListener = true;
        } else {
            rigidBody.group = 1;
            rigidBody.enabledContactListener = true;
        }
        
        // 添加碰撞器组件
        let boxCollider = this.dividerLine.getComponent(BoxCollider2D);
        if (!boxCollider) {
            boxCollider = this.dividerLine.addComponent(BoxCollider2D);
            
            const uiTransform = this.dividerLine.getComponent(UITransform);
            if (uiTransform) {
                boxCollider.size.width = uiTransform.width;
                boxCollider.size.height = Math.max(uiTransform.height, 50);
            } else {
                boxCollider.size.width = 800;
                boxCollider.size.height = 50;
            }
        }
        
        // 配置碰撞器属性
        boxCollider.sensor = true;
        boxCollider.tag = 999;
        boxCollider.group = 1;
    }
    
    // ========== 碰撞检测方法区域 ==========
    
    private onDividerContactStart(selfCollider: Collider2D, otherCollider: Collider2D): void {
        if (this.isGameOver) return;
        
        const itemNode = otherCollider.node;
        
        if (!this.isValidGameItem(itemNode)) {
            return;
        }
        
        console.log('⚠️ GameFailureManager: 物品开始接触虚线:', itemNode.name);
        
        // 记录接触开始时间
        const currentTime = Date.now();
        this.contactingItems.set(itemNode, currentTime);
        
        // 启动计时器检查
        this.startFailureTimer();
    }
    
    private onDividerContactEnd(selfCollider: Collider2D, otherCollider: Collider2D): void {
        const itemNode = otherCollider.node;
        
        if (!this.isValidGameItem(itemNode)) {
            return;
        }
        
        console.log('✅ GameFailureManager: 物品结束接触虚线:', itemNode.name);
        
        // 移除接触记录
        this.contactingItems.delete(itemNode);
        
        // 如果没有物品在接触，停止计时器
        if (this.contactingItems.size === 0) {
            this.stopFailureTimer();
        }
    }
    
    private startFailureTimer(): void {
        // 如果计时器已经在运行，不重复启动
        if (this.failureTimer) {
            return;
        }
        
        console.log('⏰ GameFailureManager: 开始失败计时器');
        
        this.failureTimer = () => {
            this.checkFailureCondition();
        };
        
        // 每0.1秒检查一次
        this.schedule(this.failureTimer as any, 0.1);
    }
    
    private stopFailureTimer(): void {
        if (this.failureTimer) {
            console.log('⏹️ GameFailureManager: 停止失败计时器');
            this.unschedule(this.failureTimer as any);
            this.failureTimer = null;
        }
    }
    
    private checkFailureCondition(): void {
        if (this.isGameOver || this.contactingItems.size === 0) {
            this.stopFailureTimer();
            return;
        }
        
        const currentTime = Date.now();
        
        // 检查是否有物品接触超过指定时间
        for (const [itemNode, startTime] of this.contactingItems) {
            // 检查物品是否仍然有效
            if (!itemNode.isValid) {
                this.contactingItems.delete(itemNode);
                continue;
            }
            
            const contactDuration = (currentTime - startTime) / 1000; // 转换为秒
            
            if (contactDuration >= this.failureDelay) {
                console.log(`🚨 GameFailureManager: 物品 ${itemNode.name} 接触虚线超过 ${this.failureDelay} 秒，触发游戏失败！`);
                this.triggerGameFailure();
                return;
            }
        }
    }
    
    private isValidGameItem(node: Node): boolean {
        // 检查是否有刚体组件
        const rigidBody = node.getComponent(RigidBody2D);
        const hasRigidBody = !!rigidBody;
        
        // 排除虚线本身和其他非物品节点
        const isNotDividerLine = !node.name.includes('DividerLine') && 
                                !node.name.includes('虚线') && 
                                !node.name.includes('分隔线');
        
        // 检查是否是掉落物品
        const isDropItem = node.name.includes('DropItem_');
        
        return isDropItem && hasRigidBody && isNotDividerLine;
    }
    
    // ========== 游戏失败处理方法区域 ==========
    
    private triggerGameFailure(): void {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        console.log('GameFailureManager: 游戏失败！');
        
        // 停止失败计时器
        this.stopFailureTimer();
        
        // 清空接触记录
        this.contactingItems.clear();
        
        this.pauseGame();
        this.showFailureUI();
    }
    
    private pauseGame(): void {
        // 禁用游戏容器中的所有物理组件
        if (this.gameContainer) {
            this.gameContainer.children.forEach(child => {
                const rigidBody = child.getComponent(RigidBody2D);
                if (rigidBody) {
                    rigidBody.enabled = false;
                }
            });
        }
        
        // 通知ItemDropGame停止生成新物品
        const itemDropGame = this.node.getComponent(ItemDropGame);
        if (itemDropGame) {
            itemDropGame.setGameOver(true);
        }
    }
    
    private showFailureUI(): void {
        if (!this.failureUIPrefab) {
            console.error('GameFailureManager: failureUIPrefab 未设置');
            return;
        }
        
        this.failureUIInstance = instantiate(this.failureUIPrefab);
        
        const canvas = this.findCanvasNode();
        if (canvas) {
            canvas.addChild(this.failureUIInstance);
        } else {
            this.node.addChild(this.failureUIInstance);
        }
        
        // 配置失败UI的回调函数
        const failureUI = this.failureUIInstance.getComponent('GameFailureUI');
        if (failureUI) {
            (failureUI as any).setRestartCallback(() => {
                this.restartGame();
            });
        }
    }
    
    private findCanvasNode(): Node | null {
        let current = this.node;
        while (current.parent) {
            current = current.parent;
            if (current.name === 'Canvas') {
                return current;
            }
        }
        return null;
    }
    
    // ========== 游戏重启方法区域 ==========
    
    public restartGame(): void {
        console.log('GameFailureManager: 重新开始游戏');
        
        this.isGameOver = false;
        
        // 停止计时器并清空记录
        this.stopFailureTimer();
        this.contactingItems.clear();
        
        // 隐藏并销毁失败UI
        if (this.failureUIInstance?.isValid) {
            this.failureUIInstance.destroy();
            this.failureUIInstance = null;
        }
        
        this.clearGameArea();
        
        // 重新启动游戏逻辑
        const itemDropGame = this.node.getComponent(ItemDropGame);
        if (itemDropGame) {
            itemDropGame.setGameOver(false);
            itemDropGame.restartGame();
        }
    }
    
    private clearGameArea(): void {
        if (!this.gameContainer) return;
        
        // 收集需要移除的物品节点
        const itemsToRemove: Node[] = [];
        this.gameContainer.children.forEach(child => {
            if (child.name.includes('DropItem_')) {
                itemsToRemove.push(child);
            }
        });
        
        // 销毁所有收集到的物品节点
        itemsToRemove.forEach(item => {
            item.destroy();
        });
        
        // 重新启用所有物理组件
        this.gameContainer.children.forEach(child => {
            const rigidBody = child.getComponent(RigidBody2D);
            if (rigidBody) {
                rigidBody.enabled = true;
            }
        });
    }
    
    // ========== 公共查询方法区域 ==========
    
    public isGameOverState(): boolean {
        return this.isGameOver;
    }
    
    onDestroy(): void {
        // 清理计时器
        this.stopFailureTimer();
        this.contactingItems.clear();
        
        // 清理物理系统事件监听
        PhysicsSystem2D.instance.off(Contact2DType.BEGIN_CONTACT);
        PhysicsSystem2D.instance.off(Contact2DType.END_CONTACT);
    }
}































