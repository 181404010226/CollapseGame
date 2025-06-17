import { _decorator, Component, Node, Prefab, RigidBody2D, PhysicsSystem2D, Contact2DType, Collider2D, Vec3, input, Input, EventTouch, instantiate, Vec2, director, Camera, Canvas, UITransform } from 'cc';
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
    
    // 游戏配置常量 - 根据游戏体验优化
    private readonly GRAVITY = -300;
    private readonly PREVIEW_SCALE = 0.8;
    private readonly SPAWN_HEIGHT = 20;
    private readonly DROP_DELAY = 0.15;
    private readonly SYNTHESIS_DELAY = 0.1;
    
    private normalizedProbabilities: number[] = [];
    private currentPreviewItem: Node | null = null;
    private isDropping: boolean = false;
    private gameArea: Node = null!;
    private mainCamera: Camera | null = null;
    
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
        input.on(Input.EventType.TOUCH_START, this.onScreenTouch, this);
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
     * 屏幕触摸事件
     */
    private onScreenTouch(event: EventTouch): void {
        if (this.isDropping || !this.currentPreviewItem || !this.mainCamera) {
            return;
        }
        
        const touchPos = event.getLocation();
        const worldPos = this.mainCamera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
        
        // 检查触摸位置是否在dividerLine正下方的有效区域内
        if (!this.isValidTouchPosition(worldPos)) {
            return;
        }
        
        this.dropItemAtPosition(worldPos.x);
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
        
        const selfLevel = this.getItemLevel(selfNode);
        const otherLevel = this.getItemLevel(otherNode);
        
        // 检查是否可以合成
        if (selfLevel === otherLevel && this.canSynthesize(selfLevel)) {
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
        // 计算合成位置
        const pos1 = item1.getWorldPosition();
        const pos2 = item2.getWorldPosition();
        const synthesisPos = new Vec3((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2, pos1.z);
        
        // 禁用物理组件防止重复碰撞
        this.disablePhysicsForItem(item1);
        this.disablePhysicsForItem(item2);
        
        // 延迟销毁和创建
        this.scheduleOnce(() => {
            if (item1?.isValid) item1.destroy();
            if (item2?.isValid) item2.destroy();
            
            this.scheduleOnce(() => {
                this.createSynthesizedItem(newLevel, synthesisPos);
            }, 0.05);
        }, this.SYNTHESIS_DELAY);
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
        input.off(Input.EventType.TOUCH_START, this.onScreenTouch, this);
        PhysicsSystem2D.instance.off(Contact2DType.BEGIN_CONTACT, this.onItemCollision, this);
    }
} 