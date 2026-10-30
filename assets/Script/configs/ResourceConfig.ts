export interface ResourceConfigData {
    id: string;
    icon?: string;
    maxAmount?: number;
}

export class ResourceConfig {
    public readonly id: string;
    public readonly icon: string;
    public readonly maxAmount: number;

    constructor(data: ResourceConfigData) {
        this.id = data.id;
        this.icon = data.icon;
        this.maxAmount = data.maxAmount === undefined ? Infinity : data.maxAmount;
    }

    public get hasLimit() {
        return this.maxAmount !== Infinity;
    }
}