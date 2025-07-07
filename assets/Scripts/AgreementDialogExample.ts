import { _decorator, Component, Node, Button } from 'cc';
import { AgreementDialogController } from './AgreementDialogController';
const { ccclass, property } = _decorator;

/**
 * 协议弹窗使用示例
 * 演示如何点击按钮触发不同的协议内容显示
 */
@ccclass('AgreementDialogExample')
export class AgreementDialogExample extends Component {
    
    @property(Button)
    showUserAgreementBtn: Button = null;  // 显示用户协议按钮
    
    @property(Button)
    showPrivacyAgreementBtn: Button = null;  // 显示隐私协议按钮
    
    @property(Button)
    showCustomAgreementBtn: Button = null;  // 显示自定义协议按钮
    
    @property(AgreementDialogController)
    agreementController: AgreementDialogController = null;  // 协议控制器引用

    onLoad() {
        this.bindEvents();
    }

    start() {
        // 可以在这里设置自定义协议内容
        this.setupCustomContent();
    }

    /**
     * 绑定按钮事件
     */
    private bindEvents() {
        // 用户协议按钮
        if (this.showUserAgreementBtn) {
            this.showUserAgreementBtn.node.on(Button.EventType.CLICK, this.onShowUserAgreement, this);
        }
        
        // 隐私协议按钮
        if (this.showPrivacyAgreementBtn) {
            this.showPrivacyAgreementBtn.node.on(Button.EventType.CLICK, this.onShowPrivacyAgreement, this);
        }
        
        // 自定义协议按钮
        if (this.showCustomAgreementBtn) {
            this.showCustomAgreementBtn.node.on(Button.EventType.CLICK, this.onShowCustomAgreement, this);
        }
    }

    /**
     * 显示用户协议
     */
    private onShowUserAgreement() {
        if (this.agreementController) {
            // 方式1：使用预定义类型
            this.agreementController.showAgreementByType('user');
        } else {
            console.warn("协议控制器未配置");
        }
    }

    /**
     * 显示隐私协议
     */
    private onShowPrivacyAgreement() {
        if (this.agreementController) {
            // 方式1：使用预定义类型
            this.agreementController.showAgreementByType('privacy');
        } else {
            console.warn("协议控制器未配置");
        }
    }

    /**
     * 显示自定义协议
     */
    private onShowCustomAgreement() {
        if (this.agreementController) {
            // 方式2：直接传入自定义标题和内容
            const customTitle = "自定义服务条款";
            const customContent = `自定义服务条款

这是一个自定义的协议内容示例。

1. 自定义条款一
这里是第一个自定义条款的详细说明...

2. 自定义条款二
这里是第二个自定义条款的详细说明...

3. 自定义条款三
这里是第三个自定义条款的详细说明...

本协议的解释权归我方所有。`;

            this.agreementController.showAgreementDialog(customTitle, customContent, 'custom');
        } else {
            console.warn("协议控制器未配置");
        }
    }

    /**
     * 设置自定义协议内容
     */
    private setupCustomContent() {
        if (this.agreementController) {
            const customUserAgreement = `定制用户服务协议

欢迎使用我们的定制服务！

这是一个通过代码动态设置的用户协议内容...`;

            const customPrivacyPolicy = `定制隐私政策

我们非常重视您的隐私。

这是一个通过代码动态设置的隐私政策内容...`;

            // 设置自定义内容
            this.agreementController.setAgreementContent(customUserAgreement, customPrivacyPolicy);
            console.log("已设置自定义协议内容");
        }
    }

    /**
     * 外部调用：更新协议标题
     */
    public updateAgreementTitle(newTitle: string) {
        if (this.agreementController) {
            this.agreementController.updateAgreementTitle(newTitle);
        }
    }

    /**
     * 外部调用：更新协议内容
     */
    public updateAgreementContent(newContent: string) {
        if (this.agreementController) {
            this.agreementController.updateAgreementContent(newContent);
        }
    }

    /**
     * 外部调用：检查当前显示的协议类型
     */
    public checkCurrentAgreementType() {
        if (this.agreementController) {
            const currentType = this.agreementController.getCurrentAgreementType();
            console.log("当前协议类型:", currentType);
            return currentType;
        }
        return "";
    }

    /**
     * 演示：批量替换协议内容
     */
    public demonstrateContentReplacement() {
        if (!this.agreementController) {
            console.warn("协议控制器未配置，无法演示");
            return;
        }

        console.log("开始演示内容替换...");

        // 1. 显示用户协议
        this.agreementController.showAgreementByType('user');
        
        // 2. 延迟2秒后替换标题
        setTimeout(() => {
            this.agreementController.updateAgreementTitle("更新后的用户协议标题");
            console.log("标题已更新");
        }, 2000);

        // 3. 延迟4秒后替换内容
        setTimeout(() => {
            this.agreementController.updateAgreementContent("这是动态更新的协议内容，展示了如何在运行时替换协议的标题和内容。");
            console.log("内容已更新");
        }, 4000);

        // 4. 延迟6秒后切换到隐私协议
        setTimeout(() => {
            this.agreementController.showAgreementByType('privacy');
            console.log("已切换到隐私协议");
        }, 6000);
    }
} 