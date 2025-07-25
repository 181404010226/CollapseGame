import { _decorator, Component, Button, Label, log } from 'cc';
import { ApiConfig } from './ApiConfig';

const { ccclass, property } = _decorator;

/**
 * API配置管理示例
 * 演示如何使用ApiConfig进行配置管理
 */
@ccclass('ApiConfigExample')
export class ApiConfigExample extends Component {

    @property(Button)
    showConfigButton: Button = null;

    @property(Button)
    showEnvironmentsButton: Button = null;

    @property(Button)
    testEndpointsButton: Button = null;

    @property(Label)
    displayLabel: Label = null;

    start() {
        // 绑定按钮事件
        if (this.showConfigButton) {
            this.showConfigButton.node.on(Button.EventType.CLICK, this.onShowConfigClick, this);
        }

        if (this.showEnvironmentsButton) {
            this.showEnvironmentsButton.node.on(Button.EventType.CLICK, this.onShowEnvironmentsClick, this);
        }

        if (this.testEndpointsButton) {
            this.testEndpointsButton.node.on(Button.EventType.CLICK, this.onTestEndpointsClick, this);
        }

        this.updateDisplay('API配置管理示例已就绪');
        
        // 启动时打印配置信息
        ApiConfig.printCurrentConfig();
        
        log('API配置管理示例组件已启动');
    }

    /**
     * 显示当前配置信息
     */
    private onShowConfigClick(): void {
        const env = ApiConfig.getCurrentEnvironment();
        const appConfig = ApiConfig.APP_CONFIG;
        const wechatConfig = ApiConfig.WECHAT_CONFIG;

        let configInfo = '=== 当前配置信息 ===\n';
        configInfo += `环境: ${env.name} (${env.description})\n`;
        configInfo += `API地址: ${env.baseUrl}\n`;
        configInfo += `超时时间: ${env.timeout}ms\n\n`;
        
        configInfo += '应用配置:\n';
        configInfo += `包名: ${appConfig.packageName}\n`;
        configInfo += `版本号: ${appConfig.currentVersion}\n`;
        configInfo += `版本名: ${appConfig.versionName}\n\n`;
        
        configInfo += '微信配置:\n';
        configInfo += `AppID: ${wechatConfig.appId}\n`;
        configInfo += `授权范围: ${wechatConfig.scope}\n\n`;
        
        configInfo += '常用方法:\n';
        configInfo += `getBaseUrl(): ${ApiConfig.getBaseUrl()}\n`;
        configInfo += `getTimeout(): ${ApiConfig.getTimeout()}ms\n`;
        configInfo += `getPackageName(): ${ApiConfig.getPackageName()}\n`;
        configInfo += `getCurrentVersion(): ${ApiConfig.getCurrentVersion()}`;

        this.updateDisplay(configInfo);
        log('配置信息已显示');
    }

    /**
     * 显示所有可用环境
     */
    private onShowEnvironmentsClick(): void {
        const environments = ApiConfig.getAvailableEnvironments();
        
        let envInfo = '=== 可用环境列表 ===\n';
        
        environments.forEach(envName => {
            const env = ApiConfig.ENVIRONMENTS[envName];
            const isCurrent = envName === ApiConfig.CURRENT_ENV;
            envInfo += `${isCurrent ? '★ ' : '  '}${env.name}\n`;
            envInfo += `    描述: ${env.description}\n`;
            envInfo += `    地址: ${env.baseUrl}\n`;
            envInfo += `    超时: ${env.timeout}ms\n\n`;
        });

        envInfo += '注意: ★ 表示当前使用的环境\n';
        envInfo += '要切换环境，请修改 ApiConfig.ts 中的 CURRENT_ENV 值';

        this.updateDisplay(envInfo);
        log('环境列表已显示');
    }

    /**
     * 测试API端点
     */
    private onTestEndpointsClick(): void {
        const endpoints = ApiConfig.API_ENDPOINTS;
        
        let endpointInfo = '=== API端点测试 ===\n';
        
        Object.keys(endpoints).forEach(key => {
            const endpoint = endpoints[key];
            const fullUrl = ApiConfig.getFullUrl(endpoint);
            endpointInfo += `${key}:\n`;
            endpointInfo += `  端点: ${endpoint}\n`;
            endpointInfo += `  完整URL: ${fullUrl}\n\n`;
        });

        endpointInfo += '状态码配置:\n';
        Object.keys(ApiConfig.BUSINESS_CODE).forEach(key => {
            endpointInfo += `${key}: ${ApiConfig.BUSINESS_CODE[key]}\n`;
        });

        this.updateDisplay(endpointInfo);
        log('API端点信息已显示');
    }

    /**
     * 更新显示内容
     */
    private updateDisplay(text: string): void {
        if (this.displayLabel) {
            this.displayLabel.string = text;
        }
    }

    /**
     * 演示如何在代码中使用ApiConfig
     */
    public demonstrateUsage(): void {
        log('=== ApiConfig使用示例 ===');
        
        // 获取基础配置
        log('API基础URL:', ApiConfig.getBaseUrl());
        log('超时时间:', ApiConfig.getTimeout());
        log('包名:', ApiConfig.getPackageName());
        log('版本:', ApiConfig.getCurrentVersion());
        
        // 构建完整URL
        const versionUrl = ApiConfig.getFullUrl(ApiConfig.API_ENDPOINTS.GET_VERSION);
        log('版本检查完整URL:', versionUrl);
        
        // 检查响应状态
        const isSuccess = ApiConfig.isResponseSuccess(200);
        log('200状态码是否表示成功:', isSuccess);
        
        // 获取微信配置
        log('微信AppID:', ApiConfig.getWeChatAppId());
        log('微信授权范围:', ApiConfig.getWeChatScope());
        
        // 获取当前环境信息
        const currentEnv = ApiConfig.getCurrentEnvironment();
        log('当前环境:', currentEnv);
        
        // 显示所有可用环境
        const allEnvs = ApiConfig.getAvailableEnvironments();
        log('所有可用环境:', allEnvs);
        
        log('=== 示例结束 ===');
    }
} 