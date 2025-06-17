import { _decorator, Component, Node, Label, Sprite, SpriteFrame, resources, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 宝物信息接口
 */
interface TreasureInfo {
    id: number;
    name: string;
    spritePath: string;
    isObtained: boolean;
}

@ccclass('TreasureGuideUI')
export class TreasureGuideUI extends Component {
    
    @property(Node)
    public treasureContainer: Node = null!; // 宝物容器

    @property(Prefab)
    public obtainedTreasurePrefab: Prefab = null!; // 已获得宝物预制体
    
    @property(Prefab)
    public unobtainedTreasurePrefab: Prefab = null!; // 未获得宝物预制体

    @property({
        displayName: "宝物总数量",
        tooltip: "设置游戏中总共有多少种宝物"
    })
    public totalTreasureCount: number = 12; // 默认12种宝物
    
    @property({
        displayName: "已获得宝物数量", 
        tooltip: "设置玩家当前已获得多少种宝物"
    })
    public obtainedTreasureCount: number = 2; // 默认已获得2种

    // 宝物数据
    private treasureList: TreasureInfo[] = [];
    
    // 宝物名称列表
    private readonly treasureNames: string[] = [
        '铜钱', '元宝', '宫灯', '摇钱树', '聚宝盘', '财神', 
        '财神印', '金叶子', '金如意', '金算盘', '金葫芦', '金蟾'
    ];

   /**  // 初始时隐藏UI
    * onLoad() {
        this.initializeTreasures();
        this.hide();
    }
    */
    start() {
        this.generateTreasureList();
    }

    /**
     * 显示宝物图鉴UI
     */
    public show() {
        this.node.active = true;
        console.log('宝物图鉴UI已显示');
    }

    //隐藏宝物图鉴UI
    public hide() {
        this.node.active = false;
        console.log('宝物图鉴UI已隐藏');
    }

    //生成宝物列表
    private generateTreasureList() {
        if (this.treasureContainer) {
            this.treasureContainer.removeAllChildren();
        }
        this.treasureList = [];

        // 生成宝物数据
        for (let i = 0; i < this.totalTreasureCount; i++) {
            const treasureInfo: TreasureInfo = {
                id: i + 1,
                name: i < this.treasureNames.length ? this.treasureNames[i] : `宝物${i + 1}`,
                spritePath: i < this.treasureNames.length ? 
                    `切图/我的/宝物图鉴/${this.treasureNames[i]}` : 
                    '切图/我的/宝物图鉴/元宝',
                isObtained: i < this.obtainedTreasureCount
            };
            this.treasureList.push(treasureInfo);
            this.createTreasureItem(treasureInfo);
        }
    }

     //创建宝物UI项
    private createTreasureItem(treasureInfo: TreasureInfo) {
        const prefab = treasureInfo.isObtained ? this.obtainedTreasurePrefab : this.unobtainedTreasurePrefab;
        if (!prefab || !this.treasureContainer) return;

        const treasureNode = instantiate(prefab);
        treasureNode.name = treasureInfo.isObtained ? `已获得_${treasureInfo.name}` : `未获得_${treasureInfo.id}`;
        
        if (treasureInfo.isObtained) {
            // 设置图片和名称
            const imageNode = treasureNode.getChildByName('宝物');
            const nameNode = treasureNode.getChildByName('Name');
            
            if (imageNode) {
                const sprite = imageNode.getComponent(Sprite);
                if (sprite) {
                    resources.load(`${treasureInfo.spritePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                        if (!err && sprite.isValid) sprite.spriteFrame = spriteFrame;
                    });
                }
            }
            
            if (nameNode) {
                const label = nameNode.getComponent(Label);
                if (label) label.string = treasureInfo.name;
            }
        }
        
        this.treasureContainer.addChild(treasureNode);
    }

     //设置已获得宝物数量
    public setObtainedCount(count: number) {
        this.obtainedTreasureCount = Math.max(0, Math.min(count, this.totalTreasureCount));
        this.generateTreasureList();
        console.log(`设置已获得宝物数量: ${this.obtainedTreasureCount}`);
    }

     //标记宝物为已获得
    public markTreasureAsObtained(treasureId: number) {
        const treasure = this.treasureList.find(t => t.id === treasureId);
        if (treasure && !treasure.isObtained) {
            treasure.isObtained = true;
            this.obtainedTreasureCount++;
            this.generateTreasureList();
            console.log(`宝物 ${treasure.name} 已获得！当前已获得数量: ${this.obtainedTreasureCount}`);
        }
    }
} 