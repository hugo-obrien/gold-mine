import {Resource} from "./resources/Resource";
import {ResourceSaveEntry, SaveManager} from "../managers/SaveManager";
import {ResourceConfigLoader} from "../configs/ResourceConfigLoader";
import {GameEvent, GlobalEvent} from "../GlobalEvent";

export class Inventory {
    private static _instance: Inventory;
    public static get instance(): Inventory {
        if (!this._instance) {
            this._instance = new Inventory();
        }

        return this._instance;
    }

    private readonly _resource: Map<string, Resource> = new Map<string, Resource>();
    private _isInitialized: boolean = false;

    public get isInitialized(): boolean {
        return this._isInitialized;
    }

    public initialize() {
        if (this._isInitialized) return;

        const saved = SaveManager.instance.loadInventory();
        for (const entry of saved) {
            if (!ResourceConfigLoader.instance.isKnownType(entry.typeId)) {
                cc.warn(`Inventory.initialize(): unknown resource type ${entry.typeId}, skip`);
                continue;
            }

            const resource = new Resource(entry.typeId, entry.amount);
            this._resource.set(entry.typeId, resource);
        }

        this._isInitialized = true;
        GlobalEvent.emit(GameEvent.INVENTORY_LOADED);
        cc.log('Inventory initialized');
    }

    public get(typeId: string): Resource {
        let resource = this._resource.get(typeId);
        if (!resource) {
            if (!ResourceConfigLoader.instance.isKnownType(typeId)) {
                throw new Error(`Inventory.get(${typeId}): unknown resource type`);
            }
            resource = new Resource(typeId, 0);
            this._resource.set(typeId, resource);
        }
        return resource;
    }

    public add(typeId: string, amount: number) {
        if (amount <= 0) return;

        const config = ResourceConfigLoader.instance.getConfig(typeId);
        const resource = this.get(typeId);

        let factAmount = amount;
        if (config.hasLimit) {
            const possibleAmount = config.maxAmount - resource.amount;
            if (possibleAmount <= 0) return;
            if (factAmount >= possibleAmount) {
                factAmount = possibleAmount;
            }
        }

        resource.add(factAmount);
        this.save();

        GlobalEvent.emit(GameEvent.RESOURCE_CHANGED, typeId, resource.amount);
    }

    public spend(typeId: string, amount: number): boolean {
        if (amount <= 0) return false;

        const resource = this._resource.get(typeId);
        if (!resource) return false;

        if (resource.spend(amount)) {
            this.save();
            GlobalEvent.emit(GameEvent.RESOURCE_CHANGED, typeId, resource.amount);
            return true;
        }

        return false;
    }

    public set(typeId: string, amount: number): void {
        if (amount < 0) {
            throw new Error(`Inventory.set(${typeId}): amount cannot be negative`);
        }

        const resource = this.get(typeId);
        resource.setAmount(amount);
        this.save();
        GlobalEvent.emit(GameEvent.RESOURCE_CHANGED, typeId, resource.amount);
    }

    public hasAll(costs: Array<{typeId: string, amount: number}>): boolean {
        for (const c of costs) {
            if (!this.has(c.typeId, c.amount)) return false;
        }
        return true;
    }

    public has(typeId: string, amount: number): boolean {
        cc.log(`Inventory.has() called. TypeId: ${typeId}, amount: ${amount}`);
        let existingAmount = this.getAmount(typeId);

        this._resource.forEach((value, key) => {
            cc.log(`${key}: ${value.amount}`)
        })

        cc.log(`Existing amount: ${existingAmount}`);
        return existingAmount >= amount;
    }

    public getAmount(typeId: string): number {
        const resource = this._resource.get(typeId);
        return resource ? resource.amount : 0;
    }

    public save(): void {
        const data: ResourceSaveEntry[] = [];
        this._resource.forEach((r) => {
            if (r.amount > 0) {
                data.push(r.toSaveData())
            }
        });
        SaveManager.instance.saveInventory(data);
    }
}