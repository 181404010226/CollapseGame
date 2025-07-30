import { _decorator, Component, log, warn, native, director, Node } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 原生消息处理器接口
 */
export interface INativeMessageHandler {
    /**
     * 处理原生消息
     * @param command 命令类型
     * @param data 数据
     * @returns 是否处理了该消息
     */
    handleNativeMessage(command: string, data: string): boolean;
}

/**
 * 原生桥接管理器
 * 统一处理所有原生回调消息，并路由到相应的处理器
 */
@ccclass('NativeBridgeManager')
export class NativeBridgeManager extends Component {
    
    private static instance: NativeBridgeManager = null;
    private messageHandlers: Map<string, INativeMessageHandler> = new Map();
    private isInitialized: boolean = false;
    private originalNativeHandler: ((command: string, data: string) => void) | null = null;
    private originalJsbHandler: ((command: string, data: string) => void) | null = null;
    
    /**
     * 获取单例实例
     */
    public static getInstance(): NativeBridgeManager {
        if (!NativeBridgeManager.instance) {
            // 尝试在场景中查找现有实例
            const existingNode = director.getScene()?.getChildByName('NativeBridgeManager');
            if (existingNode) {
                NativeBridgeManager.instance = existingNode.getComponent(NativeBridgeManager);
            }
            
            if (!NativeBridgeManager.instance) {
                log('创建新的NativeBridgeManager实例');
                // 如果没有找到，创建一个新的
                const node = new Node('NativeBridgeManager');
                NativeBridgeManager.instance = node.addComponent(NativeBridgeManager);
                director.getScene()?.addChild(node);
                director.addPersistRootNode(node);
            }
        }
        return NativeBridgeManager.instance;
    }
    
    onLoad() {
        // 如果已经有实例存在，销毁当前节点
        if (NativeBridgeManager.instance && NativeBridgeManager.instance !== this) {
            this.node.destroy();
            return;
        }
        
        // 设置为常驻节点
        director.addPersistRootNode(this.node);
        NativeBridgeManager.instance = this;
        
        log('=== NativeBridgeManager 初始化 ===');
    }
    
    start() {
        this.initializeNativeBridge();
    }
    
    onDestroy() {
        log('=== NativeBridgeManager 销毁 ===');
        this.cleanup();
        
        if (NativeBridgeManager.instance === this) {
            NativeBridgeManager.instance = null;
        }
    }
    
    /**
     * 初始化原生桥接
     */
    private initializeNativeBridge(): void {
        if (this.isInitialized) {
            log('原生桥接已初始化，跳过重复初始化');
            return;
        }
        
        try {
            log('=== 开始初始化统一原生桥接 ===');
            
            // 检查当前环境
            log(`环境检查:`);
            log(`- typeof native: ${typeof native}`);
            log(`- native.bridge: ${typeof native !== 'undefined' ? !!native.bridge : 'N/A'}`);
            log(`- typeof jsb: ${typeof jsb}`);
            log(`- typeof window: ${typeof window}`);
            log(`- typeof globalThis: ${typeof globalThis}`);
            
            // 方法1: 使用 native.bridge.onNative 注册回调
            this.setupNativeBridge();
            
            // 方法2: 使用 jsb.bridge 作为备用
            this.setupJSBBridge();
            
            // 方法3: 注册全局函数回调（确保兼容性）
            this.setupGlobalCallbacks();
            
            this.isInitialized = true;
            log('✅ 统一原生桥接初始化完成');
            
        } catch (error) {
            warn('初始化原生桥接失败:', error);
        }
    }
    
    /**
     * 设置 native.bridge 回调
     */
    private setupNativeBridge(): void {
        if (typeof native !== 'undefined' && native.bridge) {
            // 保存原有的处理器
            this.originalNativeHandler = native.bridge.onNative;
            
            // 设置新的统一处理器
            native.bridge.onNative = (command: string, data: string) => {
                try {
                    log(`收到原生消息 (native.bridge): ${command} -> ${data}`);
                    
                    // 先尝试统一消息路由
                    const handled = this.routeNativeMessage(command, data);
                    
                    // 如果统一路由没有处理，再调用原有处理器
                    if (!handled && this.originalNativeHandler && typeof this.originalNativeHandler === 'function') {
                        this.originalNativeHandler.call(native.bridge, command, data);
                    }
                } catch (e) {
                    console.error('处理原生回调失败:', e);
                }
            };
            
            log('✅ native.bridge 回调设置完成');
        } else {
            log('❌ native.bridge 不可用');
        }
    }
    
    /**
     * 设置 jsb.bridge 回调
     */
    private setupJSBBridge(): void {
        try {
            if (typeof jsb !== 'undefined' && (jsb as any).bridge) {
                const jsbBridge: any = (jsb as any).bridge;
                
                // 方式1: 通过 setCallback 设置
                if (jsbBridge.setCallback) {
                    const callbackObj = {
                        onScript: (command: string, data: string) => {
                            try {
                                log(`收到原生回调 (jsb.bridge): ${command} -> ${data}`);
                                this.routeNativeMessage(command, data);
                            } catch (e) {
                                console.error('处理原生回调失败:', e);
                            }
                        }
                    };
                    jsbBridge.setCallback(callbackObj);
                    log('✅ jsb.bridge.setCallback 回调设置完成');
                }
                
                // 方式2: 直接设置 onNative（备用）
                if (jsbBridge.onNative) {
                    this.originalJsbHandler = jsbBridge.onNative;
                    jsbBridge.onNative = (command: string, data: string) => {
                        try {
                            log(`收到原生回调 (jsb.bridge.onNative): ${command} -> ${data}`);
                            
                            // 先尝试统一消息路由
                            const handled = this.routeNativeMessage(command, data);
                            
                            // 如果统一路由没有处理，再调用原有处理器
                            if (!handled && this.originalJsbHandler && typeof this.originalJsbHandler === 'function') {
                                this.originalJsbHandler.call(jsbBridge, command, data);
                            }
                        } catch (e) {
                            console.error('处理原生回调失败:', e);
                        }
                    };
                    log('✅ jsb.bridge.onNative 回调设置完成');
                }
            } else {
                log('❌ jsb.bridge 不可用');
            }
        } catch (e) {
            log('❌ JSB Bridge 设置失败:', e);
        }
    }
    
    /**
     * 设置全局回调函数
     */
    private setupGlobalCallbacks(): void {
        // 方法3: window 全局回调
        if (typeof window !== 'undefined') {
            (window as any).onUnifiedNativeCallback = (command: string, data: string) => {
                try {
                    log(`收到原生回调 (window.onUnifiedNativeCallback): ${command} -> ${data}`);
                    this.routeNativeMessage(command, data);
                } catch (e) {
                    console.error('处理原生回调失败:', e);
                }
            };
            
            // 设置传统的回调函数作为备用
            (window as any).onPangleCallback = (command: string, data: string) => {
                try {
                    log(`收到原生回调 (window.onPangleCallback): ${command} -> ${data}`);
                    this.routeNativeMessage(command, data);
                } catch (e) {
                    console.error('处理原生回调失败:', e);
                }
            };
            
            log('✅ window 全局回调已注册');
        } else {
            log('❌ window 不可用');
        }
        
        // 方法4: globalThis 回调
        if (typeof globalThis !== 'undefined') {
            (globalThis as any).onUnifiedNativeCallback = (command: string, data: string) => {
                try {
                    log(`收到原生回调 (globalThis): ${command} -> ${data}`);
                    this.routeNativeMessage(command, data);
                } catch (e) {
                    console.error('处理原生回调失败:', e);
                }
            };
            
            // 设置传统的回调函数作为备用
            (globalThis as any).onPangleCallback = (command: string, data: string) => {
                try {
                    log(`收到原生回调 (globalThis.onPangleCallback): ${command} -> ${data}`);
                    this.routeNativeMessage(command, data);
                } catch (e) {
                    console.error('处理原生回调失败:', e);
                }
            };
            
            log('✅ globalThis 回调已注册');
        } else {
            log('❌ globalThis 不可用');
        }
    }
    
    /**
     * 路由原生消息到相应的处理器
     * @returns 返回是否有处理器处理了消息
     */
    private routeNativeMessage(command: string, data: string): boolean {
        log(`=== 路由原生消息: ${command} ===`);
        log(`当前注册的处理器数量: ${this.messageHandlers.size}`);
        
        let handled = false;
        
        // 遍历所有注册的处理器
        for (const [handlerName, handler] of this.messageHandlers) {
            try {
                if (handler.handleNativeMessage(command, data)) {
                    log(`消息 ${command} 已被处理器 ${handlerName} 处理`);
                    handled = true;
                    break; // 消息被处理后停止传递
                }
                // 移除"未处理消息"的日志，因为这是正常的路由过程
            } catch (error) {
                warn(`处理器 ${handlerName} 处理消息 ${command} 时发生错误:`, error);
            }
        }
        
        if (!handled) {
            warn(`未找到处理器处理消息: ${command}`);
            log(`已注册的处理器列表: ${Array.from(this.messageHandlers.keys()).join(', ')}`);
        }
        
        return handled;
    }
    
    /**
     * 注册消息处理器
     */
    public registerHandler(name: string, handler: INativeMessageHandler): void {
        log(`注册消息处理器: ${name}`);
        this.messageHandlers.set(name, handler);
    }
    
    /**
     * 注销消息处理器
     */
    public unregisterHandler(name: string): void {
        log(`注销消息处理器: ${name}`);
        this.messageHandlers.delete(name);
    }
    
    /**
     * 发送消息到原生端
     */
    public sendToNative(command: string, data: string): boolean {
        // 方法1: 优先使用 native.bridge.sendToNative
        if (typeof native !== 'undefined' && native.bridge && native.bridge.sendToNative) {
            try {
                native.bridge.sendToNative(command, data);
                log(`发送到原生端 (native.bridge): ${command} -> ${data}`);
                return true;
            } catch (e) {
                console.error('native.bridge 发送失败:', e);
            }
        }
        
        // 方法2: 尝试使用 jsb.bridge 作为备用
        try {
            if (typeof jsb !== 'undefined' && (jsb as any).bridge && (jsb as any).bridge.sendToNative) {
                (jsb as any).bridge.sendToNative(command, data);
                log(`发送到原生端 (jsb.bridge): ${command} -> ${data}`);
                return true;
            }
        } catch (e) {
            console.error('jsb.bridge 发送失败:', e);
        }
        
        warn('当前平台不支持原生桥接');
        return false;
    }
    
    /**
     * 检查原生桥接是否可用
     */
    public isNativeBridgeAvailable(): boolean {
        return (typeof native !== 'undefined' && !!native.bridge) || 
               (typeof jsb !== 'undefined' && !!(jsb as any).bridge);
    }
    
    /**
     * 获取已注册的处理器列表
     */
    public getRegisteredHandlers(): string[] {
        return Array.from(this.messageHandlers.keys());
    }
    
    /**
     * 清理资源
     */
    private cleanup(): void {
        try {
            // 恢复原有的处理器
            if (typeof native !== 'undefined' && native.bridge && this.originalNativeHandler) {
                native.bridge.onNative = this.originalNativeHandler;
                this.originalNativeHandler = null;
            }
            
            if (typeof jsb !== 'undefined' && (jsb as any).bridge && this.originalJsbHandler) {
                (jsb as any).bridge.onNative = this.originalJsbHandler;
                this.originalJsbHandler = null;
            }
            
            // 清理全局回调
            if (typeof window !== 'undefined') {
                delete (window as any).onUnifiedNativeCallback;
            }
            
            if (typeof globalThis !== 'undefined') {
                delete (globalThis as any).onUnifiedNativeCallback;
            }
            
            // 清空处理器
            this.messageHandlers.clear();
            
            log('原生桥接管理器清理完成');
        } catch (error) {
            warn('清理原生桥接管理器失败:', error);
        }
    }
    
    /**
     * 测试原生桥接连通性
     */
    public testNativeBridge(): void {
        log('=== 测试原生桥接连通性 ===');
        
        // 检查所有回调是否都正确设置
        if (typeof native !== 'undefined' && native.bridge && native.bridge.onNative) {
            log('✅ native.bridge.onNative 存在');
        } else {
            log('❌ native.bridge.onNative 不存在');
        }
        
        if (typeof window !== 'undefined' && (window as any).onUnifiedNativeCallback) {
            log('✅ window.onUnifiedNativeCallback 存在');
        } else {
            log('❌ window.onUnifiedNativeCallback 不存在');
        }
        
        if (typeof globalThis !== 'undefined' && (globalThis as any).onUnifiedNativeCallback) {
            log('✅ globalThis.onUnifiedNativeCallback 存在');
        } else {
            log('❌ globalThis.onUnifiedNativeCallback 不存在');
        }
        
        log(`已注册处理器数量: ${this.messageHandlers.size}`);
        log(`已注册处理器: ${this.getRegisteredHandlers().join(', ')}`);
        
        // 发送测试消息
        if (this.isNativeBridgeAvailable()) {
            this.sendToNative('testConnection', JSON.stringify({ timestamp: Date.now() }));
        }
    }
}

// 导出便捷的静态方法
export namespace NativeBridge {
    /**
     * 获取原生桥接管理器实例
     */
    export function getInstance(): NativeBridgeManager {
        return NativeBridgeManager.getInstance();
    }
    
    /**
     * 注册消息处理器
     */
    export function registerHandler(name: string, handler: INativeMessageHandler): void {
        getInstance().registerHandler(name, handler);
    }
    
    /**
     * 注销消息处理器
     */
    export function unregisterHandler(name: string): void {
        getInstance().unregisterHandler(name);
    }
    
    /**
     * 发送消息到原生端
     */
    export function sendToNative(command: string, data: string): boolean {
        return getInstance().sendToNative(command, data);
    }
    
    /**
     * 检查原生桥接是否可用
     */
    export function isAvailable(): boolean {
        return getInstance().isNativeBridgeAvailable();
    }
    
    /**
     * 测试原生桥接连通性
     */
    export function test(): void {
        getInstance().testNativeBridge();
    }
    
    /**
     * 确保管理器被初始化
     */
    export function ensureInitialized(): NativeBridgeManager {
        const manager = getInstance();
        log('NativeBridge.ensureInitialized() - 统一原生桥接管理器已准备就绪');
        return manager;
    }
}