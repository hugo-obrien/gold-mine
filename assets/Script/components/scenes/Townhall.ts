import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;
import {GameManager} from "../../managers/GameManager";
import {GameEvent, GlobalEvent} from "../../GlobalEvent";
import {Utils} from "../../utils/Utils";

@ccclass
export default class Townhall extends cc.Component {
    @property(cc.Label)
    incomeLabel: cc.Label = null;

    protected onLoad() {
        GlobalEvent.on(GameEvent.INCOME_CHANGED, this.onIncomeChanged, this);
        this.updateIncome();
    }

    protected onDestroy() {
        GlobalEvent.off(GameEvent.INCOME_CHANGED, this.onIncomeChanged, this);
    }

    private onIncomeChanged() {
        this.updateIncome();
    }

    private updateIncome() {
        if (this.incomeLabel) {
            let income = GameManager.instance.goldPerSecond;
            this.incomeLabel.string = Utils.formatValue(income);
        }
    }
}