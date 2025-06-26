import { _decorator, Component, Node, Prefab, RigidBody2D, PhysicsSystem2D, Contact2DType, Collider2D, Vec3, input, Input, EventTouch, instantiate, Vec2, director, Camera, Canvas, UITransform, tween, sp, UIOpacity } from 'cc';
import { ItemData } from './ItemData';
const { ccclass, property } = _decorator;

@ccclass('ItemDropGame')
export class ItemDropGame extends Component {
    
    @property(Node)
    public dividerLine: Node = null!;
    
    @property([Prefab])
    public itemPrefabs: Prefab[] = [];
    
    @property([Number])
    public itemProbabilities: number[] = [];
    
    // 特效容器预制体（包含光效和物品结构）
    @property(Prefab)
    public effectContainerPrefab: Prefab = null!
    
    // 特效播放速度
    @property({ type: Number, displayName: "特效播放速度", tooltip: "控制转光特效的播放速度，数值越大播放越快" })
    public effectPlaySpeed: number = 0.2;
    
    // 收纳盒位置
    @property(Node)
    public collectionBoxPosition: Node = null!;
    
    // 游戏配置常量 - 根据游戏体验优化
    private readonly GRAVITY = -1000;
    private readonly PREVIEW_SCALE = 0.8;
    private readonly SPAWN_HEIGHT = 20;
    private readonly DROP_DELAY = 0.15;
    private readonly SYNTHESIS_DELAY = 0.1;
    
    // 最高等级合成特效相关常量
    private readonly EFFECT_DURATION = 2.0;           // 特效总时长
    private readonly SCALE_UP_DURATION = 0.8;         // 放大阶段时长
    private readonly SCALE_DOWN_DURATION = 0.8;       // 缩小阶段时长
    private readonly CENTER_HOLD_DURATION = 0.4;      // 在中心停留时长
    private readonly MAX_SCALE = 1.5;                 // 最大缩放比例
    private readonly FINAL_SCALE = 0.6;               // 最终缩放比例
    
    private normalizedProbabilities: number[] = [];
    private currentPreviewItem: Node | null = null;
    private isDropping: boolean = false;
    private isPlayingMaxLevelEffect: boolean = false;  // 是否正在播放最高等级特效
    private synthesizingItems: Set<Node> = new Set();  // 正在合成的物品集合
    private gameArea: Node = null!;
    private mainCamera: Camera | null = null;
    private isFollowing: boolean = false;              // 是否正在跟随触摸
    private followingStartPos: Vec3 = Vec3.ZERO;       // 跟随开始时的位置
    
    // 对象池相关
    private effectContainerPool: Node[] = [];          // 特效容器对象池
    private readonly MAX_POOL_SIZE = 3;                // 对象池最大容量
    private currentEffectContainer: Node | null = null; // 当前使用的特效容器
    
    protected onLoad(): void {
        this.validateInputs();
        this.initializeProbabilities();
        this.setupPhysics();
        this.setupInputHandling();
        this.gameArea = this.node;
        this.mainCamera = this.findCamera();
        this.initializeEffectPool();
    }
    
    protected start(): void {
        this.generateNextPreviewItem();
    }
    
    /**
     * 初始化特效容器对象池
     */
    private initializeEffectPool(): void {
        if (!this.effectContainerPrefab) {
            console.warn('ItemDropGame: 特效容器预制体未设置，将跳过对象池初始化');
            return;
        }
        
        // 预创建一个特效容器放入池中
        const container = instantiate(this.effectContainerPrefab);
        container.active = false; // 初始状态为隐藏
        this.gameArea.addChild(container);
        this.effectContainerPool.push(container);
        
        console.log('🏊‍♂️ 特效容器对象池初始化完成，预创建1个容器');
    }
    
    /**
     * 从对象池获取特效容器
     */
    private getEffectContainerFromPool(): Node | null {
        if (!this.effectContainerPrefab) {
            console.error('ItemDropGame: 特效容器预制体未设置！');
            return null;
        }
        
        // 从池中获取可用容器
        let container = this.effectContainerPool.pop();
        
        // 如果池中没有可用容器且还未达到最大数量，创建新的
        if (!container) {
            container = instantiate(this.effectContainerPrefab);
            this.gameArea.addChild(container);
            console.log('🆕 创建新的特效容器');
        } else {
            console.log('♻️ 复用池中的特效容器');
        }
        
        return container;
    }
    
    /**
     * 将特效容器回收到对象池
     */
    private recycleEffectContainer(container: Node): void {
        if (!container || !container.isValid) {
            return;
        }
        
        // 重置容器状态
        this.resetEffectContainer(container);
        
        // 如果池未满，回收到池中
        if (this.effectContainerPool.length < this.MAX_POOL_SIZE) {
            container.active = false;
            this.effectContainerPool.push(container);
            console.log('♻️ 特效容器已回收到对象池');
        } else {
            // 池已满，直接销毁
            container.destroy();
            console.log('🗑️ 对象池已满，销毁多余的特效容器');
        }
        
        // 清空当前使用的容器引用
        if (this.currentEffectContainer === container) {
            this.currentEffectContainer = null;
        }
    }
    
    /**
     * 重置特效容器状态
     */
    private resetEffectContainer(container: Node): void {
        // 停止所有动画
        tween(container).stop();
        
        // 重置位置、缩放、透明度等
        container.setPosition(Vec3.ZERO);
        container.setScale(Vec3.ONE);
        
        // 重置骨骼动画
        const skeleton = container.getComponentInChildren(sp.Skeleton);
        if (skeleton) {
            skeleton.setAnimation(0, 'animation', true);
            skeleton.timeScale = this.effectPlaySpeed;
        }
        
        // 重置透明度
        const opacity = container.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 255;
        }
        
        // 找到物品节点并重置其状态
        const maxLevelItem = container.children.find(child => {
            return child.name.includes('财神') || child.getComponent(ItemData);
        });
        
        if (maxLevelItem) {
            // 禁用物理组件
            this.disablePhysicsForItem(maxLevelItem);
            maxLevelItem.setScale(Vec3.ONE);
        }
    }
    
    /**
     * 验证输入参数
     */
    private validateInputs(): void {
        if (!this.dividerLine) {
            console.error('ItemDropGame: 分隔线节点未设置！');
            return;
        }
        
        if (this.itemPrefabs.length === 0) {
            console.error('ItemDropGame: 物品预制体数组为空！');
            return;
        }
        
        if (this.itemProbabilities.length !== this.itemPrefabs.length) {
            console.warn('ItemDropGame: 概率数组长度与预制体数组不匹配，将使用默认概率');
            this.itemProbabilities = new Array(this.itemPrefabs.length).fill(1.0);
        }
    }
    
    /**
     * 初始化并标准化概率
     */
    private initializeProbabilities(): void {
        const totalProbability = this.itemProbabilities.reduce((sum, prob) => sum + prob, 0);
        
        if (totalProbability <= 0) {
            // 如果总概率为0，设置为均等概率
            this.normalizedProbabilities = new Array(this.itemPrefabs.length).fill(1 / this.itemPrefabs.length);
        } else {
            // 标准化概率
            this.normalizedProbabilities = this.itemProbabilities.map(prob => prob / totalProbability);
        }
    }
    
    /**
     * 设置物理系统
     */
    private setupPhysics(): void {
        PhysicsSystem2D.instance.gravity = new Vec2(0, this.GRAVITY);
        PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT, this.onItemCollision, this);
    }
    
    /**
     * 设置输入处理
     */
    private setupInputHandling(): void {
        input.on(Input.EventType.TOUCH_START, this.onScreenTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onScreenTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onScreenTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onScreenTouchEnd, this); // 处理触摸取消
    }
    
    /**
     * 查找主相机
     */
    private findCamera(): Camera | null {
        // 从Canvas获取相机
        const canvas = this.node.getComponent(Canvas);
        if (canvas?.cameraComponent) {
            return canvas.cameraComponent;
        }
        
        // 查找相机节点
        const cameraNode = director.getScene()?.getChildByPath('Canvas/Camera') ||
                          this.node.getChildByName('Camera') ||
                          this.node.parent?.getChildByName('Camera');
        
        return cameraNode?.getComponent(Camera) || null;
    }
    
    /**
     * 屏幕触摸开始事件
     */
    private onScreenTouchStart(event: EventTouch): void {
        if (this.isDropping || this.isFollowing || !this.currentPreviewItem || !this.mainCamera || this.isPlayingMaxLevelEffect) {
            return;
        }
        
        const touchPos = event.getLocation();
        const worldPos = this.mainCamera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
        
        // 检查触摸位置是否在dividerLine正下方的有效区域内
        if (!this.isValidTouchPosition(worldPos)) {
            return;
        }
        
        // 开始跟随模式
        this.startFollowing(worldPos);
    }

    /**
     * 屏幕触摸移动事件
     */
    private onScreenTouchMove(event: EventTouch): void {
        if (!this.isFollowing || !this.currentPreviewItem || !this.mainCamera || this.isPlayingMaxLevelEffect) {
            return;
        }
        
        const touchPos = event.getLocation();
        const worldPos = this.mainCamera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
        
        // 更新预览物品位置
        this.updateFollowingPosition(worldPos);
    }

    /**
     * 屏幕触摸结束事件
     */
    private onScreenTouchEnd(event: EventTouch): void {
        if (!this.isFollowing || !this.currentPreviewItem || !this.mainCamera) {
            return;
        }
        
        const touchPos = event.getLocation();
        const worldPos = this.mainCamera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
        
        // 检查释放位置是否在有效区域内
        if (this.isValidTouchPosition(worldPos)) {
            // 在有效区域内，执行投放
            this.dropItemAtCurrentPosition();
        } else {
            // 在有效区域外，取消投放，恢复原位置
            this.cancelFollowing();
        }
    }
    
    /**
     * 检查触摸位置是否在dividerLine正下方的有效区域内
     */
    private isValidTouchPosition(worldPos: Vec3): boolean {
        if (!this.dividerLine) {
            return false;
        }
        
        // 获取dividerLine的世界坐标位置
        const dividerWorldPos = this.dividerLine.getWorldPosition();
        
        // 获取dividerLine的UITransform组件以获取宽度
        const dividerTransform = this.dividerLine.getComponent(UITransform);
        if (!dividerTransform) {
            console.warn('ItemDropGame: dividerLine缺少UITransform组件');
            return false;
        }
        
        // 计算dividerLine的左右边界
        const halfWidth = dividerTransform.width / 2;
        const leftBound = dividerWorldPos.x - halfWidth;
        const rightBound = dividerWorldPos.x + halfWidth;
        
        // 检查x坐标是否在dividerLine的宽度范围内
        const isWithinXRange = worldPos.x >= leftBound && worldPos.x <= rightBound;
        
        // 检查y坐标是否在dividerLine下方
        const isBelowDivider = worldPos.y <= dividerWorldPos.y;
        
        return isWithinXRange && isBelowDivider;
    }

    /**
     * 开始跟随模式
     */
    private startFollowing(worldPos: Vec3): void {
        if (!this.currentPreviewItem) return;
        
        // 记录开始跟随时的位置
        this.followingStartPos = this.currentPreviewItem.getPosition().clone();
        
        // 设置跟随状态
        this.isFollowing = true;
        
        // 立即更新位置到触摸点
        this.updateFollowingPosition(worldPos);
    }

    /**
     * 更新跟随位置
     */
    private updateFollowingPosition(worldPos: Vec3): void {
        if (!this.currentPreviewItem) return;
        
        // 转换worldPos到gameArea的本地坐标系
        let localX = worldPos.x;
        const gameAreaTransform = this.gameArea.getComponent(UITransform);
        if (gameAreaTransform) {
            const worldPosVec = new Vec3(worldPos.x, worldPos.y, 0);
            const localPos = gameAreaTransform.convertToNodeSpaceAR(worldPosVec);
            localX = localPos.x;
        }
        
        // 限制X坐标在dividerLine范围内
        const clampedX = this.clampXPositionToDividerLine(localX);
        
        // 更新预览物品位置（保持原有的Y坐标）
        const currentPos = this.currentPreviewItem.getPosition();
        this.currentPreviewItem.setPosition(new Vec3(clampedX, currentPos.y, currentPos.z));
    }

    /**
     * 将X坐标限制在dividerLine范围内
     */
    private clampXPositionToDividerLine(localX: number): number {
        if (!this.dividerLine) return localX;
        
        // 获取dividerLine的世界坐标位置
        const dividerWorldPos = this.dividerLine.getWorldPosition();
        
        // 获取dividerLine的UITransform组件以获取宽度
        const dividerTransform = this.dividerLine.getComponent(UITransform);
        if (!dividerTransform) return localX;
        
        // 转换dividerLine边界到gameArea本地坐标
        const gameAreaTransform = this.gameArea.getComponent(UITransform);
        if (!gameAreaTransform) return localX;
        
        const halfWidth = dividerTransform.width / 2;
        const leftWorldBound = new Vec3(dividerWorldPos.x - halfWidth, dividerWorldPos.y, 0);
        const rightWorldBound = new Vec3(dividerWorldPos.x + halfWidth, dividerWorldPos.y, 0);
        
        const leftLocalBound = gameAreaTransform.convertToNodeSpaceAR(leftWorldBound).x;
        const rightLocalBound = gameAreaTransform.convertToNodeSpaceAR(rightWorldBound).x;
        
        // 限制在边界内
        return Math.max(leftLocalBound, Math.min(rightLocalBound, localX));
    }

    /**
     * 在当前位置投放物品
     */
    private dropItemAtCurrentPosition(): void {
        if (!this.currentPreviewItem) return;
        
        // 结束跟随状态
        this.isFollowing = false;
        
        // 设置为投放状态
        this.isDropping = true;
        
        // 延迟投放，让位置有视觉效果
        this.scheduleOnce(() => {
            this.releaseCurrentItem();
        }, this.DROP_DELAY);
    }

    /**
     * 取消跟随，恢复原位置
     */
    private cancelFollowing(): void {
        if (!this.currentPreviewItem) return;
        
        // 恢复到原始位置
        this.currentPreviewItem.setPosition(this.followingStartPos);
        
        // 结束跟随状态
        this.isFollowing = false;
    }
    
    /**
     * 在指定位置投放物品
     */
    private dropItemAtPosition(targetX: number): void {
        if (!this.currentPreviewItem) return;
        
        this.isDropping = true;
        
        // 获取dividerLine的世界坐标
        const dividerWorldPos = this.dividerLine.getWorldPosition();
        
        // 转换targetX到gameArea的本地坐标系
        let localX = targetX;
        const gameAreaTransform = this.gameArea.getComponent(UITransform);
        if (gameAreaTransform) {
            const worldPos = new Vec3(targetX, dividerWorldPos.y, 0);
            const localPos = gameAreaTransform.convertToNodeSpaceAR(worldPos);
            localX = localPos.x;
        }
        
        // 移动预览物品到目标位置
        const currentPos = this.currentPreviewItem.getPosition();
        this.currentPreviewItem.setPosition(new Vec3(localX, currentPos.y, currentPos.z));
        
        // 延迟投放，让移动有视觉效果
        this.scheduleOnce(() => {
            this.releaseCurrentItem();
        }, this.DROP_DELAY);
    }
    
    /**
     * 释放当前物品
     */
    private releaseCurrentItem(): void {
        if (!this.currentPreviewItem) return;
        
        const item = this.currentPreviewItem;
        
        // 恢复正常大小
        item.setScale(Vec3.ONE);
        
        // 启用物理组件
        this.enablePhysicsForItem(item);
        
        // 添加物品数据
        this.setupItemData(item);
        
        // 清空预览物品
        this.currentPreviewItem = null;
        this.isDropping = false;
        
        // 生成下一个预览物品
        this.scheduleOnce(() => {
            this.generateNextPreviewItem();
        }, 0.3);
    }
    
    /**
     * 为物品启用物理组件
     */
    private enablePhysicsForItem(item: Node): void {
        const rigidBody = item.getComponent(RigidBody2D);
        if (rigidBody) {
            rigidBody.enabled = true;
            rigidBody.gravityScale = 1;
            rigidBody.linearVelocity = Vec2.ZERO;
            rigidBody.angularVelocity = 0;
        }
        
        const collider = item.getComponent(Collider2D);
        if (collider) {
            collider.enabled = true;
            collider.sensor = false;
        }
    }
    
    /**
     * 设置物品数据
     */
    private setupItemData(item: Node): void {
        const level = this.getItemLevelFromPrefab(item);
        item.name = `DropItem_L${level}`;
        
        let itemData = item.getComponent(ItemData);
        if (!itemData) {
            itemData = item.addComponent(ItemData);
        }
        
        itemData.setItemData(level, level * 100, 'drop_item');
    }
    
    /**
     * 从预制体确定物品等级
     */
    private getItemLevelFromPrefab(item: Node): number {
        for (let i = 0; i < this.itemPrefabs.length; i++) {
            if (item.name.includes(this.itemPrefabs[i].name)) {
                return i;
            }
        }
        return 0;
    }
    
    /**
     * 生成下一个预览物品
     */
    private generateNextPreviewItem(): void {
        const selectedLevel = this.selectRandomItemLevel();
        const prefab = this.itemPrefabs[selectedLevel];
        
        if (!prefab) return;
        
        // 创建物品实例
        const item = instantiate(prefab);
        
        // 获取dividerLine的本地坐标位置（相对于gameArea）
        const dividerWorldPos = this.dividerLine.getWorldPosition();
        const gameAreaTransform = this.gameArea.getComponent(UITransform);
        let previewPos: Vec3;
        
        if (gameAreaTransform) {
            // 将dividerLine的世界坐标转换为gameArea的本地坐标
            const localDividerPos = gameAreaTransform.convertToNodeSpaceAR(dividerWorldPos);
            previewPos = new Vec3(localDividerPos.x, localDividerPos.y + this.SPAWN_HEIGHT, 0);
        } else {
            // 如果无法获取UITransform，则使用世界坐标
            previewPos = new Vec3(dividerWorldPos.x, dividerWorldPos.y + this.SPAWN_HEIGHT, 0);
        }
        
        // 设置预览位置
        item.setPosition(previewPos);
        
        // 设置预览状态
        item.setScale(new Vec3(this.PREVIEW_SCALE, this.PREVIEW_SCALE, 1));
        
        // 禁用物理组件（预览状态）
        const rigidBody = item.getComponent(RigidBody2D);
        if (rigidBody) {
            rigidBody.enabled = false;
        }
        
        const collider = item.getComponent(Collider2D);
        if (collider) {
            collider.enabled = false;
        }
        
        // 添加到场景
        this.gameArea.addChild(item);
        this.currentPreviewItem = item;
    }
    
    /**
     * 基于概率选择物品等级
     */
    private selectRandomItemLevel(): number {
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (let i = 0; i < this.normalizedProbabilities.length; i++) {
            cumulativeProbability += this.normalizedProbabilities[i];
            if (random <= cumulativeProbability) {
                return i;
            }
        }
        
        return 0; // 默认返回第一个等级
    }
    
    /**
     * 物品碰撞事件
     */
    private onItemCollision(selfCollider: Collider2D, otherCollider: Collider2D): void {
        if (!this.isValidCollision(selfCollider, otherCollider)) {
            return;
        }
        
        const selfNode = selfCollider.node;
        const otherNode = otherCollider.node;
        
        // 检查是否已经在合成过程中
        if (this.synthesizingItems.has(selfNode) || this.synthesizingItems.has(otherNode)) {
            return;
        }
        
        const selfLevel = this.getItemLevel(selfNode);
        const otherLevel = this.getItemLevel(otherNode);
        
        // 检查是否可以合成
        if (selfLevel === otherLevel && this.canSynthesize(selfLevel)) {
            // 标记为正在合成，防止重复触发
            this.synthesizingItems.add(selfNode);
            this.synthesizingItems.add(otherNode);
            
            console.log(`🔄 开始合成: ${selfLevel} + ${otherLevel} = ${selfLevel + 1}`);
            this.synthesizeItems(selfNode, otherNode, selfLevel + 1);
        }
    }
    
    /**
     * 验证碰撞是否有效
     */
    private isValidCollision(selfCollider: Collider2D, otherCollider: Collider2D): boolean {
        if (!selfCollider?.node || !otherCollider?.node) return false;
        if (!selfCollider.node.isValid || !otherCollider.node.isValid) return false;
        if (!selfCollider.enabled || !otherCollider.enabled) return false;
        
        // 确保都是投放的物品（有ItemData组件）
        const selfItemData = selfCollider.node.getComponent(ItemData);
        const otherItemData = otherCollider.node.getComponent(ItemData);
        
        return !!(selfItemData && otherItemData);
    }
    
    /**
     * 获取物品等级
     */
    private getItemLevel(node: Node): number {
        const itemData = node.getComponent(ItemData);
        if (itemData) {
            return itemData.getLevel();
        }
        
        // 从节点名称解析等级
        const match = node.name.match(/DropItem_L(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    
    /**
     * 检查是否可以合成
     */
    private canSynthesize(currentLevel: number): boolean {
        return currentLevel < this.itemPrefabs.length - 1;
    }
    
    /**
     * 合成物品
     */
    private synthesizeItems(item1: Node, item2: Node, newLevel: number): void {
        // 检查是否为最高等级合成
        const isMaxLevel = newLevel >= this.itemPrefabs.length - 1;
        
        // 计算合成位置
        const pos1 = item1.getWorldPosition();
        const pos2 = item2.getWorldPosition();
        const synthesisPos = new Vec3((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2, pos1.z);
        
        // ⚠️ 重要：延迟物理操作，避免在碰撞回调中直接操作RigidBody
        // 这样可以避免 "Can not active RigidBody in contract listener" 警告
        this.scheduleOnce(() => {
            // 在下一帧禁用物理组件防止重复碰撞
            this.disablePhysicsForItem(item1);
            this.disablePhysicsForItem(item2);
            
            // 延迟销毁和创建
            this.scheduleOnce(() => {
                // 清理合成标记
                this.synthesizingItems.delete(item1);
                this.synthesizingItems.delete(item2);
                
                if (item1?.isValid) item1.destroy();
                if (item2?.isValid) item2.destroy();
                
                this.scheduleOnce(() => {
                    if (isMaxLevel) {
                        this.createMaxLevelSynthesisEffect(newLevel, synthesisPos);
                    } else {
                        this.createSynthesizedItem(newLevel, synthesisPos);
                    }
                }, 0.05);
            }, this.SYNTHESIS_DELAY);
        }, 0); // 延迟到下一帧执行
    }
    
    /**
     * 禁用物品的物理组件
     */
    private disablePhysicsForItem(item: Node): void {
        const rigidBody = item.getComponent(RigidBody2D);
        const collider = item.getComponent(Collider2D);
        
        if (rigidBody) rigidBody.enabled = false;
        if (collider) collider.enabled = false;
    }
    
    /**
     * 创建合成后的新物品
     */
    private createSynthesizedItem(level: number, worldPos: Vec3): void {
        const prefab = this.itemPrefabs[level];
        if (!prefab) return;
        
        const newItem = instantiate(prefab);
        this.gameArea.addChild(newItem);
        
        // 转换坐标
        const gameAreaTransform = this.gameArea.getComponent(UITransform);
        if (gameAreaTransform) {
            const localPos = gameAreaTransform.convertToNodeSpaceAR(worldPos);
            newItem.setPosition(localPos);
        } else {
            newItem.setPosition(worldPos);
        }
        
        // 设置物品数据
        this.setupItemData(newItem);
        
        // 延迟启用物理组件
        this.scheduleOnce(() => {
            this.enablePhysicsForItem(newItem);
        }, 0.1);
    }
    
    /**
     * 创建最高等级合成特效
     */
    private createMaxLevelSynthesisEffect(level: number, synthesisWorldPos: Vec3): void {
        console.log('🎬 开始最高等级手动动画');
        
        // 设置特效状态
        this.isPlayingMaxLevelEffect = true;
        
        // 禁用所有物理碰撞
        this.disableAllPhysics();
        
        // 转换到本地坐标
        const gameAreaTransform = this.gameArea.getComponent(UITransform);
        let localSynthesisPos: Vec3;
        if (gameAreaTransform) {
            localSynthesisPos = gameAreaTransform.convertToNodeSpaceAR(synthesisWorldPos);
        } else {
            localSynthesisPos = synthesisWorldPos;
        }
        
        // 从对象池获取特效容器
        const effectContainer = this.getEffectContainerFromPool();
        if (!effectContainer) {
            console.error('ItemDropGame: 无法获取特效容器！');
            this.isPlayingMaxLevelEffect = false;
            this.enableAllPhysics();
            return;
        }
        
        // 保存当前使用的容器引用
        this.currentEffectContainer = effectContainer;
        
        // 设置容器状态
        this.setupEffectContainer(effectContainer, level, localSynthesisPos);
        
        // 执行缩放和移动动画
        this.playMaxLevelAnimation(effectContainer, localSynthesisPos);
    }
    
    /**
     * 设置特效容器
     */
    private setupEffectContainer(container: Node, level: number, position: Vec3): void {
        // 激活容器
        container.active = true;
        container.setPosition(position);
        
        // 查找并设置骨骼动画播放速度
        const skeleton = container.getComponentInChildren(sp.Skeleton);
        if (skeleton) {
            skeleton.setAnimation(0, 'animation', true);
            skeleton.timeScale = this.effectPlaySpeed;
        }
        
        // 查找容器中的物品节点并设置数据
        const maxLevelItem = container.children.find(child => {
            return child.name.includes('财神') || child.getComponent(ItemData);
        });
        
        if (maxLevelItem) {
            // 设置物品数据
            this.setupItemData(maxLevelItem);
            
            // 禁用物理组件，防止下坠和碰撞
            this.disablePhysicsForItem(maxLevelItem);
        }
    }
    
    /**
     * 播放最高等级动画
     */
    private playMaxLevelAnimation(item: Node, startPos: Vec3): void {
        // 获取屏幕中心位置
        const screenCenter = this.getScreenCenterPosition();
        
        // 获取收纳盒位置
        const collectionPos = this.getCollectionBoxPosition();
        
        // 第一阶段：放大并移动到屏幕中心
        tween(item)
            .parallel(
                tween().to(this.SCALE_UP_DURATION, { 
                    scale: new Vec3(this.MAX_SCALE, this.MAX_SCALE, 1) 
                }, { easing: 'quadOut' }),
                tween().to(this.SCALE_UP_DURATION, { 
                    position: screenCenter 
                }, { easing: 'quadOut' })
            )
            .delay(this.CENTER_HOLD_DURATION)  // 在中心停留
            .parallel(
                tween().to(this.SCALE_DOWN_DURATION, { 
                    scale: new Vec3(this.FINAL_SCALE, this.FINAL_SCALE, 1) 
                }, { easing: 'quadIn' }),
                tween().to(this.SCALE_DOWN_DURATION, { 
                    position: collectionPos 
                }, { easing: 'quadIn' })
            )
            .call(() => {
                this.onMaxLevelAnimationComplete(item);
            })
            .start();
    }
    
    /**
     * 获取屏幕中心位置（相对于gameArea的本地坐标）
     */
    private getScreenCenterPosition(): Vec3 {
        if (!this.mainCamera) return Vec3.ZERO;
        
        // 获取屏幕中心的世界坐标
        const screenSize = this.mainCamera.node.getComponent(UITransform);
        if (!screenSize) return Vec3.ZERO;
        
        const worldCenter = new Vec3(0, 0, 0);
        
        // 转换到gameArea的本地坐标
        const gameAreaTransform = this.gameArea.getComponent(UITransform);
        if (gameAreaTransform) {
            return gameAreaTransform.convertToNodeSpaceAR(worldCenter);
        }
        
        return worldCenter;
    }
    
    /**
     * 获取收纳盒位置（相对于gameArea的本地坐标）
     */
    private getCollectionBoxPosition(): Vec3 {
        if (!this.collectionBoxPosition) {
            console.warn('ItemDropGame: 收纳盒位置未设置，使用默认位置');
            return new Vec3(0, -200, 0);
        }
        
        const collectionWorldPos = this.collectionBoxPosition.getWorldPosition();
        
        // 转换到gameArea的本地坐标
        const gameAreaTransform = this.gameArea.getComponent(UITransform);
        if (gameAreaTransform) {
            return gameAreaTransform.convertToNodeSpaceAR(collectionWorldPos);
        }
        
        return collectionWorldPos;
    }
    
    /**
     * 最高等级动画完成回调
     */
    private onMaxLevelAnimationComplete(container: Node): void {
        console.log('🏁 最高等级动画完成，开始回收容器');
        
        // 回收容器到对象池而不是销毁
        this.recycleEffectContainer(container);
        
        // 延迟恢复游戏状态
        this.scheduleOnce(() => {
            this.resumeGameAfterMaxLevelEffect();
        }, 0.3);
    }
    
    /**
     * 最高等级特效结束后恢复游戏状态
     */
    private resumeGameAfterMaxLevelEffect(): void {
        // 恢复特效状态
        this.isPlayingMaxLevelEffect = false;
        
        // 重新启用所有物理碰撞
        this.enableAllPhysics();
        
        // 如果没有预览物品，生成新的
        if (!this.currentPreviewItem) {
            this.generateNextPreviewItem();
        }
    }
    
    /**
     * 禁用所有物理碰撞
     */
    private disableAllPhysics(): void {
        // 禁用所有已投放物品的物理组件
        this.gameArea.children.forEach(child => {
            if (child.name.includes('DropItem_')) {
                this.disablePhysicsForItem(child);
            }
        });
    }
    
    /**
     * 启用所有物理碰撞
     */
    private enableAllPhysics(): void {
        // 重新启用所有已投放物品的物理组件
        this.gameArea.children.forEach(child => {
            if (child.name.includes('DropItem_')) {
                this.enablePhysicsForItem(child);
            }
        });
    }
    
    /**
     * 更新物品生成概率
     */
    public updateProbabilities(newProbabilities: number[]): void {
        if (newProbabilities.length === this.itemPrefabs.length) {
            this.itemProbabilities = [...newProbabilities];
            this.initializeProbabilities();
        }
    }
    
    /**
     * 获取当前概率配置
     */
    public getCurrentProbabilities(): number[] {
        return [...this.normalizedProbabilities];
    }
    
    protected onDestroy(): void {
        // 移除事件监听器
        input.off(Input.EventType.TOUCH_START, this.onScreenTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onScreenTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onScreenTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onScreenTouchEnd, this);
        PhysicsSystem2D.instance.off(Contact2DType.BEGIN_CONTACT, this.onItemCollision, this);
        
        // 清理对象池
        this.effectContainerPool.forEach(container => {
            if (container && container.isValid) {
                container.destroy();
            }
        });
        this.effectContainerPool = [];
        
        // 清理状态
        this.synthesizingItems.clear();
        this.currentPreviewItem = null;
        this.currentEffectContainer = null;
        
        console.log("🧹 ItemDropGame 已清理所有状态、监听器和对象池");
    }
} 