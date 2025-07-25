import { _decorator, Component, Button, find } from 'cc';
import { PopupButtonBinder } from '../按钮显现隐藏/PopupButtonBinder';
import { SignInCalendarController } from './SignInCalendarController';
import { TaskCenterPageController } from './TaskCenterPageController';

const { ccclass, property } = _decorator;

@ccclass('TaskCenterController')
export class TaskCenterController extends Component {
    
    @property(Button)
    yearSignButton: Button = null;      // "连续签到一年赢手机"按钮
    
    @property(Button)
    makeupSignButton: Button = null;    // "补签到活动"按钮

    @property(TaskCenterPageController)
    taskCenterPageController: TaskCenterPageController = null;

    start() {
        this.bindButtonEvents();
    }

    private bindButtonEvents() {
        // 绑定"连续签到一年赢手机"按钮
        if (this.yearSignButton) {
            this.yearSignButton.node.on(Button.EventType.CLICK, this.onYearSignClick, this);
        }

        // 绑定"补签到活动"按钮  
        if (this.makeupSignButton) {
            this.makeupSignButton.node.on(Button.EventType.CLICK, this.onMakeupSignClick, this);
        }
    }

    /**
     * 连续签到一年赢手机按钮点击
     */
    private onYearSignClick() {
        console.log('点击连续签到一年赢手机按钮');
        const popupBinder = this.yearSignButton.getComponent(PopupButtonBinder);
        if (popupBinder) {
            popupBinder.showPopup(() => {
                // 使用重试机制查找控制器
                this.findControllerWithRetry('签到赢手机', false);
            });
        }
    }

    /**
     * 补签到活动按钮点击
     */
    private onMakeupSignClick() {
        console.log('点击补签到活动按钮');
        const popupBinder = this.makeupSignButton.getComponent(PopupButtonBinder);
        if (popupBinder) {
            popupBinder.showPopup(() => {
                // 使用重试机制查找控制器
                this.findControllerWithRetry('签到详情', true);
            });
        }
    }

    /**
     * 带重试的控制器查找
     */
    private findControllerWithRetry(popupName: string, isMakeupMode: boolean, retryCount: number = 0) {
        const maxRetries = 3;
        const retryDelay = 0.1;
        
        this.scheduleOnce(() => {
            const calendarController = this.findSignInController(popupName);
            if (calendarController) {
                // 找到了，设置模式并刷新
                calendarController.isMakeupMode = isMakeupMode;
                calendarController.refreshCalendar();
                console.log(`${popupName}弹窗已显示，开始加载数据`);
            } else if (retryCount < maxRetries) {
                // 没找到，静默重试（不打印警告）
                this.findControllerWithRetry(popupName, isMakeupMode, retryCount + 1);
            } else {
                // 最后一次重试失败才打印警告
                console.warn(`经过${maxRetries}次重试仍找不到${popupName}的控制器`);
            }
        }, retryDelay);
    }

    /**
     * 查找签到控制器（静默版本，不打印警告）
     */
    private findSignInController(popupName: string): SignInCalendarController | null {
        const possiblePaths = [
            `Canvas/${popupName}`,
            popupName,
            `${popupName}弹窗`,
            `Popup_${popupName}`
        ];
        
        for (const path of possiblePaths) {
            const popup = find(path);
            if (popup) {
                const controller = popup.getComponent(SignInCalendarController);
                if (controller) {
                    return controller;
                }
            }
        }
        
        // 移除这里的警告，让重试机制处理
        return null;
    }

    /**
     * 刷新任务中心数据
     */
    public async refreshTaskCenter() {
        if (this.taskCenterPageController) {
            await this.taskCenterPageController.refreshTasks();
        }
    }
}
