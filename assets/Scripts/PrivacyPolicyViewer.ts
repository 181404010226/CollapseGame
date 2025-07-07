import { _decorator, Component, Node, ScrollView, UITransform, view, Label, TextAsset, Color, Widget, Mask, Size } from 'cc';
const { ccclass, property } = _decorator;

/**
 * PrivacyPolicyViewer
 *
 * Attach this script to an empty Canvas node. It will automatically create a
 * full-screen ScrollView and populate it with the provided TextAsset content
 * so the user can scroll through long privacy policy text.
 */
@ccclass('PrivacyPolicyViewer')
export class PrivacyPolicyViewer extends Component {
    /**
     * Drag the privacy policy .txt (imported as TextAsset) here in the
     * editor. The script will display its content inside the ScrollView.
     */
    @property({ type: TextAsset })
    public privacyText: TextAsset | null = null;

    /** Text color for the label */
    @property({ type: Color })
    public textColor: Color = new Color(0, 0, 0, 255);

    /** Font size for the label */
    @property
    public fontSize: number = 24;

    start() {
        this.createScrollView();
    }

    private createScrollView() {
        const canvasNode = this.node; // The node this script is attached to (Canvas)
        const canvasTransform = canvasNode.getComponent(UITransform);
        if (!canvasTransform) {
            console.warn('PrivacyPolicyViewer should be attached to a UI Canvas node with UITransform.');
            return;
        }

        // Full size of the Canvas
        const canvasSize = canvasTransform.contentSize;

        // --- ScrollView Root Node --------------------------------------------------
        const scrollNode = new Node('PrivacyScrollView');
        canvasNode.addChild(scrollNode);

        // UITransform for sizing
        const scrollTransform = scrollNode.addComponent(UITransform);
        scrollTransform.setContentSize(canvasSize);

        // Make sure the ScrollView fills the parent (Canvas)
        const widget = scrollNode.addComponent(Widget);
        widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
        widget.left = widget.right = widget.top = widget.bottom = 0;

        // Add Mask so the content outside bounds is clipped automatically
        scrollNode.addComponent(Mask);

        // Add ScrollView component (vertical scrolling only)
        const scrollView = scrollNode.addComponent(ScrollView);
        scrollView.horizontal = false;
        scrollView.vertical = true;

        // --- Content Node ----------------------------------------------------------
        const contentNode = new Node('Content');
        scrollNode.addChild(contentNode);
        const contentTransform = contentNode.addComponent(UITransform);

        // Tell ScrollView which node is the content container
        scrollView.content = contentNode;

        // --- Labels -----------------------------------------------------------------
        // Splitting long text into smaller chunks prevents single label from creating
        // an overly large vertex buffer which triggers
        // "Failed to allocate chunk in StaticVBAccessor" errors.

        const padding = 20;
        const labelWidth = canvasSize.width - padding * 2;

        const rawText = this.privacyText ? this.privacyText.text : '--- 未设置隐私政策文本 ---';

        // Heuristic: split by two consecutive newlines first (paragraphs)
        const paragraphs = rawText.split(/\n\s*\n/);

        // We'll merge small paragraphs into chunks up to MAX_CHARS characters.
        const MAX_CHARS = 800; // tweak if needed, keep below 1000 to stay safe
        const chunks: string[] = [];
        let current = '';
        for (const p of paragraphs) {
            if (current.length + p.length + 2 > MAX_CHARS) {
                if (current.length > 0) chunks.push(current);
                current = p;
            } else {
                current += (current ? '\n\n' : '') + p;
            }
        }
        if (current.length > 0) chunks.push(current);

        let cumulativeHeight = 0;
        chunks.forEach((txt, idx) => {
            const labelNode = new Node(`PrivacyLabel_${idx}`);
            contentNode.addChild(labelNode);
            const labelTransform = labelNode.addComponent(UITransform);
            labelTransform.setContentSize(new Size(labelWidth, 0)); // height auto

            const label = labelNode.addComponent(Label);
            label.useSystemFont = true;
            label.color = this.textColor;
            label.fontSize = this.fontSize;
            label.overflow = Label.Overflow.RESIZE_HEIGHT;
            label.cacheMode = Label.CacheMode.CHAR;
            label.lineHeight = this.fontSize * 1.4;
            label.string = txt;

            // Position node below previous chunk
            labelNode.setPosition(padding, -cumulativeHeight);

            // After layout update, record height
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            this.scheduleOnce(() => {
                cumulativeHeight += labelTransform.contentSize.height + this.fontSize * 0.5; // small gap
                // At the end of the last chunk update content size
                if (idx === chunks.length - 1) {
                    contentTransform.setContentSize(new Size(canvasSize.width, cumulativeHeight + padding));
                }
            }, 0);
        });
    }
} 