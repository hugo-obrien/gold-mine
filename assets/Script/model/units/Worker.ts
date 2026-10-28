export interface MineWorker {
    readonly key: string;
    readonly type: MineWorkerTypes;
    readonly goldPerSecond: number;
    readonly defaultPrice: number;
    readonly configId: string;

    serialize(): MineWorkerSaveData;
}

export interface MineWorkerSaveData {
    type: MineWorkerTypes;
}

export enum MineWorkerTypes {
    MINER,
    DWARF
}