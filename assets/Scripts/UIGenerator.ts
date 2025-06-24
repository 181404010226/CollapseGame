import { _decorator, Component, Node, UITransform, Label, Sprite, Vec3, Size, Color, UIOpacity, Widget } from 'cc';
const { ccclass, property } = _decorator;

// UI元素数据接口
interface UIElementData {
    name: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    opacity?: number;
    fontSize?: number;
    fontColor?: string;
    fontFamily?: string;
}

@ccclass('UIGenerator')
export class UIGenerator extends Component {

    @property(Node)
    containerNode: Node = null;

    // 四个图片阶段的位置和大小数据
    private uiElementsData: UIElementData[] = [
        {
            name: "形状结合",
            position: { x: 278.09, y: 216.67 },
            size: { width: 32.31, height: 21.86 },
            opacity: 100
        },
        {
            name: "财神备份2", 
            position: { x: 237, y: 226 },
            size: { width: 50, height: 60.97 },
            opacity: 100
        },
        {
            name: "数字38",
            position: { x: 289.56, y: 266.24 },
            size: { width: 24, height: 28 },
            opacity: 100
        },
        {
            name: "财神数量",
            position: { x: 222, y: 287 },
            size: { width: 80, height: 28 },
            opacity: 100,
            fontSize: 20,
            fontColor: "#595959",
            fontFamily: "PingFang SC"
        }
    ];

    start() {
        this.generateUI();
    }

    /**
     * 生成UI元素
     */
    public generateUI(): void {
        if (!this.containerNode) {
            console.error("容器节点未设置！");
            return;
        }

        // 清除容器中的现有子节点
        this.containerNode.removeAllChildren();

        // 生成每个UI元素
        this.uiElementsData.forEach((elementData, index) => {
            this.createUIElement(elementData, index);
        });

        console.log("UI元素生成完成！");
    }

    /**
     * 创建单个UI元素
     * @param elementData 元素数据
     * @param index 元素索引
     */
    private createUIElement(elementData: UIElementData, index: number): void {
        // 创建节点
        const elementNode = new Node(elementData.name);
        
        // 添加UITransform组件
        const uiTransform = elementNode.addComponent(UITransform);
        
        // 设置位置和大小
        elementNode.setPosition(new Vec3(elementData.position.x, elementData.position.y, 0));
        uiTransform.setContentSize(new Size(elementData.size.width, elementData.size.height));

        // 如果是文本元素，添加Label组件
        if (elementData.fontSize) {
            const label = elementNode.addComponent(Label);
            label.string = elementData.name;
            label.fontSize = elementData.fontSize;
            
            // 设置字体为shrink形式
            label.overflow = Label.Overflow.SHRINK;
            
            // 设置字体颜色
            if (elementData.fontColor) {
                const color = this.hexToColor(elementData.fontColor);
                label.color = color;
            }
            
            // 设置字体族（如果支持）
            if (elementData.fontFamily) {
                // 注意：Cocos Creator中字体设置可能需要预加载字体资源
                console.log(`字体族设置: ${elementData.fontFamily}`);
            }
        } else {
            // 添加Sprite组件用于显示图片
            const sprite = elementNode.addComponent(Sprite);
            // 这里可以设置具体的图片资源
            console.log(`为元素 ${elementData.name} 添加Sprite组件`);
        }

        // 设置透明度
        if (elementData.opacity !== undefined) {
            const uiOpacity = elementNode.addComponent(UIOpacity);
            if (uiOpacity) {
                uiOpacity.opacity = elementData.opacity / 100 * 255;
            }
        }

        // 添加Widget组件并设置左上角对齐
        const widget = elementNode.addComponent(Widget);
        if (widget) {
            // 设置对齐方式为左上角
            widget.isAlignTop = true;
            widget.isAlignLeft = true;
            widget.isAlignRight = false;
            widget.isAlignBottom = false;
            widget.isAlignHorizontalCenter = false;
            widget.isAlignVerticalCenter = false;
            
            // 设置边距
            widget.top = elementData.position.y; // 从顶部的距离
            widget.left = elementData.position.x;  // 从左侧的距离
            
            // 启用Widget
            widget.enabled = true;
        }

        // 添加到容器节点
        elementNode.setParent(this.containerNode);
        
        console.log(`创建UI元素: ${elementData.name}, 位置: (${elementData.position.x}, ${elementData.position.y}), 大小: ${elementData.size.width}x${elementData.size.height}, Widget左上对齐`);
    }

    /**
     * 十六进制颜色转换为Color对象
     * @param hex 十六进制颜色字符串
     * @returns Color对象
     */
    private hexToColor(hex: string): Color {
        // 移除#号
        hex = hex.replace('#', '');
        
        // 解析RGB值
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        return new Color(r * 255, g * 255, b * 255, 255);
    }

    /**
     * 更新UI元素位置
     * @param elementName 元素名称
     * @param newPosition 新位置
     */
    public updateElementPosition(elementName: string, newPosition: { x: number; y: number }): void {
        const elementNode = this.containerNode.getChildByName(elementName);
        if (elementNode) {
            // 如果有Widget组件，更新Widget的偏移量
            const widget = elementNode.getComponent(Widget);
            if (widget) {
                widget.left = newPosition.x;
                widget.top = newPosition.y;
            } else {
                // 没有Widget组件时直接设置位置
                elementNode.setPosition(new Vec3(newPosition.x, newPosition.y, 0));
            }
            console.log(`更新元素 ${elementName} 位置至: (${newPosition.x}, ${newPosition.y})`);
        } else {
            console.warn(`未找到名为 ${elementName} 的元素`);
        }
    }

    /**
     * 更新UI元素大小
     * @param elementName 元素名称
     * @param newSize 新大小
     */
    public updateElementSize(elementName: string, newSize: { width: number; height: number }): void {
        const elementNode = this.containerNode.getChildByName(elementName);
        if (elementNode) {
            const uiTransform = elementNode.getComponent(UITransform);
            if (uiTransform) {
                uiTransform.setContentSize(new Size(newSize.width, newSize.height));
                console.log(`更新元素 ${elementName} 大小至: ${newSize.width}x${newSize.height}`);
            }
        } else {
            console.warn(`未找到名为 ${elementName} 的元素`);
        }
    }

    /**
     * 获取UI元素数据
     * @returns UI元素数据数组
     */
    public getUIElementsData(): UIElementData[] {
        return this.uiElementsData;
    }

    /**
     * 重新生成UI（用于运行时动态调整）
     */
    public regenerateUI(): void {
        this.generateUI();
    }
} 