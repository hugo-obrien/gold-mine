export enum ConfigKey {
    PRICE_MULTIPLIER = "defaultPriceMultiplier",
    MAX_OFFLINE_SECONDS = "maxOfflineSeconds"
}

export enum ConfigType {
    NUMBER,
    STRING,
    BOOLEAN,
    STRING_ARRAY
}

export const ConfigKeyTypes: Record<ConfigKey, ConfigType> = {
    [ConfigKey.PRICE_MULTIPLIER]: ConfigType.NUMBER,
    [ConfigKey.MAX_OFFLINE_SECONDS]: ConfigType.NUMBER
};