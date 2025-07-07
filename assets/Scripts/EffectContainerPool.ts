import { _decorator, Component, Node, Prefab, instantiate, director, game, Tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EffectContainerPool')
export class EffectContainerPool extends Component {
    private static instance: EffectContainerPool | null = null;
    
    @property(Prefab)
    public effectContainerPrefab: Prefab = null!;
    
    private pool: Node[] = [];
    private activeItems: Set<Node> = new Set();
    
    // 对象池配置
    private readonly INITIAL_POOL_SIZE = 3;
    private readonly MAX_POOL_SIZE = 10;
    
    protected onLoad(): void {
        // 确保单例
        if (EffectContainerPool.instance) {
            this.destroy();
            return;
        }
        
        EffectContainerPool.instance = this;
        
        // 设置为常驻节点，场景切换时不销毁
        game.addPersistRootNode(this.node);
        
        // 初始化对象池
        this.initializePool();
    }
    
    /**
     * 获取单例实例
     */
    public static getInstance(): EffectContainerPool | null {
        return EffectContainerPool.instance;
    }
    
    /**
     * 初始化对象池
     */
    private initializePool(): void {
        if (!this.effectContainerPrefab) {
            console.error('EffectContainerPool: 特效容器预制体未设置！');
            return;
        }
        
        // 预创建一定数量的对象
        for (let i = 0; i < this.INITIAL_POOL_SIZE; i++) {
            const item = this.createNewItem();
            this.pool.push(item);
        }
        
        console.log(`🏊 EffectContainerPool 初始化完成，预创建 ${this.INITIAL_POOL_SIZE} 个对象`);
    }
    
    /**
     * 创建新的对象
     */
    private createNewItem(): Node {
        const item = instantiate(this.effectContainerPrefab);
        item.active = false;
        this.node.addChild(item);
        return item;
    }
    
    /**
     * 从对象池获取对象
     */
    public getItem(): Node | null {
        if (!this.effectContainerPrefab) {
            console.error('EffectContainerPool: 特效容器预制体未设置！');
            return null;
        }
        
        let item: Node;
        
        if (this.pool.length > 0) {
            // 从对象池获取
            item = this.pool.pop()!;
        } else {
            // 对象池为空，创建新对象
            item = this.createNewItem();
        }
        
        // 重置对象状态
        this.resetItem(item);
        
        // 激活对象
        item.active = true;
        this.activeItems.add(item);
        
        return item;
    }
    
    /**
     * 回收对象到对象池
     */
    public returnItem(item: Node): void {
        if (!item?.isValid) {
            return;
        }
        
        // 从激活列表中移除
        this.activeItems.delete(item);
        
        // 重置对象状态
        this.resetItem(item);
        
        // 停用对象
        item.active = false;
        
        // 回收到对象池
        if (this.pool.length < this.MAX_POOL_SIZE) {
            this.pool.push(item);
        } else {
            // 对象池已满，直接销毁
            item.destroy();
        }
    }
    
    /**
     * 重置对象状态
     */
    private resetItem(item: Node): void {
        // 重置位置、缩放、旋转
        item.setPosition(0, 0, 0);
        item.setScale(1, 1, 1);
        item.setRotationFromEuler(0, 0, 0);
        
        // 停止所有与该节点相关的 Tween 动画
        Tween.stopAllByTarget(item);
        
        // 重置透明度（如果节点上挂载了 UIOpacity 组件）
        const opacity = item.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 255;
        }
    }
    
    /**
     * 清空对象池
     */
    public clearPool(): void {
        // 销毁对象池中的所有对象
        this.pool.forEach(item => {
            if (item?.isValid) {
                item.destroy();
            }
        });
        this.pool.length = 0;
        
        // 销毁所有激活的对象
        this.activeItems.forEach(item => {
            if (item?.isValid) {
                item.destroy();
            }
        });
        this.activeItems.clear();
        
        console.log('🗑️ EffectContainerPool 对象池已清空');
    }
    
    /**
     * 获取对象池状态信息
     */
    public getPoolInfo(): { poolSize: number; activeSize: number; totalSize: number } {
        return {
            poolSize: this.pool.length,
            activeSize: this.activeItems.size,
            totalSize: this.pool.length + this.activeItems.size
        };
    }
    
    protected onDestroy(): void {
        // 清空对象池
        this.clearPool();
        
        // 清除单例引用
        if (EffectContainerPool.instance === this) {
            EffectContainerPool.instance = null;
        }
        
        console.log('💀 EffectContainerPool 已销毁');
    }
} 