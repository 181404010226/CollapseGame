import { _decorator, Component, Node, Sprite, Color, Input } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ClinkEvent')
export class ClinkEvent extends Component {

    /** 默认颜色（白色） */
    @property({ tooltip: '按钮默认颜色' })
    normalColor: Color = new Color(255, 255, 255, 255);

    /** 选中 / 按下后显示的黄色 */
    @property({ tooltip: '按钮选中时颜色' })
    pressedColor: Color = new Color(255, 231, 160, 255); // 近似黄褐色

    /** 是否默认选中（在场景加载时即高亮） */
    @property({ tooltip: '是否默认选中' })
    defaultSelected: boolean = false;

    /** 当前被选中的按钮（同一场景只保留一个高亮） */
    private static currentSelected: ClinkEvent | null = null;

    start () {
        // 监听触摸结束事件（点击）
        this.node.on(Input.EventType.TOUCH_END, this.onClick, this);

        // 初始化高亮状态
        if (this.defaultSelected && !ClinkEvent.currentSelected) {
            // 设为默认高亮
            this.applyColor(this.pressedColor);
            ClinkEvent.currentSelected = this;
        } else {
            this.applyColor(this.normalColor);
        }
    }

    /** 点击回调 */
    private onClick () {
        // 若点的是同一个，直接返回
        if (ClinkEvent.currentSelected === this) {
            return;
        }

        // 取消上一个按钮的高亮
        if (ClinkEvent.currentSelected) {
            ClinkEvent.currentSelected.applyColor(ClinkEvent.currentSelected.normalColor);
        }

        // 高亮当前按钮
        this.applyColor(this.pressedColor);
        ClinkEvent.currentSelected = this;
    }

    /** 根据颜色修改 Sprite */
    private applyColor (color: Color) {
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = color;
        }
    }

    onDestroy () {
        // 节点销毁时若正好是当前高亮，需要清理静态引用
        if (ClinkEvent.currentSelected === this) {
            ClinkEvent.currentSelected = null;
        }
    }
}


