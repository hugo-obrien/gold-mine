import {IStatSource} from "./IStatSource";
import {StatKind} from "./StatKind";
import {GameManager} from "../../managers/GameManager";
import {WorkerConfigLoader} from "../../configs/WorkerConfigLoader";
import {GameEvent} from "../../GlobalEvent";

export class WorkerStatSource implements IStatSource {
    public readonly kind: StatKind = StatKind.WORKER;
    public readonly changeEvent: string = GameEvent.WORKERS_CHANGED;

    public getValue(configId: string): number {
        return GameManager.instance.getWorkerCount(configId);
    }

    public getIconKey(configId: string): string {
        return WorkerConfigLoader.instance.getConfig(configId).icon;
    }
}