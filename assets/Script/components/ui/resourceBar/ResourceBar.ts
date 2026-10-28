import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;
import {GameEvent, GlobalEvent} from '../../../GlobalEvent';
import {Inventory} from '../../../model/Inventory';
import {ConfigLoader} from '../../../configs/ConfigLoader';
import {IStatSource} from '../../../services/stats/IStatSource';
import {StatSourceRegistry} from '../../../services/stats/StatSourceRegistry';
import {ResourceBarEntry} from './ResourceBarEntry';
import {ResourceBarItem} from './ResourceBarItem';

interface BoundItem {
    entry: ResourceBarEntry;
    source: IStatSource;
    item: ResourceBarItem;
}

/**
 * Ресурс-бар: строит элементы по записям из инспектора и держит их значения актуальными.
 * Состав и порядок задаются массивом entries в префабе сцены.
 * Сам не знает про шахтёров и ресурсы: значения берутся из источников статистики.
 */
@ccclass
export class ResourceBar extends cc.Component {
    @property([ResourceBarEntry])
    private entries: ResourceBarEntry[] = [];

    @property(cc.Prefab)
    private itemPrefab: cc.Prefab = null;

    @property(cc.Node)
    private container: cc.Node = null;

    private _items: BoundItem[] = [];
    private _subscribedEvents: string[] = [];

    protected onLoad() {
        if (!this.itemPrefab || !this.container) {
            cc.error('ResourceBar.onLoad(): itemPrefab or container not assigned');
            return;
        }

        if (this.isReady()) {
            this.rebuild();
        } else {
            GlobalEvent.on(GameEvent.GAME_INITIALIZED, this.rebuild, this);
        }
    }

    protected onDestroy() {
        GlobalEvent.off(GameEvent.GAME_INITIALIZED, this.rebuild, this);
        this.unsubscribeChanges();
    }

    /** Заменяет состав бара в рантайме. */
    public setEntries(entries: ResourceBarEntry[]) {
        this.entries = entries;
        if (this.isReady()) {
            this.rebuild();
        }
    }

    /** Пересчитывает значения всех элементов из источников. */
    public refresh() {
        for (const bound of this._items) {
            bound.item.setValue(bound.source.getValue(bound.entry.id));
        }
    }

    private isReady(): boolean {
        return Inventory.instance.isInitialized && ConfigLoader.instance.isLoaded;
    }

    private rebuild() {
        this.unsubscribeChanges();
        this.clearItems();

        for (const entry of this.entries) {
            if (!entry || !entry.id) {
                continue;
            }

            const source = StatSourceRegistry.get(entry.kind);
            const node = cc.instantiate(this.itemPrefab);
            this.container.addChild(node);

            const worldPos = node.parent.convertToWorldSpaceAR(node.position);
            cc.log(`ResourceBar item: active=${node.activeInHierarchy}, ` +
                `size=${node.width}x${node.height}, ` +
                `worldPos=(${worldPos.x.toFixed(0)}, ${worldPos.y.toFixed(0)}), ` +
                `opacity=${node.opacity}, siblingIndex=${node.getSiblingIndex()}`);

            const item = node.getComponent(ResourceBarItem);
            if (!item) {
                cc.error('ResourceBar.rebuild(): itemPrefab has no ResourceBarItem');
                node.destroy();
                continue;
            }

            item.setIconKey(source.getIconKey(entry.id));
            this._items.push({entry, source, item});
        }

        this.subscribeChanges();
        this.refresh();
    }

    private clearItems() {
        for (const bound of this._items) {
            bound.item.node.destroy();
        }
        this._items = [];
    }

    private subscribeChanges() {
        const events = new Set<string>(this._items.map(bound => bound.source.changeEvent));
        events.forEach(eventName => {
            GlobalEvent.on(eventName, this.refresh, this);
            this._subscribedEvents.push(eventName);
        });
    }

    private unsubscribeChanges() {
        for (const eventName of this._subscribedEvents) {
            GlobalEvent.off(eventName, this.refresh, this);
        }
        this._subscribedEvents = [];
    }
}