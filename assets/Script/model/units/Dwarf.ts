import {MineWorker, MineWorkerSaveData, MineWorkerTypes} from "./Worker";
import {Utils} from "../../utils/Utils";
import {WorkerConfigLoader} from "../../configs/WorkerConfigLoader";

export class Dwarf implements MineWorker {
    private _key: string;

    constructor() {
        this._key = Utils.buildName('MineWorker', 'Dwarf');
    }

    serialize(): MineWorkerSaveData {
        return {
            type: MineWorkerTypes.DWARF
        }
    }

    public get configId(): string {
        return 'dwarf';
    }

    public get key() {
        return this._key;
    }

    public get type() {
        return MineWorkerTypes.DWARF;
    }

    public get goldPerSecond() {
        return WorkerConfigLoader.instance.getConfig('dwarf').goldPerSecond;
    }

    public get defaultPrice() {
        return WorkerConfigLoader.instance.getConfig('dwarf').basePrice;
    }
}