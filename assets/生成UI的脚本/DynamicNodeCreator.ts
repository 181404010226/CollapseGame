import { _decorator, Component, Node, SpriteFrame, Sprite, RigidBody2D, PolygonCollider2D, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DynamicNodeCreator')
export class DynamicNodeCreator extends Component {
    
    @property({
        type: [SpriteFrame],
        displayName: "图片数组"
    })
    public imageArray: SpriteFrame[] = [];

    @property({
        displayName: "节点间距"
    })
    public nodeSpacing: number = 100;

    @property({
        displayName: "自动创建节点"
    })
    public autoCreate: boolean = true;

    @property({
        displayName: "刚体类型",
        tooltip: "0: Static, 1: Kinematic, 2: Dynamic"
    })
    public rigidBodyType: number = 2;

    @property({
        displayName: "自动适配图片形状",
        tooltip: "是否根据图片形状自动生成碰撞体轮廓"
    })
    public autoFitShape: boolean = false;

    @property({
        displayName: "碰撞体缩放",
        tooltip: "碰撞体相对于图片的缩放比例"
    })
    public colliderScale: number = 1.0;

    private createdNodes: Node[] = [];

    start() {
        if (this.autoCreate && this.imageArray.length > 0) {
            this.createNodesFromArray();
        }
    }

    /**
     * 根据图片数组创建节点
     */
    public createNodesFromArray() {
        // 清理之前创建的节点
        this.clearCreatedNodes();

        if (!this.imageArray || this.imageArray.length === 0) {
            console.warn("图片数组为空，无法创建节点");
            return;
        }

        console.log(`开始创建 ${this.imageArray.length} 个节点`);

        for (let i = 0; i < this.imageArray.length; i++) {
            const spriteFrame = this.imageArray[i];
            if (spriteFrame) {
                const node = this.createNodeWithComponents(spriteFrame, i);
                this.createdNodes.push(node);
            }
        }

        console.log(`成功创建了 ${this.createdNodes.length} 个节点`);
    }

    /**
     * 创建单个节点并添加所需组件
     */
    private createNodeWithComponents(spriteFrame: SpriteFrame, index: number): Node {
        // 创建新节点
        const node = new Node(`DynamicNode_${index}`);
        
        // 设置节点位置（横向排列）
        const posX = index * this.nodeSpacing - (this.imageArray.length - 1) * this.nodeSpacing * 0.5;
        node.setPosition(new Vec3(posX, 0, 0));

        // 添加Sprite组件并设置图片
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = spriteFrame;

        // 添加刚体组件
        const rigidBody = node.addComponent(RigidBody2D);
        rigidBody.type = this.rigidBodyType; // 0: Static, 1: Kinematic, 2: Dynamic

        // 添加多边形碰撞体组件
        const collider = node.addComponent(PolygonCollider2D);
        
        // 根据图片自动生成多边形碰撞体顶点
        this.generatePolygonPoints(collider, spriteFrame);

        // 将节点添加到当前节点作为子节点
        node.setParent(this.node);

        console.log(`创建节点: ${node.name}, 位置: (${posX}, 0)`);

        return node;
    }

    /**
     * 根据图片自动生成多边形碰撞体顶点
     */
    private generatePolygonPoints(collider: PolygonCollider2D, spriteFrame: SpriteFrame) {
        if (!spriteFrame) return;

        if (this.autoFitShape) {
            // 尝试使用自动生成功能（主要在编辑器中有效）
            try {
                collider.resetInEditor();
                console.log(`尝试自动生成碰撞体轮廓，图片: ${spriteFrame.name}`);
            } catch (error) {
                console.warn("自动生成碰撞体失败，使用默认矩形:", error);
                this.generateRectangleCollider(collider, spriteFrame);
            }
        } else {
            // 使用基于图片尺寸的矩形碰撞体
            this.generateRectangleCollider(collider, spriteFrame);
        }
    }

    /**
     * 生成矩形碰撞体
     */
    private generateRectangleCollider(collider: PolygonCollider2D, spriteFrame: SpriteFrame) {
        const rect = spriteFrame.rect;
        const width = (rect.width * this.colliderScale) * 0.5;
        const height = (rect.height * this.colliderScale) * 0.5;

        // 创建矩形顶点
        const points: Vec2[] = [
            new Vec2(-width, -height), // 左下
            new Vec2(width, -height),  // 右下
            new Vec2(width, height),   // 右上
            new Vec2(-width, height)   // 左上
        ];

        collider.points = points;
        console.log(`生成矩形碰撞体，图片: ${spriteFrame.name}, 尺寸: ${rect.width}x${rect.height}, 缩放: ${this.colliderScale}`);
    }

    /**
     * 清理已创建的节点
     */
    public clearCreatedNodes() {
        for (const node of this.createdNodes) {
            if (node && node.isValid) {
                node.destroy();
            }
        }
        this.createdNodes = [];
        console.log("清理了所有创建的节点");
    }

    /**
     * 重新创建节点（可以在运行时调用）
     */
    public recreateNodes() {
        this.createNodesFromArray();
    }

    /**
     * 添加新图片并创建对应节点
     */
    public addImage(spriteFrame: SpriteFrame) {
        if (!spriteFrame) return;
        
        this.imageArray.push(spriteFrame);
        const index = this.imageArray.length - 1;
        const node = this.createNodeWithComponents(spriteFrame, index);
        this.createdNodes.push(node);
    }

    /**
     * 移除指定索引的图片和对应节点
     */
    public removeImageAtIndex(index: number) {
        if (index < 0 || index >= this.imageArray.length) return;
        
        // 移除图片
        this.imageArray.splice(index, 1);
        
        // 移除对应节点
        if (index < this.createdNodes.length) {
            const node = this.createdNodes[index];
            if (node && node.isValid) {
                node.destroy();
            }
            this.createdNodes.splice(index, 1);
        }
        
        // 重新排列剩余节点位置
        this.repositionNodes();
    }

    /**
     * 重新排列节点位置
     */
    private repositionNodes() {
        for (let i = 0; i < this.createdNodes.length; i++) {
            const node = this.createdNodes[i];
            if (node && node.isValid) {
                const posX = i * this.nodeSpacing - (this.createdNodes.length - 1) * this.nodeSpacing * 0.5;
                node.setPosition(new Vec3(posX, 0, 0));
                node.name = `DynamicNode_${i}`;
            }
        }
    }

    /**
     * 获取创建的节点数量
     */
    public getCreatedNodeCount(): number {
        return this.createdNodes.length;
    }

    /**
     * 获取指定索引的创建节点
     */
    public getCreatedNode(index: number): Node | null {
        if (index >= 0 && index < this.createdNodes.length) {
            return this.createdNodes[index];
        }
        return null;
    }
} 