import {MineWorker, MineWorkerSaveData, MineWorkerTypes} from "./Worker";
import {Utils} from "../../utils/Utils";
import {WorkerConfigLoader} from "../../configs/WorkerConfigLoader";

export class Miner implements MineWorker {
    private _key: string;

    constructor() {
        this._key = Utils.buildName('MineWorker', 'Miner');
    }

    serialize(): MineWorkerSaveData {
        return {
            type: MineWorkerTypes.MINER
        }
    }

    public get configId(): string {
        return 'miner';
    }

    public get key() {
        return this._key;
    }

    public get type() {
        return MineWorkerTypes.MINER;
    }

    public get goldPerSecond() {
        return WorkerConfigLoader.instance.getConfig('miner').goldPerSecond;
    }

    public get defaultPrice() {
        return WorkerConfigLoader.instance.getConfig('miner').basePrice;
    }
}