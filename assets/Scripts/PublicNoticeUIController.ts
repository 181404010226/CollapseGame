import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PublicNoticeUIController')
export class PublicNoticeUIController extends Component {
    
    @property(Node)
    public publicNoticeUI: Node = null!; // 公告UI面板

    onLoad() {
        // 初始时隐藏公告UI
        this.hidePublicNotice();
    }

    /**
     * 显示公告UI
     */
    public showPublicNotice() {
        if (this.publicNoticeUI) {
            this.publicNoticeUI.active = true;
            console.log('公告UI已显示');
        }
    }

    /**
     * 隐藏公告UI
     */
    public hidePublicNotice() {
        if (this.publicNoticeUI) {
            this.publicNoticeUI.active = false;
            console.log('公告UI已隐藏');
        }
    }
} 