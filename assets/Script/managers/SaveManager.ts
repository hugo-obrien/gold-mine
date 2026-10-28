import {MineWorkerFactory} from "../services/MineWorkerFactory";
import {MineWorker, MineWorkerSaveData, MineWorkerTypes} from "../model/units/Worker";

export interface ResourceSaveEntry {
    typeId: string;
    amount: number;
}

export interface WorkerSaveEntry {
    type: MineWorkerTypes;
    count: number;
}

export class SaveManager {
    private static _instance: SaveManager;
    public static get instance(): SaveManager {
        if (!this._instance) {
            this._instance = new SaveManager();
        }
        return this._instance;
    }

    private readonly KEY_WORKERS = 'mine_workers';
    private readonly KEY_LAST_TIMESTAMP = 'last_timestamp';
    private readonly KEY_INVENTORY = 'player_inventory';

    public saveInventory(data: ResourceSaveEntry[]) {
        cc.sys.localStorage.setItem(this.KEY_INVENTORY, JSON.stringify(data));
    }

    public loadInventory(): ResourceSaveEntry[] {
        const saved = cc.sys.localStorage.getItem(this.KEY_INVENTORY);
        return saved ? (JSON.parse(saved) as ResourceSaveEntry[]) : [];
    }

    public saveWorkers(workers: MineWorker[]) {
        const counts = new Map<MineWorkerTypes, number>();
        for (const worker of workers) {
            if (!worker) {
                continue;
            }

            counts.set(worker.type, (counts.get(worker.type) || 0) + 1);
        }

        const saveData: WorkerSaveEntry[] = [];
        counts.forEach((count, type) => saveData.push({type, count}));
        cc.sys.localStorage.setItem(this.KEY_WORKERS, JSON.stringify(saveData));
    }

    public loadWorkers(): MineWorker[] {
        const json = cc.sys.localStorage.getItem(this.KEY_WORKERS);
        if (!json) {
            cc.log('SaveManager.loadWorkers(): empty json');
            return [];
        }

        try {
            const rawArray: any[] = JSON.parse(json);
            const result: MineWorker[] = [];
            for (const raw of rawArray) {
                const type = raw.type;
                const worker = MineWorkerFactory.createByData({type} as MineWorkerSaveData);
                if (!worker) {
                    continue;
                }

                const count = typeof raw.count === 'number' ? raw.count : 1;
                for (let i = 0; i < count; i++) {
                    result.push(MineWorkerFactory.createByData({type} as MineWorkerSaveData));
                }
            }
            return result;
        } catch (ex) {
            cc.error('Failed to parse mine workers data:', ex);
            return [];
        }
    }

    public saveLastTimestamp() {
        const now = Date.now();
        cc.sys.localStorage.setItem(this.KEY_LAST_TIMESTAMP, now.toString());
    }

    public loadLastTimestamp(): number {
        const lastTimestamp = cc.sys.localStorage.getItem(this.KEY_LAST_TIMESTAMP);
        return lastTimestamp ? parseInt(lastTimestamp, 10) : Date.now();
    }

    public clearAll() {
        cc.sys.localStorage.clear();
    }
}