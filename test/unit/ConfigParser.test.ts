import {ConfigParser} from '../../assets/Script/configs/ConfigParser';
import {ConfigType} from '../../assets/Script/configs/ConfigKeys';

describe('ConfigParser.parse', () => {
    it('NUMBER: валидное число и числовая строка', () => {
        expect(ConfigParser.parse(5, ConfigType.NUMBER, 'k')).toBe(5);
        expect(ConfigParser.parse('5', ConfigType.NUMBER, 'k')).toBe(5);
    });

    it('STRING: валидная строка', () => {
        expect(ConfigParser.parse('hello', ConfigType.STRING, 'k')).toBe('hello');
    });

    it('BOOLEAN: валидный boolean', () => {
        expect(ConfigParser.parse(true, ConfigType.BOOLEAN, 'k')).toBe(true);
    });

    it('STRING_ARRAY: валидный массив строк', () => {
        expect(ConfigParser.parse(['a', 'b'], ConfigType.STRING_ARRAY, 'k')).toEqual(['a', 'b']);
    });

    it.each([
        ['abc', ConfigType.NUMBER],
        [null, ConfigType.NUMBER],
        [123, ConfigType.STRING],
        ['true', ConfigType.BOOLEAN],
        ['a', ConfigType.STRING_ARRAY],
        [[1, 2], ConfigType.STRING_ARRAY],
    ])('невалидное значение %p для типа %p бросает', (value, type) => {
        expect(() => ConfigParser.parse(value, type as ConfigType, 'k')).toThrow();
    });
});