import { _decorator, Component, Node, Label, Sprite, SpriteFrame, resources, Prefab, instantiate, assetManager, ImageAsset, Texture2D } from 'cc';
import { ApiConfig, QueryUserAccountVo, OpTgcfIllustration } from '../API/ApiConfig';
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

    protected onLoad() {
        // this.fetchUserAccountInfo(); // Removed as per edit hint
    }

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
        // Assume treasureList is already populated
        console.log('Generating treasure list with', this.treasureList.length, 'items');
        this.treasureList.forEach(info => this.createTreasureItem(info));
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
                    console.log(`Starting to load sprite for ${treasureInfo.name} from ${treasureInfo.spritePath}`);
                    if (treasureInfo.spritePath.startsWith('http')) {
                        // Load remote image
                        assetManager.loadRemote<ImageAsset>(treasureInfo.spritePath, (err, imageAsset) => {
                            if (!err && imageAsset) {
                                const texture = new Texture2D();
                                texture.image = imageAsset;
                                const spriteFrame = new SpriteFrame();
                                spriteFrame.texture = texture;
                                sprite.spriteFrame = spriteFrame;
                                console.log(`Successfully loaded remote sprite for ${treasureInfo.name}`);
                            } else {
                                console.error(`Failed to load remote sprite for ${treasureInfo.name}:`, err);
                                // 尝试加载默认图片
                                this.loadDefaultTreasureSprite(sprite, treasureInfo.name);
                            }
                        });
                    } else {
                        // Load local resource
                        resources.load(treasureInfo.spritePath, SpriteFrame, (err, spriteFrame) => {
                            if (!err && spriteFrame) {
                                sprite.spriteFrame = spriteFrame;
                                console.log(`Successfully loaded local sprite for ${treasureInfo.name}`);
                            } else {
                                console.error(`Failed to load local sprite for ${treasureInfo.name}:`, err);
                                // 尝试加载默认图片
                                this.loadDefaultTreasureSprite(sprite, treasureInfo.name);
                            }
                        });
                    }
                }
            }
            
            if (nameNode) {
                const label = nameNode.getComponent(Label);
                if (label) label.string = treasureInfo.name;
            }
        }
        
        this.treasureContainer.addChild(treasureNode);
        console.log(`Added treasure node ${treasureNode.name} to container`);
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

    public updateTreasures(illustrationList: OpTgcfIllustration[]) {
        console.log('Updating treasures with server data:', illustrationList);
        
        // 创建服务器数据映射，使用id作为键
        const serverMap = new Map<number, OpTgcfIllustration>();
        illustrationList.forEach(item => serverMap.set(item.id, item));

        this.treasureList = [];
        
        // 首先添加服务器返回的已获得宝物
        illustrationList.forEach((serverItem, index) => {
            const info: TreasureInfo = {
                id: serverItem.id,
                name: serverItem.name,
                spritePath: serverItem.imgUrl.trim(), // 去除可能的空格
                isObtained: true
            };
            this.treasureList.push(info);
            console.log(`Added obtained treasure: ${serverItem.name} with image: ${serverItem.imgUrl}`);
        });
        
        // 然后添加未获得的宝物（使用本地预定义名称）
        const obtainedCount = illustrationList.length;
        const remainingCount = this.totalTreasureCount - obtainedCount;
        
        for (let i = 0; i < remainingCount; i++) {
            const localIndex = obtainedCount + i;
            const localName = localIndex < this.treasureNames.length ? 
                this.treasureNames[localIndex] : `未知宝物${localIndex + 1}`;
            
            const info: TreasureInfo = {
                id: obtainedCount + i + 1,
                name: localName,
                spritePath: `切图/我的/宝物图鉴/${localName}`,
                isObtained: false
            };
            this.treasureList.push(info);
        }

        console.log('Final treasure list:', this.treasureList);
        this.generateTreasureList();
    }

    /**
     * 加载默认宝物图片
     */
    private loadDefaultTreasureSprite(sprite: Sprite, treasureName: string) {
        // 尝试加载通用默认宝物图片
        resources.load('切图/我的/宝物图鉴/默认宝物', SpriteFrame, (err, spriteFrame) => {
            if (!err && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
                console.log(`Loaded default sprite for ${treasureName}`);
            } else {
                console.warn(`Failed to load default sprite for ${treasureName}, keeping current sprite`);
            }
        });
    }
}