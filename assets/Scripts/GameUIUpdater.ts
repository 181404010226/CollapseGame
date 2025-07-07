import { _decorator, Component, log, warn, director, Node, Label } from 'cc';
import { ApiConfig } from '../API/ApiConfig';

const { ccclass, property } = _decorator;

/**
 * 游戏UI更新管理器
 * 负责在登录完成后，根据游戏进度数据更新各个场景的UI显示
 */
@ccclass('GameUIUpdater')
export class GameUIUpdater extends Component {

    /**
     * 更新当前场景的UI显示
     * 在登录完成后调用此方法来更新UI
     */
    public static updateCurrentSceneUI(): void {
        try {
            log('=== 开始更新当前场景UI ===');
            
            // 获取游戏进度数据
            const gameProgress = ApiConfig.getGameProgress();
            if (!gameProgress) {
                warn('游戏进度数据不存在，无法更新UI');
                return;
            }

            log('获取到游戏进度数据:', gameProgress);
            const redBagNum = this.parseNumberValue(gameProgress.redBagNum || 0);
            const goldNum = this.parseNumberValue(gameProgress.goldNum || 0);
            const exp = this.parseNumberValue(gameProgress.exp || 0);
            
            log(`红包数量: ${redBagNum}, 金币数量: ${goldNum}, 经验值: ${exp}`);

            // 获取当前场景
            const currentScene = director.getScene();
            if (!currentScene) {
                warn('无法获取当前场景');
                return;
            }

            const sceneName = currentScene.name;
            log(`当前场景: ${sceneName}`);

            // 根据场景名称更新对应的UI
            this.updateSceneUI(currentScene, sceneName, redBagNum, goldNum, exp);

        } catch (error) {
            warn('更新UI时发生错误:', error);
        }
    }

    /**
     * 延迟更新UI，确保在场景切换后正确更新
     * @param delay 延迟时间（毫秒）
     */
    public static updateCurrentSceneUIDelayed(delay: number = 500): void {
        setTimeout(() => {
            this.updateCurrentSceneUI();
        }, delay);
    }

    /**
     * 更新指定场景的UI
     */
    private static updateSceneUI(scene: Node, sceneName: string, redBagNum: number, goldNum: number, exp: number): void {
        switch (sceneName) {
            case '首页':
                this.updateHomeSceneUI(scene, redBagNum, goldNum);
                break;
            case 'Withdraw':
                this.updateWithdrawSceneUI(scene, goldNum);
                break;
            case 'WithDraw2':
                this.updateWithdraw2SceneUI(scene, redBagNum);
                break;
            case 'My':
                this.updateMySceneUI(scene, exp);
                break;
            default:
                log(`场景 ${sceneName} 无需更新UI`);
        }
    }

    /**
     * 更新首页场景的UI
     * 更新 BalanceLabel1（红包数量）和 BalanceLabel2（金币数量）
     */
    private static updateHomeSceneUI(scene: Node, redBagNum: number, goldNum: number): void {
        try {
            log('更新首页场景UI');

            // 查找 BalanceLabel1 节点（红包数量）
            const balanceLabel1 = this.findNodeByName(scene, 'BalanceLabel1');
            if (balanceLabel1) {
                const label1 = balanceLabel1.getComponent(Label);
                if (label1) {
                    label1.string = this.formatNumber(redBagNum);
                    log(`已更新 BalanceLabel1: ${label1.string}`);
                } else {
                    warn('BalanceLabel1 节点未找到 Label 组件');
                }
            } else {
                warn('未找到 BalanceLabel1 节点');
            }

            // 查找 BalanceLabel2 节点（金币数量）
            const balanceLabel2 = this.findNodeByName(scene, 'BalanceLabel2');
            if (balanceLabel2) {
                const label2 = balanceLabel2.getComponent(Label);
                if (label2) {
                    label2.string = this.formatNumber(goldNum);
                    log(`已更新 BalanceLabel2: ${label2.string}`);
                } else {
                    warn('BalanceLabel2 节点未找到 Label 组件');
                }
            } else {
                warn('未找到 BalanceLabel2 节点');
            }

            log('首页场景UI更新完成');
        } catch (error) {
            warn('更新首页场景UI时发生错误:', error);
        }
    }

    /**
     * 更新Withdraw场景的UI
     * 更新 CoinAmount 节点（金币数量）
     */
    private static updateWithdrawSceneUI(scene: Node, goldNum: number): void {
        try {
            log('更新Withdraw场景UI');

            // 查找 CoinAmount 节点
            const coinAmountNode = this.findNodeByName(scene, 'CoinAmount');
            if (coinAmountNode) {
                const label = coinAmountNode.getComponent(Label);
                if (label) {
                    label.string = this.formatNumber(goldNum);
                    log(`已更新 CoinAmount: ${label.string}`);
                } else {
                    warn('CoinAmount 节点未找到 Label 组件');
                }
            } else {
                warn('未找到 CoinAmount 节点');
            }

            log('Withdraw场景UI更新完成');
        } catch (error) {
            warn('更新Withdraw场景UI时发生错误:', error);
        }
    }

    /**
     * 更新Withdraw2场景的UI
     * 更新 CoinAmountLabel 节点（红包数量）
     */
    private static updateWithdraw2SceneUI(scene: Node, redBagNum: number): void {
        try {
            log('更新Withdraw2场景UI');

            // 查找 CoinAmountLabel 节点
            const coinAmountLabelNode = this.findNodeByName(scene, 'CoinAmountLabel');
            if (coinAmountLabelNode) {
                const label = coinAmountLabelNode.getComponent(Label);
                if (label) {
                    label.string = this.formatNumber(redBagNum);
                    log(`已更新 CoinAmountLabel: ${label.string}`);
                } else {
                    warn('CoinAmountLabel 节点未找到 Label 组件');
                }
            } else {
                warn('未找到 CoinAmountLabel 节点');
            }

            log('Withdraw2场景UI更新完成');
        } catch (error) {
            warn('更新Withdraw2场景UI时发生错误:', error);
        }
    }

    /**
     * 更新My场景的UI
     * 更新 CurrentProgressLabel 节点（经验值）
     */
    private static updateMySceneUI(scene: Node, exp: number): void {
        try {
            log('更新My场景UI');

            // 查找 CurrentProgressLabel 节点
            const currentProgressLabelNode = this.findNodeByName(scene, 'CurrentProgressLabel');
            if (currentProgressLabelNode) {
                const label = currentProgressLabelNode.getComponent(Label);
                if (label) {
                    label.string = this.formatNumber(exp);
                    log(`已更新 CurrentProgressLabel: ${label.string}`);
                } else {
                    warn('CurrentProgressLabel 节点未找到 Label 组件');
                }
            } else {
                warn('未找到 CurrentProgressLabel 节点');
            }

            log('My场景UI更新完成');
        } catch (error) {
            warn('更新My场景UI时发生错误:', error);
        }
    }

    /**
     * 递归查找节点
     * @param root 根节点
     * @param nodeName 要查找的节点名称
     * @returns 找到的节点或null
     */
    private static findNodeByName(root: Node, nodeName: string): Node | null {
        if (root.name === nodeName) {
            return root;
        }

        for (const child of root.children) {
            const result = this.findNodeByName(child, nodeName);
            if (result) {
                return result;
            }
        }

        return null;
    }

    /**
     * 解析数值
     * @param value 原始值（可能是字符串或数字）
     * @returns 解析后的数字
     */
    private static parseNumberValue(value: string | number): number {
        if (typeof value === 'number') {
            return value;
        }
        
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        
        return 0;
    }

    /**
     * 格式化数字显示
     * @param num 要格式化的数字
     * @returns 原始数字字符串
     */
    private static formatNumber(num: number): string {
        return num.toString();
    }

    /**
     * 手动触发UI更新（用于调试和测试）
     */
    public static manualUpdateUI(): void {
        log('手动触发UI更新');
        this.updateCurrentSceneUI();
    }

    /**
     * 设置游戏进度数据并更新UI（用于测试）
     */
    public static setTestGameProgress(redBagNum: number, goldNum: number, exp: number = 100): void {
        const testData = {
            redBagNum: redBagNum,
            goldNum: goldNum,
            exp: exp
        };
        
        ApiConfig.setGameProgress(testData);
        log('已设置测试游戏进度数据:', testData);
        
        this.updateCurrentSceneUI();
    }
} 