import {MineWorker, MineWorkerSaveData, MineWorkerTypes} from "../model/units/Worker";
import {Miner} from "../model/units/Miner";
import {Dwarf} from "../model/units/Dwarf";

export class MineWorkerFactory {
    public static createByData(data: MineWorkerSaveData): MineWorker | null {
        switch (data.type) {
            case MineWorkerTypes.MINER: return new Miner();
            case MineWorkerTypes.DWARF: return new Dwarf();
            default:
                cc.warn(`MineWorker for type ${data.type} not defined`);
                return null;
        }
    }

    public static createByType(type: MineWorkerTypes): MineWorker | null {
        switch (type) {
            case MineWorkerTypes.MINER: return new Miner();
            case MineWorkerTypes.DWARF: return new Dwarf();
            default:
                cc.warn(`MineWorker for type ${type} not defined`);
                return null;
        }
    }
}