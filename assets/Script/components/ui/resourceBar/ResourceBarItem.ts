import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;
import {IconView} from "../IconView";
import {Utils} from "../../../utils/Utils";

/**
 * Элемент ресурс-бара: иконка и значение.
 * Не знает, откуда берутся данные. Значение и ключ иконки задаёт ResourceBar.
 */
@ccclass
export class ResourceBarItem extends cc.Component {
    @property(IconView)
    private iconView: IconView = null;

    @property(cc.Label)
    private valueLabel: cc.Label = null;

    public setIconKey(iconKey: string) {
        if (!this.iconView) {
            cc.error('ResourceBarItem.setIconKey(): IconView not assigned');
            return;
        }
        this.iconView.setIconKey(iconKey);
    }

    public setValue(value: number) {
        //cc.log(`ResourceBarItem.setValue(${value} for ${this.iconView.iconKey})`);
        if (!this.valueLabel) {
            cc.error('ResourceBarItem.setValue(): Label not assigned');
            return;
        }
        this.valueLabel.string = Utils.formatValue(value);
    }
}