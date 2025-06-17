import { _decorator, Component, Node, Sprite, SpriteFrame, resources, Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MultiplierSelector')
export class MultiplierSelector extends Component {
    
    @property([Node])
    public multiplierOptions: Node[] = [];
    
    private selectedSprite: SpriteFrame = null!;
    private defaultSprite: SpriteFrame = null!;
    private currentSelected: Node = null!;
    
    onLoad() {
        this.loadSprites();
        this.setupClickEvents();
    }
    
    start() {
        // 默认选中第一个倍数（1倍）
        if (this.multiplierOptions.length > 0) {
            this.selectMultiplier(this.multiplierOptions[0]);
        }
    }
    
    private loadSprites() {
        // 加载选中状态图片
        resources.load('切图/提现切图/选中/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (!err) {
                this.selectedSprite = spriteFrame;
            }
        });
        
        // 加载默认状态图片
        resources.load('切图/提现切图/默认/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (!err) {
                this.defaultSprite = spriteFrame;
            }
        });
    }
    
    private setupClickEvents() {
        this.multiplierOptions.forEach(option => {
            const button = option.getComponent(Button) || option.addComponent(Button);
            button.node.on(Button.EventType.CLICK, () => {
                this.selectMultiplier(option);
            });
        });
    }
    
    private selectMultiplier(selectedOption: Node) {
        // 如果已经是当前选中的，则不处理
        if (this.currentSelected === selectedOption) {
            return;
        }
        
        // 将所有选项设置为默认状态
        this.multiplierOptions.forEach(option => {
            const sprite = option.getComponent(Sprite);
            if (sprite && this.defaultSprite) {
                sprite.spriteFrame = this.defaultSprite;
            }
        });
        
        // 将选中的选项设置为选中状态
        const selectedSprite = selectedOption.getComponent(Sprite);
        if (selectedSprite && this.selectedSprite) {
            selectedSprite.spriteFrame = this.selectedSprite;
        }
        
        this.currentSelected = selectedOption;
        
        // 可以在这里添加其他选中逻辑，比如更新金额显示等
    }
    
    // 获取当前选中的倍数选项
    public getCurrentSelected(): Node {
        return this.currentSelected;
    }
    
    // 通过索引选择倍数
    public selectByIndex(index: number) {
        if (index >= 0 && index < this.multiplierOptions.length) {
            this.selectMultiplier(this.multiplierOptions[index]);
        }
    }
    
    // 通过节点名称选择倍数
    public selectByName(optionName: string) {
        const option = this.multiplierOptions.find(opt => opt.name === optionName);
        if (option) {
            this.selectMultiplier(option);
        }
    }
} 