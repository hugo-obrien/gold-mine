import {ConfigKey, ConfigKeyTypes} from "./ConfigKeys";
import {ConfigParser} from "./ConfigParser";

export class ConfigData {
    public readonly priceMultiplier: number;
    public readonly maxOfflineSeconds: number;

    constructor(rawData: any) {
        this.priceMultiplier = this.getValue<number>(rawData, ConfigKey.PRICE_MULTIPLIER);
        this.maxOfflineSeconds = this.getValue<number>(rawData, ConfigKey.MAX_OFFLINE_SECONDS);
    }

    private getValue<T>(rawData: any, key: ConfigKey): T {
        const rawWalue = rawData[key];
        if (rawWalue === undefined || rawWalue == null) {
            cc.error(`ConfigData: Missing key ${key}`);
            throw new Error("ConfigData: Missing key");
        }

        const expectedType = ConfigKeyTypes[key];
        return ConfigParser.parse(rawWalue, expectedType, key) as T;
    }
}