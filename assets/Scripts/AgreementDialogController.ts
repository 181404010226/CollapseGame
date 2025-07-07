import { _decorator, Component, Node, Button, Label, resources, TextAsset, ScrollView, UIOpacity, tween, UITransform, Color, Size, Layout } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 协议弹窗控制器
 * 用于管理用户协议和隐私协议的显示
 */
@ccclass('AgreementDialogController')
export class AgreementDialogController extends Component {
    
    @property(Node)
    agreementDialogNode: Node = null;  // 协议弹窗节点（用于控制显示/隐藏）
    
    @property(Label)
    agreementTitleLabel: Label = null;  // 协议标题Label
    
    @property(Label)
    agreementContentRichText: Label = null;  // 协议内容Label（替换RichText）
    
    @property(ScrollView)
    agreementScrollView: ScrollView = null;  // 协议内容的ScrollView（可选）
    
    @property(Button)
    closeAgreementBtn: Button = null;  // 关闭协议按钮
    
    @property(Button)
    userAgreementBtn: Button = null;  // 用户协议按钮
    
    @property(Button)
    privacyAgreementBtn: Button = null;  // 隐私协议按钮
    
    @property(TextAsset)
    userAgreementTextAsset: TextAsset = null;  // 用户协议文本资源
    
    @property(TextAsset)
    privacyAgreementTextAsset: TextAsset = null;  // 隐私协议文本资源
    
    @property({
        tooltip: "使用Label替代RichText提升性能（推荐大文本使用）"
    })
    useLabelForPerformance: boolean = true;  // 使用Label提升性能
    
    @property({
        tooltip: "在组件启动时预加载协议内容"
    })
    preloadOnStart: boolean = true;  // 页面加载时预加载
    
    @property({
        tooltip: "预加载延迟时间（秒），避免阻塞页面初始化"
    })
    preloadDelay: number = 0.1;  // 预加载延迟时间
    
    @property({
        tooltip: "单个 Label 最大字符数，过大可能触发 StaticVBAccessor 错误"
    })
    maxCharsPerChunk: number = 600; // 默认 600，可在编辑器调整
    
    @property({
        tooltip: "协议内容区域固定宽度(px)，默认 670"
    })
    contentWidth: number = 670;
    
    @property({
        tooltip: "左右内边距(px)，影响子 Label 宽度，默认为0"
    })
    sidePadding: number = 0;
    
    // 协议内容存储
    private userAgreementContent: string = "";
    private privacyAgreementContent: string = "";
    
    // 内容加载状态
    private isUserAgreementLoaded: boolean = false;
    private isPrivacyAgreementLoaded: boolean = false;
    private isPreloadStarted: boolean = false;
    private isPreloadCompleted: boolean = false;
    
    // 协议类型枚举
    private AgreementType = {
        USER_AGREEMENT: 'user',
        PRIVACY_AGREEMENT: 'privacy'
    };

    onLoad() {
        // 绑定事件
        this.bindEvents();
        
        // 检查是否启用预加载
        if (this.preloadOnStart) {
            this.startPreloadProcess();
        }
    }

    start() {
        // 初始状态隐藏协议弹窗
        this.hideAgreementDialog();
        
        // 设置协议内容RichText的属性
        this.setupContentRichTextProperties();
        
        // 如果没有在onLoad时预加载，现在开始加载
        if (!this.preloadOnStart && !this.isPreloadStarted) {
            this.loadAgreementContent();
        }
    }

    /**
     * 加载协议内容
     */
    private loadAgreementContent() {
        // 加载用户服务协议
        if (this.userAgreementTextAsset) {
            // 优先使用绑定的TextAsset
            this.userAgreementContent = this.userAgreementTextAsset.text;
            console.log("用户服务协议加载成功（通过绑定的TextAsset）");
        } else {
            // 如果没有绑定TextAsset，则尝试从resources加载
            resources.load("用户服务协议", TextAsset, (err, asset) => {
                if (!err && asset) {
                    this.userAgreementContent = asset.text;
                    console.log("用户服务协议加载成功（通过resources）");
                } else {
                    console.error("用户服务协议加载失败:", err);
                    this.userAgreementContent = "";
                }
            });
        }
        
        // 加载隐私协议
        if (this.privacyAgreementTextAsset) {
            // 优先使用绑定的TextAsset
            this.privacyAgreementContent = this.privacyAgreementTextAsset.text;
            console.log("隐私协议加载成功（通过绑定的TextAsset）");
        } else {
            // 如果没有绑定TextAsset，则尝试从resources加载
            resources.load("隐私协议", TextAsset, (err, asset) => {
                if (!err && asset) {
                    this.privacyAgreementContent = asset.text;
                    console.log("隐私协议加载成功（通过resources）");
                } else {
                    console.error("隐私协议加载失败:", err);
                    this.privacyAgreementContent = "";
                }
            });
        }
    }

    /**
     * 开始预加载流程
     */
    private startPreloadProcess() {
        if (this.isPreloadStarted) {
            console.log("预加载已经开始，跳过重复调用");
            return;
        }
        
        this.isPreloadStarted = true;
        console.log("开始预加载协议内容...");
        
        // 延迟执行预加载，避免阻塞页面初始化
        this.scheduleOnce(() => {
            this.loadAgreementContentWithProgress();
        }, this.preloadDelay);
    }

    /**
     * 带进度的协议内容加载
     */
    private loadAgreementContentWithProgress() {
        console.log("执行协议内容预加载...");
        let loadedCount = 0;
        const totalCount = 2; // 用户协议 + 隐私协议
        
        const updateProgress = () => {
            loadedCount++;
            if (loadedCount >= totalCount) {
                this.isPreloadCompleted = true;
                console.log("协议内容预加载完成！");
            }
        };

        // 加载用户服务协议
        if (this.userAgreementTextAsset) {
            // 优先使用绑定的TextAsset（同步加载）
            this.userAgreementContent = this.userAgreementTextAsset.text;
            this.isUserAgreementLoaded = true;
            console.log("用户服务协议预加载成功（通过绑定的TextAsset）");
            updateProgress();
        } else {
            // 如果没有绑定TextAsset，则尝试从resources加载
            resources.load("用户服务协议", TextAsset, (err, asset) => {
                if (!err && asset) {
                    this.userAgreementContent = asset.text;
                    this.isUserAgreementLoaded = true;
                    console.log("用户服务协议预加载成功（通过resources）");
                } else {
                    console.error("用户服务协议预加载失败:", err);
                    this.userAgreementContent = "";
                    this.isUserAgreementLoaded = false;
                }
                updateProgress();
            });
        }
        
        // 加载隐私协议
        if (this.privacyAgreementTextAsset) {
            // 优先使用绑定的TextAsset（同步加载）
            this.privacyAgreementContent = this.privacyAgreementTextAsset.text;
            this.isPrivacyAgreementLoaded = true;
            console.log("隐私协议预加载成功（通过绑定的TextAsset）");
            updateProgress();
        } else {
            // 如果没有绑定TextAsset，则尝试从resources加载
            resources.load("隐私协议", TextAsset, (err, asset) => {
                if (!err && asset) {
                    this.privacyAgreementContent = asset.text;
                    this.isPrivacyAgreementLoaded = true;
                    console.log("隐私协议预加载成功（通过resources）");
                } else {
                    console.error("隐私协议预加载失败:", err);
                    this.privacyAgreementContent = "";
                    this.isPrivacyAgreementLoaded = false;
                }
                updateProgress();
            });
        }
    }

    /**
     * 单独加载用户协议
     * @param callback 加载完成后的回调函数
     */
    private loadUserAgreement(callback?: () => void) {
        if (this.userAgreementTextAsset) {
            // 优先使用绑定的TextAsset
            this.userAgreementContent = this.userAgreementTextAsset.text;
            console.log("用户协议重新加载成功（通过绑定的TextAsset）");
            if (callback) callback();
        } else {
            // 如果没有绑定TextAsset，则尝试从resources加载
            resources.load("用户服务协议", TextAsset, (err, asset) => {
                if (!err && asset) {
                    this.userAgreementContent = asset.text;
                    console.log("用户协议重新加载成功（通过resources）");
                } else {
                    console.error("用户协议重新加载失败:", err);
                    this.userAgreementContent = "";
                }
                if (callback) callback();
            });
        }
    }

    /**
     * 单独加载隐私协议
     * @param callback 加载完成后的回调函数
     */
    private loadPrivacyAgreement(callback?: () => void) {
        if (this.privacyAgreementTextAsset) {
            // 优先使用绑定的TextAsset
            this.privacyAgreementContent = this.privacyAgreementTextAsset.text;
            console.log("隐私协议重新加载成功（通过绑定的TextAsset）");
            if (callback) callback();
        } else {
            // 如果没有绑定TextAsset，则尝试从resources加载
            resources.load("隐私协议", TextAsset, (err, asset) => {
                if (!err && asset) {
                    this.privacyAgreementContent = asset.text;
                    console.log("隐私协议重新加载成功（通过resources）");
                } else {
                    console.error("隐私协议重新加载失败:", err);
                    this.privacyAgreementContent = "";
                }
                if (callback) callback();
            });
        }
    }

    /**
     * 确保协议内容已准备就绪
     */
    private ensureContentReady() {
        // 检查用户协议内容是否已加载
        if (!this.userAgreementContent) {
            console.warn("用户协议内容尚未加载完成");
        }
        
        // 检查隐私协议内容是否已加载
        if (!this.privacyAgreementContent) {
            console.warn("隐私协议内容尚未加载完成");
        }
    }

    /**
     * 绑定事件
     */
    private bindEvents() {
        // 用户协议按钮事件
        if (this.userAgreementBtn) {
            this.userAgreementBtn.node.on(Button.EventType.CLICK, this.onShowUserAgreement, this);
        }
        
        // 隐私协议按钮事件
        if (this.privacyAgreementBtn) {
            this.privacyAgreementBtn.node.on(Button.EventType.CLICK, this.onShowPrivacyAgreement, this);
        }
        
        // 关闭协议按钮事件
        if (this.closeAgreementBtn) {
            this.closeAgreementBtn.node.on(Button.EventType.CLICK, this.onCloseAgreement, this);
        }
    }

    /**
     * 显示用户协议（预加载优化版本）
     */
    private onShowUserAgreement() {
        // 立即显示弹窗框架，避免等待感
        this.showAgreementDialogFast("用户服务协议", "");
        
        if (this.isUserAgreementLoaded && this.userAgreementContent) {
            // 内容已预加载，瞬间显示
            this.updateAgreementContentOptimized(this.userAgreementContent);
            console.log("用户协议显示完成（预加载内容，瞬间显示）");
        } else {
            console.warn("用户协议内容未预加载，启动即时加载...");
            this.updateAgreementContentOptimized("正在加载协议内容...");
            
            // 启动即时加载
            this.loadUserAgreement(() => {
                if (this.userAgreementContent) {
                    this.updateAgreementContentOptimized(this.userAgreementContent);
                    console.log("用户协议显示完成（即时加载）");
                } else {
                    this.updateAgreementContentOptimized("协议内容加载失败，请检查网络连接或稍后重试。");
                }
            });
        }
    }

    /**
     * 显示隐私协议（预加载优化版本）
     */
    private onShowPrivacyAgreement() {
        // 立即显示弹窗框架，避免等待感
        this.showAgreementDialogFast("隐私政策", "");
        
        if (this.isPrivacyAgreementLoaded && this.privacyAgreementContent) {
            // 内容已预加载，瞬间显示
            this.updateAgreementContentOptimized(this.privacyAgreementContent);
            console.log("隐私协议显示完成（预加载内容，瞬间显示）");
        } else {
            console.warn("隐私协议内容未预加载，启动即时加载...");
            this.updateAgreementContentOptimized("正在加载协议内容...");
            
            // 启动即时加载
            this.loadPrivacyAgreement(() => {
                if (this.privacyAgreementContent) {
                    this.updateAgreementContentOptimized(this.privacyAgreementContent);
                    console.log("隐私协议显示完成（即时加载）");
                } else {
                    this.updateAgreementContentOptimized("协议内容加载失败，请检查网络连接或稍后重试。");
                }
            });
        }
    }

    /**
     * 显示协议弹窗
     * @param title 协议标题
     * @param content 协议内容
     * @param type 协议类型
     * @param skipAnimation 是否跳过切换动画，立即显示
     */
    public showAgreementDialog(title: string, content: string, type?: string, skipAnimation: boolean = false) {
        // 如果弹窗已经显示且不跳过动画，使用平滑切换
        if (this.agreementDialogNode && this.agreementDialogNode.active && !skipAnimation) {
            this.smoothSwitchContent(title, content, type);
            return;
        }
        
        // 首次显示弹窗或跳过动画，直接更新
        this.updateAgreementTitle(title);
        this.updateAgreementContent(content);
        
        // 显示协议弹窗
        if (this.agreementDialogNode) {
            this.agreementDialogNode.active = true;
            console.log(`显示协议弹窗: ${title}${skipAnimation ? '（快速模式）' : ''}`);
            
            // 立即重置滚动位置，无延迟
            this.resetScrollToTop();
        } else {
            console.warn("协议弹窗节点未配置，无法显示弹窗");
        }
        
        // 如果有协议类型，做相应处理
        if (type) {
            this.onAgreementTypeChanged(type);
        }
    }

    /**
     * 隐藏协议弹窗
     */
    public hideAgreementDialog() {
        if (this.agreementDialogNode) {
            this.agreementDialogNode.active = false;
            console.log("隐藏协议弹窗");
        }
    }

    /**
     * 关闭协议弹窗事件
     */
    private onCloseAgreement() {
        this.hideAgreementDialog();
    }

    /**
     * 更新协议标题
     * @param title 新的标题
     */
    public updateAgreementTitle(title: string) {
        if (this.agreementTitleLabel) {
            this.agreementTitleLabel.string = title;
            console.log(`协议标题已更新为: ${title}`);
        } else {
            console.warn("协议标题Label未配置");
        }
    }

    /**
     * 设置协议内容RichText的属性
     */
    private setupContentRichTextProperties() {
        if (this.agreementContentRichText) {
            // RichText 自动支持换行和滚动，无需设置溢出模式
            console.log("协议内容RichText已准备就绪");
        } else {
            console.warn("协议内容RichText未配置");
        }
    }

    /**
     * 重置滚动位置到顶部
     */
    private resetScrollToTop() {
        // 方法1：如果有ScrollView组件，直接重置其滚动位置
        if (this.agreementScrollView) {
            this.agreementScrollView.scrollToTop(0); // 立即滚动到顶部，无动画
            console.log("ScrollView滚动位置已重置到顶部");
            return;
        }

        // 方法2：尝试从RichText节点的父节点中查找ScrollView
        if (this.agreementContentRichText && this.agreementContentRichText.node) {
            let currentNode = this.agreementContentRichText.node.parent;
            
            // 向上查找最多3层来寻找ScrollView组件
            for (let i = 0; i < 3 && currentNode; i++) {
                const scrollView = currentNode.getComponent(ScrollView);
                if (scrollView) {
                    scrollView.scrollToTop(0); // 立即滚动到顶部，无动画
                    console.log("自动找到的ScrollView滚动位置已重置到顶部");
                    return;
                }
                currentNode = currentNode.parent;
            }
        }

        console.log("未找到ScrollView组件，无法重置滚动位置");
    }

    /**
     * 平滑切换内容（避免突变）
     * @param title 新标题
     * @param content 新内容
     * @param type 协议类型
     */
    private smoothSwitchContent(title: string, content: string, type?: string) {
        if (!this.agreementContentRichText || !this.agreementContentRichText.node) {
            // 如果没有RichText组件，直接更新
            this.updateAgreementTitle(title);
            this.updateAgreementContent(content);
            if (type) {
                this.onAgreementTypeChanged(type);
            }
            return;
        }

        const richTextNode = this.agreementContentRichText.node;
        let uiOpacity = richTextNode.getComponent(UIOpacity);
        
        // 如果没有UIOpacity组件，自动添加
        if (!uiOpacity) {
            uiOpacity = richTextNode.addComponent(UIOpacity);
        }

        console.log(`平滑切换到: ${title}`);

        // 步骤1：快速淡出当前内容
        tween(uiOpacity)
            .to(0.08, { opacity: 0 })
            .call(() => {
                // 步骤2：在完全透明时先重置滚动位置
                this.resetScrollToTop();
                
                // 步骤3：更新内容
                this.updateAgreementTitle(title);
                this.updateAgreementContent(content);
                
                if (type) {
                    this.onAgreementTypeChanged(type);
                }
            })
            .to(0.08, { opacity: 255 }) // 步骤4：快速淡入新内容
            .start();
    }

    /**
     * 平滑切换富文本内容
     * @param richTextContent 新的富文本内容
     */
    private smoothSwitchRichTextContent(richTextContent: string) {
        if (!this.agreementContentRichText || !this.agreementContentRichText.node) {
            return;
        }

        const richTextNode = this.agreementContentRichText.node;
        let uiOpacity = richTextNode.getComponent(UIOpacity);
        
        // 如果没有UIOpacity组件，自动添加
        if (!uiOpacity) {
            uiOpacity = richTextNode.addComponent(UIOpacity);
        }

        console.log("平滑切换富文本内容");

        // 步骤1：快速淡出当前内容
        tween(uiOpacity)
            .to(0.08, { opacity: 0 })
            .call(() => {
                // 步骤2：在完全透明时先重置滚动位置
                this.resetScrollToTop();
                
                // 步骤3：更新内容
                this.renderContentInChunks(richTextContent);
                console.log("内容已平滑更新");
            })
            .to(0.08, { opacity: 255 }) // 步骤4：快速淡入新内容
            .start();
    }

    /**
     * 更新协议内容
     * @param content 新的内容
     */
    public updateAgreementContent(content: string) {
        // 使用分块渲染，避免一次性渲染过长文本造成卡顿
        this.renderContentInChunks(content);
    }

    /**
     * 性能优化版本的内容更新（优先使用Label，大文本性能更好）
     * @param content 新的内容
     */
    public updateAgreementContentOptimized(content: string) {
        // 统一走分块渲染逻辑
        this.renderContentInChunks(content);
    }

    /**
     * 按段渲染长文本至多个 Label 节点，参考 PrivacyPolicyViewer 的实现
     * @param content 完整协议文本
     */
    private renderContentInChunks(content: string) {
        if (!content) return;

        // 1. 选取容器节点：优先使用 ScrollView.content，其次使用原 Label 的父节点
        let containerNode: Node | null = null;
        if (this.agreementScrollView && this.agreementScrollView.content) {
            containerNode = this.agreementScrollView.content;
        } else if (this.agreementContentRichText && this.agreementContentRichText.node) {
            containerNode = this.agreementContentRichText.node.parent;
        }

        if (!containerNode) {
            console.warn("未找到用于渲染协议内容的容器节点");
            return;
        }

        // 清空旧内容
        containerNode.removeAllChildren();

        // 宽度与排版参数
        const padding = this.sidePadding;
        // 使用固定宽度（contentWidth），不再根据父节点宽度自动适配
        const containerWidth = this.contentWidth;
        const containerTransform = containerNode.getComponent(UITransform) || containerNode.addComponent(UITransform);
        containerTransform.anchorX = 0;
        containerTransform.anchorY = 1;
        containerTransform.setContentSize(new Size(containerWidth, 10));
        containerNode.setPosition(0, 0);

        // 启用 Layout 自动排列，避免位置累计误差
        let layout = containerNode.getComponent(Layout);
        if (!layout) layout = containerNode.addComponent(Layout);
        layout.type = Layout.Type.VERTICAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
        layout.paddingLeft = padding;
        layout.paddingRight = padding;
        layout.paddingTop = padding;
        layout.spacingY = 8;

        const labelWidth = containerWidth - padding * 2;

        // 基础样式参考模板 Label
        const baseFontSize = this.agreementContentRichText ? this.agreementContentRichText.fontSize : 24;
        const baseColor = this.agreementContentRichText ? this.agreementContentRichText.color : new Color(0, 0, 0, 255);

        // 2. 按段切分文本（段落 + 字数阈值）
        const MAX_CHARS = Math.max(100, this.maxCharsPerChunk || 600); // 保底 100
        const paragraphs = content.split(/\n\s*\n/);
        const chunks: string[] = [];

        let buffer = "";
        const pushBuffer = () => {
            if (buffer.length > 0) {
                chunks.push(buffer);
                buffer = "";
            }
        };

        paragraphs.forEach((para, idx) => {
            // 若单个段落超长，直接按 MAX_CHARS 切片
            if (para.length > MAX_CHARS) {
                // 先把之前累积的 buffer 推入
                pushBuffer();
                let start = 0;
                while (start < para.length) {
                    chunks.push(para.slice(start, start + MAX_CHARS));
                    start += MAX_CHARS;
                }
            } else {
                if (buffer.length + para.length + 2 > MAX_CHARS) {
                    // 放不下，先推入已有 buffer
                    pushBuffer();
                }
                buffer += (buffer ? "\n\n" : "") + para;
            }
            // 最后一段：如果是最后一个 paragraph，则把剩余 buffer 推入
            if (idx === paragraphs.length - 1) {
                pushBuffer();
            }
        });

        // 3. 逐段创建 Label
        chunks.forEach((txt, idx) => {
            const labelNode = new Node(`ContentLabel_${idx}`);
            containerNode!.addChild(labelNode);

            const labelTransform = labelNode.addComponent(UITransform);
            labelTransform.anchorX = 0;
            labelTransform.anchorY = 1;
            labelTransform.setContentSize(labelWidth, 0);

            const label = labelNode.addComponent(Label);
            label.useSystemFont = true;
            label.fontSize = baseFontSize;
            label.color = baseColor;
            label.overflow = Label.Overflow.RESIZE_HEIGHT;
            label.cacheMode = Label.CacheMode.CHAR;
            label.horizontalAlign = Label.HorizontalAlign.LEFT;
            label.verticalAlign = Label.VerticalAlign.TOP;
            label.lineHeight = baseFontSize * 1.4;
            label.string = txt;
        });

        // Layout 启用后，高度自动计算；等待一帧后让 ScrollView 回到顶部
        if (this.agreementScrollView) {
            this.scheduleOnce(() => {
                this.agreementScrollView.scrollToTop(0);
            }, 0);
        }
    }

    /**
     * 协议类型改变时的处理
     * @param type 协议类型
     */
    private onAgreementTypeChanged(type: string) {
        // 可以根据不同的协议类型做不同的UI处理
        switch (type) {
            case this.AgreementType.USER_AGREEMENT:
                console.log("当前显示用户服务协议");
                break;
            case this.AgreementType.PRIVACY_AGREEMENT:
                console.log("当前显示隐私政策");
                break;
            default:
                console.log("显示自定义协议");
                break;
        }
    }

    /**
     * 外部调用：设置协议内容
     * @param userContent 用户协议内容
     * @param privacyContent 隐私协议内容
     */
    public setAgreementContent(userContent: string, privacyContent: string) {
        this.userAgreementContent = userContent;
        this.privacyAgreementContent = privacyContent;
        console.log("协议内容已通过外部设置更新");
    }

    /**
     * 外部调用：设置协议TextAsset资源
     * @param userTextAsset 用户协议TextAsset
     * @param privacyTextAsset 隐私协议TextAsset
     */
    public setAgreementTextAssets(userTextAsset: TextAsset, privacyTextAsset: TextAsset) {
        if (userTextAsset) {
            this.userAgreementTextAsset = userTextAsset;
            this.userAgreementContent = userTextAsset.text;
            console.log("用户协议TextAsset已设置");
        }
        
        if (privacyTextAsset) {
            this.privacyAgreementTextAsset = privacyTextAsset;
            this.privacyAgreementContent = privacyTextAsset.text;
            console.log("隐私协议TextAsset已设置");
        }
    }

    /**
     * 外部调用：直接设置富文本内容（不进行格式化处理）
     * @param richTextContent 已格式化的富文本内容
     */
    public setRichTextContent(richTextContent: string) {
        if (!this.agreementContentRichText) {
            console.warn("协议内容Label未配置");
            return;
        }

        // 如果弹窗已显示，使用平滑淡入淡出切换
        if (this.agreementDialogNode && this.agreementDialogNode.active) {
            this.smoothSwitchRichTextContent(richTextContent);
        } else {
            // 直接渲染
            this.renderContentInChunks(richTextContent);
            console.log("协议内容已设置");
        }
    }

    /**
     * 外部调用：显示指定类型的协议
     * @param type 协议类型 ('user' | 'privacy')
     */
    public showAgreementByType(type: string) {
        switch (type) {
            case this.AgreementType.USER_AGREEMENT:
                this.onShowUserAgreement();
                break;
            case this.AgreementType.PRIVACY_AGREEMENT:
                this.onShowPrivacyAgreement();
                break;
            default:
                console.warn("未知的协议类型:", type);
                break;
        }
    }

    /**
     * 外部调用：快速显示协议（支持自定义内容）
     * @param title 协议标题
     * @param content 协议内容
     * @param type 协议类型（可选）
     */
    public showCustomAgreement(title: string, content: string, type?: string) {
        this.showAgreementDialog(title, content, type);
    }

    /**
     * 外部调用：手动重置滚动位置到顶部
     */
    public resetScrollPosition() {
        this.resetScrollToTop();
    }

    /**
     * 快速显示协议弹窗（无动画，即时显示）
     * @param title 协议标题
     * @param content 协议内容
     * @param type 协议类型
     */
    public showAgreementDialogFast(title: string, content: string, type?: string) {
        this.showAgreementDialog(title, content, type, true);
    }

    /**
     * 获取当前显示的协议类型
     */
    public getCurrentAgreementType(): string {
        if (this.agreementTitleLabel) {
            const title = this.agreementTitleLabel.string;
            if (title.includes("用户") || title.includes("服务")) {
                return this.AgreementType.USER_AGREEMENT;
            } else if (title.includes("隐私") || title.includes("政策")) {
                return this.AgreementType.PRIVACY_AGREEMENT;
            }
        }
        
        return "custom";
    }
} 