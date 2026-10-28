import ccclass = cc._decorator.ccclass;
import {GameManager} from "../../managers/GameManager";
import {GameEvent, GlobalEvent} from "../../GlobalEvent";
import {WorkerConfigLoader} from "../../configs/WorkerConfigLoader";
import {WorkerConfig} from "../../configs/WorkerConfig";
import {IconView} from "../ui/IconView";
import {MineWorkerTypes} from "../../model/units/Worker";
import {Utils} from "../../utils/Utils";

interface WorkerRow {
    node: cc.Node;
    configId: string;
    countLabel: cc.Label;
    priceLabel: cc.Label;
    buyButton: cc.Button;
    buyNode: cc.Node;
}

@ccclass
export class WorkersScreen extends cc.Component {
    private readonly _rowHeight = 130;
    private _rows: WorkerRow[] = [];

    protected onLoad() {
        if (!WorkerConfigLoader.instance.isLoaded) {
            cc.error('WorkersScreen.onLoad(): worker configs not loaded');
            return;
        }

        this.buildUi();
        GlobalEvent.on(GameEvent.WORKERS_CHANGED, this.refreshAll, this);
        GlobalEvent.on(GameEvent.INCOME_CHANGED, this.refreshAll, this);
        GlobalEvent.on(GameEvent.RESOURCE_CHANGED, this.onResourceChanged, this);
        this.refreshAll();
    }

    protected onDestroy() {
        GlobalEvent.off(GameEvent.WORKERS_CHANGED, this.refreshAll, this);
        GlobalEvent.off(GameEvent.INCOME_CHANGED, this.refreshAll, this);
        GlobalEvent.off(GameEvent.RESOURCE_CHANGED, this.onResourceChanged, this);
    }

    private buildUi() {
        const configs = WorkerConfigLoader.instance.getAllConfigs();
        const width = 760;

        for (let i = 0; i < configs.length; i++) {
            const config = configs[i];
            const row = new cc.Node(`row_${config.id}`);
            row.setPosition(0, 220 - i * this._rowHeight);
            this.node.addChild(row);

            this.createIcon(row, config.icon, new cc.Vec2(-width / 2 + 56, 0));
            this.createText(row, 'name', config.nameKey || config.id, new cc.Vec2(-width / 2 + 130, 0), 42, cc.Color.WHITE, true);
            const countLabel = this.createText(row, 'count', '', new cc.Vec2(-width / 2 + 300, 0), 34, cc.Color.WHITE, false);
            const priceLabel = this.createText(row, 'price', '', new cc.Vec2(-width / 2 + 470, 0), 34, cc.Color.WHITE, false);
            const buyNode = this.createBuyButton(row, `buy_${config.id}`, new cc.Vec2(width / 2 - 120, 0), () => this.onBuy(config));
            const buyButton = buyNode.getComponent(cc.Button);

            this._rows.push({
                node: row,
                configId: config.id,
                countLabel: countLabel,
                priceLabel: priceLabel,
                buyButton: buyButton,
                buyNode: buyNode
            });
        }
    }

    private createIcon(parent: cc.Node, iconKey: string, pos: cc.Vec2) {
        const node = new cc.Node('icon');
        node.setPosition(pos);
        node.width = 56;
        node.height = 56;
        parent.addChild(node);

        const sprite = node.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        const iconView = node.addComponent(IconView);
        iconView.setIconKey(iconKey);
    }

    private createText(parent: cc.Node, name: string, text: string, pos: cc.Vec2, size: number, color: cc.Color, bold: boolean): cc.Label {
        const node = new cc.Node(name);
        node.setPosition(pos);
        parent.addChild(node);
        const label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.node.color = color;
        label.enableWrapText = false;
        return label;
    }

    private createBuyButton(parent: cc.Node, name: string, pos: cc.Vec2, onClick: () => void): cc.Node {
        const node = new cc.Node(name);
        node.setPosition(pos);
        node.width = 120;
        node.height = 48;
        parent.addChild(node);

        const bg = new cc.Node('Background');
        node.addChild(bg);
        const graphics = bg.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(74, 144, 217, 255);
        graphics.rect(-60, -24, 120, 48);
        graphics.fill();

        const labelNode = new cc.Node('Label');
        node.addChild(labelNode);
        const label = labelNode.addComponent(cc.Label);
        label.string = 'Hire';
        label.fontSize = 26;
        label.lineHeight = 30;
        label.node.color = cc.Color.WHITE;

        const button = node.addComponent(cc.Button);
        button.transition = cc.Button.Transition.SCALE;
        button.zoomScale = 0.95;
        button.target = node;
        node.on(cc.Node.EventType.TOUCH_END, onClick, this);

        return node;
    }

    private onBuy(config: WorkerConfig) {
        const type = this.typeFromConfigId(config.id);
        const price = GameManager.instance.getNextWorkerPrice(config.id);
        if (GameManager.instance.gold < price) {
            return;
        }
        GameManager.instance.buyWorker(type);
    }

    private typeFromConfigId(id: string): MineWorkerTypes {
        switch (id) {
            case 'miner': return MineWorkerTypes.MINER;
            case 'dwarf': return MineWorkerTypes.DWARF;
            default:
                cc.warn(`WorkersScreen.typeFromConfigId(): no type for ${id}`);
                return MineWorkerTypes.MINER;
        }
    }

    private onResourceChanged(typeId: string, amount: number) {
        if (typeId === 'gold') {
            this.refreshAll();
        }
    }

    private refreshAll() {
        for (const row of this._rows) {
            const count = GameManager.instance.getWorkerCount(row.configId);
            const price = GameManager.instance.getNextWorkerPrice(row.configId);
            const gold = GameManager.instance.gold;
            const canBuy = gold >= price;

            row.countLabel.string = `Hired: ${count}`;
            row.priceLabel.string = `Next: ${Utils.formatValue(price)}`;
            row.buyButton.interactable = canBuy;
            row.buyNode.opacity = canBuy ? 255 : 130;
        }
    }
}