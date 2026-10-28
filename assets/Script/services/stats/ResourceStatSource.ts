import {IStatSource} from "./IStatSource";
import {StatKind} from "./StatKind";
import {Inventory} from "../../model/Inventory";
import {ResourceConfigLoader} from "../../configs/ResourceConfigLoader";
import {GameEvent} from "../../GlobalEvent";

export class ResourceStatSource implements IStatSource {
    public readonly kind: StatKind = StatKind.RESOURCE;
    public readonly changeEvent: string = GameEvent.RESOURCE_CHANGED;

    public getValue(id: string): number {
        return Inventory.instance.getAmount(id);
    }

    public getIconKey(id: string): string {
        return ResourceConfigLoader.instance.getConfig(id).icon;
    }
}