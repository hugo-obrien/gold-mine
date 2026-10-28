export interface WorkerConfigData {
    id: string;
    goldPerSecond: number;
    basePrice: number;
    icon?: string;
    nameKey?: string;
}

export class WorkerConfig {
    public readonly id: string;
    public readonly goldPerSecond: number;
    public readonly basePrice: number;
    public readonly icon: string;
    public readonly nameKey: string;

    constructor(data: WorkerConfigData) {
        this.id = data.id;
        this.goldPerSecond = data.goldPerSecond;
        this.basePrice = data.basePrice;
        this.icon = data.icon;
        this.nameKey = data.nameKey;
    }
}