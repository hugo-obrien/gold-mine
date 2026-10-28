import {IStatSource} from "./IStatSource";
import {StatKind} from "./StatKind";
import {ResourceStatSource} from "./ResourceStatSource";
import {WorkerStatSource} from "./WorkerStatSource";

/**
 * Реестр источников статистики для ресурс-бара.
 * Чтобы добавить новый вид статистики, создайте источник и зарегистрируйте его здесь.
 */
export class StatSourceRegistry {
    private static readonly _sources: Map<StatKind, IStatSource> = new Map<StatKind, IStatSource>([
        [StatKind.RESOURCE, new ResourceStatSource()],
        [StatKind.WORKER, new WorkerStatSource()],
    ]);

    public static get(kind: StatKind): IStatSource {
        const source = this._sources.get(kind);
        if (!source) {
            throw new Error(`StatSourceRegistry.get(${kind}): source is not registered`);
        }
        return source;
    }
}