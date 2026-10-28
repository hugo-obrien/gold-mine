import {ConfigType} from "./ConfigKeys";

export class ConfigParser {
    public static parse(value: any, expectedType: ConfigType, key: string): any {
        switch (expectedType) {
            case ConfigType.NUMBER: return this.parseNumber(value, key);
            case ConfigType.STRING: return this.parseString(value, key);
            case ConfigType.BOOLEAN: return this.parseBoolean(value, key);
            case ConfigType.STRING_ARRAY: return this.parseStringArray(value, key);
            default: {
                cc.warn(`ConfigParser.parse(): Parser for type ${expectedType} for key ${key} not implemented yet`);
                return value;
            }
        }
    };

    private static parseNumber(value: any, key: string): number {
        const num = Number(value);
        if (value == null || isNaN(num)) {
            cc.error(`ConfigParser.parseNumber(): Invalid value ${value} for key ${key}`);
            throw new Error("Invalid number value");
        }
        return num;
    }

    private static parseString(value: any, key: string): string {
        if (typeof value !== 'string') {
            cc.error(`ConfigParser.parseString(): Invalid value ${value} for key ${key}`);
            throw new Error("Invalid string value");
        }
        return value;
    }

    private static parseBoolean(value: any, key: string): boolean {
        if (typeof value !== 'boolean') {
            cc.error(`ConfigParser.parseBoolean(): Invalid value ${value} for key ${key}`);
            throw new Error("Invalid boolean value");
        }
        return value;
    }

    private static parseStringArray(value: any, key: string): string[] {
        if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
            cc.error(`ConfigParser.parseStringArray(): Invalid value ${JSON.stringify(value)} for key ${key}`);
            throw new Error("Invalid string array value");
        }
        return value;
    }
}