import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;
import {SpriteFrameProvider} from "../../services/SpriteFrameProvider";

/**
 * Переиспользуемый UI-компонент: кладёт на свою ноду спрайт-иконку по ключу из
 * конфигов. Достаточно повесить cc.Sprite + IconView и задать iconKey.
 * Если ключ не зарезолвлен, провайдер вернёт magenta-заглушку (с warn).
 */
@ccclass
export class IconView extends cc.Component {
    @property
    public iconKey: string = '';

    @property({type: cc.SpriteFrame, tooltip: 'Optional override frame; falls back to provider lookup'})
    private manualFrame: cc.SpriteFrame = null;

    protected async onLoad() {
        if (!this.iconKey && !this.manualFrame) {
            return;
        }

        if (!this.manualFrame) {
            await SpriteFrameProvider.instance.load();
        }

        this.apply();
    }

    public setIconKey(key: string) {
        this.iconKey = key;
        this.apply();
    }

    private apply() {
        const sprite = this.getComponent(cc.Sprite);
        if (!sprite) {
            return;
        }

        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = this.manualFrame || SpriteFrameProvider.instance.getSpriteFrame(this.iconKey);
    }
}