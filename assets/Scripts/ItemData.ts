import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ItemData')
export class ItemData extends Component {
    
    private level: number = 0;
    private score: number = 0;
    private itemType: string = '';
    
    /**
     * 设置物品数据
     * @param level 物品等级
     * @param score 物品分数
     * @param itemType 物品类型
     */
    public setItemData(level: number, score: number, itemType: string): void {
        this.level = level;
        this.score = score;
        this.itemType = itemType;
    }
    
    /**
     * 获取物品等级
     */
    public getLevel(): number {
        return this.level;
    }
    
    /**
     * 获取物品分数
     */
    public getScore(): number {
        return this.score;
    }
    
    /**
     * 获取物品类型
     */
    public getItemType(): string {
        return this.itemType;
    }
    
    /**
     * 更新物品等级
     */
    public setLevel(level: number): void {
        this.level = level;
    }
    
    /**
     * 更新物品分数
     */
    public setScore(score: number): void {
        this.score = score;
    }
    
    /**
     * 更新物品类型
     */
    public setItemType(itemType: string): void {
        this.itemType = itemType;
    }
    
    /**
     * 每帧更新，检查物品位置
     */
    update(): void {
        this.checkPosition();
    }
    
    /**
     * 检查物品位置，如果y轴位置低于-10000则销毁物品
     */
    private checkPosition(): void {
        if (this.node.position.y < -10000) {
            this.node.destroy();
        }
    }
}