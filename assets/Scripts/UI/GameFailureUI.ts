import { _decorator, Component, Node, Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameFailureUI')
export class GameFailureUI extends Component {
    
    @property(Button)
    public restartButton: Button = null!;
    
    @property(Button)
    public closeButton: Button = null!;
    
    private restartCallback: (() => void) | null = null;
    
    onLoad() {
        this.setupButtons();
    }
    
    private setupButtons(): void {
        if (this.restartButton) {
            this.restartButton.node.on(Button.EventType.CLICK, this.onRestartClick, this);
        }
        
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onCloseClick, this);
        }
    }
    
    public setRestartCallback(callback: () => void): void {
        this.restartCallback = callback;
    }
    
    private onRestartClick(): void {
        if (this.restartCallback) {
            this.restartCallback();
        } else {
            console.warn('GameFailureUI: 重新开始回调未设置');
        }
    }
    
    private onCloseClick(): void {
        this.hide();
    }
    
    public show(): void {
        this.node.active = true;
    }
    
    public hide(): void {
        this.node.active = false;
    }
    
    onDestroy(): void {
        if (this.restartButton) {
            this.restartButton.node.off(Button.EventType.CLICK, this.onRestartClick, this);
        }
        if (this.closeButton) {
            this.closeButton.node.off(Button.EventType.CLICK, this.onCloseClick, this);
        }
    }
}



