import { _decorator, Component, Node, Label, Button, Sprite, Color, find } from 'cc';
import { SignInService, SignInCalendarResponse, SignInCalendarData } from './SignInService';

const { ccclass, property } = _decorator;

/**
 * 签到日历控制器 - 支持两种模式
 */
@ccclass('SignInCalendarController')
export class SignInCalendarController extends Component {
    
    @property(Node)
    calendarContainer: Node = null;  // 日历容器节点
    
    @property(Button)
    signInButton: Button = null;     // 立即签到按钮
    
    @property(Label)
    signCountLabel: Label = null;    // 补签次数显示 (仅补签模式)
    
    @property({
        tooltip: '是否为补签模式 (true=补签详情, false=签到赢手机)'
    })
    isMakeupMode: boolean = false;   // 区分两种模式
    
    private signInService: SignInService = null;
    private calendarData: SignInCalendarResponse = null;

    start() {
        this.signInService = this.addComponent(SignInService);
        this.loadSignInCalendar();
        
        // 绑定按钮事件
        if (this.signInButton) {
            this.signInButton.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        }
    }

    /**
     * 加载签到日历数据
     */
    private async loadSignInCalendar() {
        try {
            // 获取日历容器的子节点数量
            const nodeCount = this.calendarContainer ? this.calendarContainer.children.length : 6;
            
            this.calendarData = await this.signInService.querySignInCalendar(nodeCount);
            this.updateCalendarUI();
            this.updateSignCountUI();
        } catch (error) {
            console.error('加载签到日历失败:', error);
        }
    }

    /**
     * 更新日历UI显示
     */
    private updateCalendarUI() {
        if (!this.calendarContainer || !this.calendarData) return;

        const children = this.calendarContainer.children;
        const calendarList = this.calendarData.calendarList;
        
        // 遍历日历容器的所有子节点
        for (let i = 0; i < children.length && i < calendarList.length; i++) {
            const dayNode = children[i];
            const dayData = calendarList[i];
            
            // 更新节点中的Label文本
            const label = dayNode.getComponentInChildren(Label);
            if (label) {
                label.string = dayData.date;
            }
            
            // 更新节点状态（颜色等）
            this.updateDayNodeState(dayNode, dayData);
        }
    }

    /**
     * 更新单个日期节点的状态
     */
    private updateDayNodeState(dayNode: Node, dayData: SignInCalendarData) {
        const sprite = dayNode.getComponent(Sprite);
        const button = dayNode.getComponent(Button);
        
        if (!sprite) return;

        // 根据签到状态设置颜色
        //先全设置为白
        switch (dayData.type) {
            case 0: // 未签到 - 蓝色
                sprite.color = new Color(255, 255, 255, 255);
                if (button) button.interactable = true;
                break;
                
            case 1: // 已签到 - 橙色/金色
                sprite.color = new Color(255, 255, 255, 255);
                if (button) button.interactable = false;
                break;
                
            case 2: // 可补签 - 红色
                sprite.color = new Color(255, 255, 255, 255);
                if (button) button.interactable = true;
                break;
        }

        // 绑定点击事件 (仅在补签模式下允许点击日期)
        if (this.isMakeupMode && button && dayData.type !== 1) {
            dayNode.off(Button.EventType.CLICK);
            dayNode.on(Button.EventType.CLICK, () => {
                this.onDayClick(dayData.date, dayData.type);
            });
        }
    }

    /**
     * 更新补签次数显示 (仅补签模式)
     */
    private updateSignCountUI() {
        if (this.signCountLabel && this.calendarData && this.isMakeupMode) {
            this.signCountLabel.string = `补签到 ${this.calendarData.signInCount}/1`;
        }
    }

    /**
     * 日期点击事件 (仅补签模式)
     */
    private async onDayClick(date: string, type: number) {
        if (!this.isMakeupMode) return;
        
        try {
            let success = false;
            if (type === 2) { // 可补签
                success = await this.signInService.performMakeupSignIn(date);
                console.log(`${date} 补签${success ? '成功' : '失败'}`);
            } else if (type === 0) { // 未签到
                success = await this.signInService.performSignIn(date);
                console.log(`${date} 签到${success ? '成功' : '失败'}`);
            }
            
            if (success) {
                // 重新加载日历数据
                await this.loadSignInCalendar();
            }
        } catch (error) {
            console.error('签到操作失败:', error);
        }
    }

    /**
     * 按钮点击事件
     */
    private async onButtonClick() {
        if (this.isMakeupMode) {
            // 补签模式：执行补签操作
            await this.performMakeupSign();
        } else {
            // 签到模式：执行今日签到
            await this.performTodaySign();
        }
    }

    /**
     * 执行今日签到
     */
    private async performTodaySign() {
        const today = this.getCurrentDateString();
        try {
            const success = await this.signInService.performSignIn(today);
            if (success) {
                console.log('今日签到成功');
                await this.loadSignInCalendar();
            } else {
                console.error('今日签到失败');
            }
        } catch (error) {
            console.error('签到操作失败:', error);
        }
    }

    /**
     * 执行补签操作
     */
    private async performMakeupSign() {
        if (!this.calendarData || !this.calendarData.canReSignDate) {
            console.warn('没有可补签的日期');
            return;
        }
        
        try {
            const success = await this.signInService.performMakeupSignIn(this.calendarData.canReSignDate);
            if (success) {
                console.log(`补签成功: ${this.calendarData.canReSignDate}`);
                await this.loadSignInCalendar();
            } else {
                console.error('补签失败');
            }
        } catch (error) {
            console.error('补签操作失败:', error);
        }
    }

    /**
     * 获取当前日期字符串
     */
    private getCurrentDateString(): string {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        return `${month}.${day}`;
    }

    /**
     * 公共方法：刷新日历数据
     */
    public async refreshCalendar() {
        await this.loadSignInCalendar();
    }
}
