import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;

/**
 * Одна запись реестра иконок: читаемый ключ из конфигов (workers/resources)
 * и спрайт-кадр, который контент-менеджер перетаскивает мышкой.
 */
@ccclass('IconMapping')
export class IconMapping {
    @property
    public key: string = '';

    @property(cc.SpriteFrame)
    public spriteFrame: cc.SpriteFrame = null;
}