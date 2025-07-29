import { _decorator, Component, Vec3, Prefab, Node, tween, instantiate, UITransform, log } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('RewardEffectController')
export class RewardEffectController extends Component {

    // 需要在 Inspector 中绑定的节点/预制体 ------------------
    @property(Node)
    public gameArea: Node = null;

    @property(Node)
    public redPacketNode: Node = null;

    @property(Node)
    public goldCoinNode: Node = null;

    @property(Node)
    public plusOneNode: Node = null;

    @property(Prefab)
    public redPacketPrefab: Prefab = null;

    @property(Prefab)
    public goldCoinPrefab: Prefab = null;

    // 红包和金币生成配置
    @property({ type: [Number], displayName: "每级红包数量", tooltip: "每个等级合成时生成的红包数量" })
    public redPacketCountPerLevel: number[] = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7];

    @property({ type: [Number], displayName: "每级金币数量", tooltip: "每个等级合成时生成的金币数量" })
    public goldCoinCountPerLevel: number[] = [2, 2, 4, 4, 6, 6, 8, 8, 10, 10, 12, 12, 14];


    // 动画相关常量 -----------------------------------------
    private readonly REWARD_SPAWN_RADIUS = 100;
    private readonly REWARD_MOVE_DURATION = 2.0;
    private readonly REWARD_SCALE = 0.6;
    private readonly PLUS_ONE_JUMP_HEIGHT = 50;
    private readonly PLUS_ONE_JUMP_DURATION = 0.6;

    /**
     * 在指定世界坐标生成红包/金币奖励
     * @param level 合成后的等级，用于查表确定数量
     * @param synthesisWorldPos 合成所在的世界坐标
     * @param onComplete 所有奖励动画完成后的回调
     */
    public generateRewards(level: number, synthesisWorldPos: Vec3, onComplete?: () => void): void {
        if (!this.gameArea) {
            console.warn('RewardEffectController: gameArea 未绑定');
            return;
        }

        const redCount = this.getRedPacketCount(level);
        const goldCount = this.getGoldCoinCount(level);
        const totalCount = redCount + goldCount;
        let completedCount = 0;

        const onItemComplete = () => {
            completedCount++;
            if (completedCount >= totalCount && onComplete) {
                onComplete();
            }
        };

        this.generateRedPackets(redCount, synthesisWorldPos, onItemComplete);
        this.generateGoldCoins(goldCount, synthesisWorldPos, onItemComplete);
    }

    /**
     * 显示 "+1" 动画效果
     */
    public showPlusOneEffect(): void {
        if (!this.plusOneNode) return;

        const originalPos = this.plusOneNode.getPosition().clone();
        this.plusOneNode.active = true;

        tween(this.plusOneNode)
            .to(this.PLUS_ONE_JUMP_DURATION * 0.5, { position: new Vec3(originalPos.x, originalPos.y + this.PLUS_ONE_JUMP_HEIGHT, originalPos.z) })
            .to(this.PLUS_ONE_JUMP_DURATION * 0.5, { position: originalPos })
            .call(() => {
                this.plusOneNode.active = false;
            })
            .start();
    }

    // ------------------ 内部实现 ---------------------------

    private getRedPacketCount(level: number): number {
        if (level < 0 || level >= this.redPacketCountPerLevel.length) return 1;
        return this.redPacketCountPerLevel[level];
    }

    private getGoldCoinCount(level: number): number {
        if (level < 0 || level >= this.goldCoinCountPerLevel.length) return 2;
        return this.goldCoinCountPerLevel[level];
    }
    private generateRedPackets(count: number, centerWorldPos: Vec3, onItemComplete?: () => void): void {
        if (!this.redPacketPrefab || !this.redPacketNode) return;
        for (let i = 0; i < count; i++) {
            this.createRewardItem(this.redPacketPrefab, centerWorldPos, this.redPacketNode, onItemComplete);
        }
    }
    private generateGoldCoins(count: number, centerWorldPos: Vec3, onItemComplete?: () => void): void {
        if (!this.goldCoinPrefab || !this.goldCoinNode) return;
        for (let i = 0; i < count; i++) {
            this.createRewardItem(this.goldCoinPrefab, centerWorldPos, this.goldCoinNode, onItemComplete);
        }
    }

    private createRewardItem(prefab: Prefab, centerWorldPos: Vec3, targetNode: Node, onComplete?: () => void): void {
        const reward = instantiate(prefab);
        this.gameArea.addChild(reward);

        const areaTransform = this.gameArea.getComponent(UITransform);
        const localCenter = areaTransform ? areaTransform.convertToNodeSpaceAR(centerWorldPos) : centerWorldPos.clone();

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.REWARD_SPAWN_RADIUS;
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        const startPos = new Vec3(localCenter.x + offsetX, localCenter.y + offsetY, localCenter.z);
        reward.setPosition(startPos);
        reward.setScale(new Vec3(this.REWARD_SCALE, this.REWARD_SCALE, 1));

        const targetWorld = targetNode.getWorldPosition();
        const targetLocal = areaTransform ? areaTransform.convertToNodeSpaceAR(targetWorld) : targetWorld;

        tween(reward)
            .to(this.REWARD_MOVE_DURATION, { position: targetLocal })
            .call(() => {
                reward.destroy();
                log(`Reward collected -> ${prefab.name}`);
                if (onComplete) {
                    onComplete();
                }
            })
            .start();
    }
} 