import { _decorator, Component, Node, Prefab, RigidBody2D, PhysicsSystem2D, Contact2DType, Collider2D, Vec3, input, Input, EventTouch, instantiate, Vec2, director, Camera, Canvas, UITransform, tween, sp, UIOpacity } from 'cc';
import { ItemData } from './ItemData';
import { EffectContainerPool } from './EffectContainerPool';
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
    
    // 红包收纳节点
    @property(Node)
    public redPacketNode: Node = null!;
    
    // 金币收纳节点
    @property(Node)
    public goldCoinNode: Node = null!;
    
    // "+1"节点（合成财神时显示）
    @property(Node)
    public plusOneNode: Node = null!;
    
    // 红包预制体
    @property(Prefab)
    public redPacketPrefab: Prefab = null!;
    
    // 金币预制体
    @property(Prefab)
    public goldCoinPrefab: Prefab = null!;
    
    // 红包和金币生成配置
    @property({ type: [Number], displayName: "每级红包数量", tooltip: "每个等级合成时生成的红包数量" })
    public redPacketCountPerLevel: number[] = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7];
    
    @property({ type: [Number], displayName: "每级金币数量", tooltip: "每个等级合成时生成的金币数量" })
    public goldCoinCountPerLevel: number[] = [2, 2, 4, 4, 6, 6, 8, 8, 10, 10, 12, 12, 14];
    
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
    
    // 红包和金币相关常量
    private readonly REWARD_SPAWN_RADIUS = 100;        // 奖励生成半径
    private readonly REWARD_MOVE_DURATION = 2.0;      // 奖励移动时长
    private readonly REWARD_SCALE = 0.6;              // 奖励缩放比例
    private readonly REWARD_SPAWN_DELAY = 0.1;        // 奖励生成间隔
    
    // "+1"节点动画相关常量
    private readonly PLUS_ONE_JUMP_HEIGHT = 50;       // "+1"跳跃高度
    private readonly PLUS_ONE_JUMP_DURATION = 0.6;    // "+1"跳跃总时长
    
    private normalizedProbabilities: number[] = [];
    private currentPreviewItem: Node | null = null;
    private isDropping: boolean = false;
    private isPlayingMaxLevelEffect: boolean = false;  // 是否正在播放最高等级特效
    private synthesizingItems: Set<Node> = new Set();  // 正在合成的物品集合
    private gameArea: Node = null!;
    private mainCamera: Camera | null = null;
    private isFollowing: boolean = false;              // 是否正在跟随触摸
    private followingStartPos: Vec3 = Vec3.ZERO;       // 跟随开始时的位置
    
    protected onLoad(): void {
        this.validateInputs();
        this.initializeProbabilities();
        this.setupPhysics();
        this.setupInputHandling();
        this.gameArea = this.node;
        this.mainCamera = this.findCamera();
    }
    
    protected start(): void {
        this.generateNextPreviewItem();
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
                        // 显示"+1"效果（只在合成财神时显示）
                        this.showPlusOneEffect();
                        this.createMaxLevelSynthesisEffect(newLevel, synthesisPos);
                    } else {
                        // 生成红包和金币奖励
                        this.generateRewards(newLevel, synthesisPos);
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
        // 设置特效状态
        this.isPlayingMaxLevelEffect = true;
        
        // 禁用所有物理碰撞
        this.disableAllPhysics();
        
        // 创建最高等级物品
        const prefab = this.itemPrefabs[level];
        if (!prefab) {
            this.isPlayingMaxLevelEffect = false;
            return;
        }
        
        // 转换到本地坐标
        const gameAreaTransform = this.gameArea.getComponent(UITransform);
        let localSynthesisPos: Vec3;
        if (gameAreaTransform) {
            localSynthesisPos = gameAreaTransform.convertToNodeSpaceAR(synthesisWorldPos);
        } else {
            localSynthesisPos = synthesisWorldPos;
        }
        
        // 创建容器节点来包含光效和物品
        const effectContainer = this.createEffectContainer(level, localSynthesisPos);
        
        // 执行缩放和移动动画（对容器进行动画）
        this.playMaxLevelAnimation(effectContainer, localSynthesisPos);
    }
    
    /**
     * 创建特效容器节点
     */
    private createEffectContainer(level: number, position: Vec3): Node {
        // 使用对象池获取特效容器
        const effectPool = EffectContainerPool.getInstance();
        if (!effectPool) {
            console.error('ItemDropGame: 特效容器对象池未初始化！');
            return null!;
        }
        
        const container = effectPool.getItem();
        if (!container) {
            console.error('ItemDropGame: 无法从对象池获取特效容器！');
            return null!;
        }
        
        // 设置位置并添加到游戏区域
        container.setPosition(position);
        this.gameArea.addChild(container);
        
        // 查找并设置骨骼动画播放速度（如果存在）
        const skeleton = container.getComponentInChildren(sp.Skeleton);
        if (skeleton) {
            skeleton.setAnimation(0, 'animation', true);
            skeleton.timeScale = this.effectPlaySpeed;
        }
        
        // 查找容器中的物品节点并设置数据（如果存在）
        const maxLevelItem = container.children.find(child => {
            // 根据节点名称或组件来识别物品节点
            return child.name.includes('财神') || child.getComponent(ItemData);
        });
        
        if (maxLevelItem) {
            // 设置物品数据
            this.setupItemData(maxLevelItem);
            
            // 禁用物理组件，防止下坠和碰撞
            this.disablePhysicsForItem(maxLevelItem);
        }
        
        return container;
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
        // 从游戏区域移除容器
        if (container?.isValid) {
            container.removeFromParent();
            
            // 将容器回收到对象池
            const effectPool = EffectContainerPool.getInstance();
            if (effectPool) {
                effectPool.returnItem(container);
            } else {
                // 如果对象池不存在，直接销毁
                container.destroy();
            }
        }
        
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
    
    /**
     * 生成红包和金币奖励
     */
    private generateRewards(synthesisLevel: number, synthesisWorldPos: Vec3): void {
        // 获取奖励数量
        const redPacketCount = this.getRedPacketCount(synthesisLevel);
        const goldCoinCount = this.getGoldCoinCount(synthesisLevel);
        
        // 生成红包
        this.generateRedPackets(redPacketCount, synthesisWorldPos);
        
        // 生成金币
        this.generateGoldCoins(goldCoinCount, synthesisWorldPos);
    }
    
    /**
     * 获取红包数量
     */
    private getRedPacketCount(level: number): number {
        if (level < 0 || level >= this.redPacketCountPerLevel.length) {
            return 1; // 默认值
        }
        return this.redPacketCountPerLevel[level];
    }
    
    /**
     * 获取金币数量
     */
    private getGoldCoinCount(level: number): number {
        if (level < 0 || level >= this.goldCoinCountPerLevel.length) {
            return 2; // 默认值
        }
        return this.goldCoinCountPerLevel[level];
    }
    
    /**
     * 生成红包
     */
    private generateRedPackets(count: number, centerWorldPos: Vec3): void {
        if (!this.redPacketPrefab || !this.redPacketNode) {
            console.warn('ItemDropGame: 红包预制体或红包节点未设置');
            return;
        }
        
        for (let i = 0; i < count; i++) {
            this.createRewardItem(this.redPacketPrefab, centerWorldPos, this.redPacketNode);
        }
    }
    
    /**
     * 生成金币
     */
    private generateGoldCoins(count: number, centerWorldPos: Vec3): void {
        if (!this.goldCoinPrefab || !this.goldCoinNode) {
            console.warn('ItemDropGame: 金币预制体或金币节点未设置');
            return;
        }
        
        for (let i = 0; i < count; i++) {
            this.createRewardItem(this.goldCoinPrefab, centerWorldPos, this.goldCoinNode);
        }
    }
    
    /**
     * 创建奖励物品
     */
    private createRewardItem(prefab: Prefab, centerWorldPos: Vec3, targetNode: Node): void {
        const reward = instantiate(prefab);
        this.gameArea.addChild(reward);
        
        const gameAreaTransform = this.gameArea.getComponent(UITransform);
        // 先将中心点转换到 gameArea 的本地坐标
        let localCenter: Vec3;
        if (gameAreaTransform) {
            localCenter = gameAreaTransform.convertToNodeSpaceAR(centerWorldPos);
        } else {
            localCenter = centerWorldPos.clone();
        }

        // 随机生成起始位置（在中心周围 REWARD_SPAWN_RADIUS 内一次性炸开）
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.REWARD_SPAWN_RADIUS;
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;

        const startPos = new Vec3(localCenter.x + offsetX, localCenter.y + offsetY, localCenter.z);
        // 打印日志以验证生成坐标
        console.log(`🎆 Reward spawn pos: ${startPos.x.toFixed(2)}, ${startPos.y.toFixed(2)}`);
        
        reward.setPosition(startPos);
        reward.setScale(new Vec3(this.REWARD_SCALE, this.REWARD_SCALE, 1));
        
        // 获取目标位置（转换到本地坐标）
        const targetWorldPos = targetNode.getWorldPosition();
        let targetPos: Vec3;
        if (gameAreaTransform) {
            targetPos = gameAreaTransform.convertToNodeSpaceAR(targetWorldPos);
        } else {
            targetPos = targetWorldPos;
        }
        
        // 移动到目标位置
        tween(reward)
            .to(this.REWARD_MOVE_DURATION, { position: targetPos }, { easing: 'quadInOut' })
            .call(() => {
                // 到达目标位置后销毁
                if (reward?.isValid) {
                    reward.destroy();
                }
                
                // 这里可以添加收集奖励的逻辑，比如更新分数等
                console.log(`💰 收集奖励: ${reward.name}`);
            })
            .start();
    }
    
    /**
     * 显示"+1"效果
     */
    private showPlusOneEffect(): void {
        if (!this.plusOneNode) {
            console.warn('ItemDropGame: "+1"节点未设置');
            return;
        }
        
        // 记录原始位置
        const originalPos = this.plusOneNode.getPosition().clone();
        
        // 显示节点
        this.plusOneNode.active = true;
        
        // 向上跳跃然后返回的动画
        tween(this.plusOneNode)
            .to(this.PLUS_ONE_JUMP_DURATION * 0.5, { 
                position: new Vec3(originalPos.x, originalPos.y + this.PLUS_ONE_JUMP_HEIGHT, originalPos.z) 
            }, { easing: 'quadOut' })
            .to(this.PLUS_ONE_JUMP_DURATION * 0.5, { 
                position: originalPos 
            }, { easing: 'quadIn' })
            .call(() => {
                // 动画完成后隐藏节点
                this.plusOneNode.active = false;
            })
            .start();
    }
    
    protected onDestroy(): void {
        // 移除事件监听器
        input.off(Input.EventType.TOUCH_START, this.onScreenTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onScreenTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onScreenTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onScreenTouchEnd, this);
        PhysicsSystem2D.instance.off(Contact2DType.BEGIN_CONTACT, this.onItemCollision, this);
        
        // 清理状态
        this.synthesizingItems.clear();
        this.currentPreviewItem = null;
        
        console.log("🧹 ItemDropGame 已清理所有状态和监听器");
    }
} 