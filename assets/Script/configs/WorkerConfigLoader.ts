import {WorkerConfig, WorkerConfigData} from "./WorkerConfig";

export class WorkerConfigLoader {
    private static _instance: WorkerConfigLoader;
    public static get instance(): WorkerConfigLoader {
        if (!this._instance) {
            this._instance = new WorkerConfigLoader();
        }
        return this._instance;
    }

    private readonly _configs: Map<string, WorkerConfig> = new Map();
    private _isLoaded: boolean = false;

    public get isLoaded(): boolean {
        return this._isLoaded;
    }

    public load(): Promise<void> {
        cc.log('WorkerConfigLoader.load() called');
        return new Promise((resolve, reject) => {
            cc.resources.load('configs/workers', cc.JsonAsset, (err, asset) => {
                if (err) {
                    cc.error('WorkerConfigLoader: Failed to load', err);
                    reject(err);
                    return;
                }

                const data = asset.json as { workers: WorkerConfigData[] };
                this.parseConfigs(data.workers);
                this._isLoaded = true;

                cc.log(`WorkerConfigLoader: Loaded ${this._configs.size} worker types`);
                resolve();
            });
        });
    }

    public getConfig(typeId: string): WorkerConfig {
        const config = this._configs.get(typeId);
        if (!config) {
            throw new Error(`WorkerConfigLoader.getConfig(${typeId}): Unknown worker type`);
        }
        return config;
    }

    public isKnownType(typeId: string): boolean {
        return this._configs.has(typeId);
    }

    public getAllConfigs(): WorkerConfig[] {
        const result: WorkerConfig[] = [];
        this._configs.forEach((c) => result.push(c));
        return result;
    }

    private parseConfigs(workerData: WorkerConfigData[]) {
        for (const data of workerData) {
            if (!data.id) {
                cc.warn('WorkerConfigLoader.parseConfigs(): config entry without id, skipping');
                continue;
            }
            if (data.goldPerSecond == null || data.basePrice == null) {
                cc.warn(`WorkerConfigLoader.parseConfigs(): ${data.id} missing goldPerSecond/basePrice, skipping`);
                continue;
            }

            this._configs.set(data.id, new WorkerConfig(data));
            cc.log(`WorkerConfigLoader.parseConfigs(): added ${data.id}`);
        }
    }
}