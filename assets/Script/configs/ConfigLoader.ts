import {ConfigData} from "./ConfigData";
import {ResourceConfigLoader} from "./ResourceConfigLoader";
import {WorkerConfigLoader} from "./WorkerConfigLoader";
import {SpriteFrameProvider} from "../services/SpriteFrameProvider";

export class ConfigLoader {
    private static _instance: ConfigLoader;
    private _configData: ConfigData | null = null;

    public static get instance(): ConfigLoader {
        if (!this._instance) {
            this._instance = new ConfigLoader();
        }
        return this._instance;
    }

    public get globalConfig(): ConfigData {
        if (!this._configData) {
            throw new Error("ConfigLoader: Config not loaded yet. Call loadConfig() first");
        }
        return this._configData;
    }

    public get isLoaded(): boolean {
        return this._configData !== null
            && ResourceConfigLoader.instance.isLoaded
            && WorkerConfigLoader.instance.isLoaded
            && SpriteFrameProvider.instance.isLoaded;
    }

    public async loadConfig(): Promise<void> {
        cc.log('ConfigLoader: Starting loading configs...');
        try {
            await Promise.all([
                this.loadGlobalConfig(),
                ResourceConfigLoader.instance.load(),
                WorkerConfigLoader.instance.load(),
                SpriteFrameProvider.instance.load()
            ])
            cc.log('ConfigLoader: Successfully loaded');
        } catch (error) {
            cc.error(`ConfigLoader.loadConfig() failed: ${error.message}`);
            throw error;
        }
    }

    public async loadGlobalConfig(): Promise<void> {
        return new Promise((resolve, reject) => {
            cc.log('Loading global configs...');

            cc.resources.load("configs/global-config", cc.JsonAsset, (err, jsonAsset) => {
                if (err) {
                    cc.error(`ConfigLoader: Failed to load global-config.json: ${err.message}`);
                    reject(err);
                    return;
                }

                try {
                    const rawData = jsonAsset.json;
                    this._configData = new ConfigData(rawData);
                    cc.log('ConfigLoader: Successfully loaded global-configs.json');
                    resolve();
                } catch (parseError) {
                    cc.error(`ConfigLoader: Failed to parse config: ${parseError.message}`);
                    reject(parseError);
                }
            });

            cc.log('ConfigLoader: Configs successfully loaded');
        });
    }
}