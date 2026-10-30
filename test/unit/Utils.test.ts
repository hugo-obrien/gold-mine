import {Utils} from '../../assets/Script/utils/Utils';

describe('Utils.buildName', () => {
    it('генерирует имя с префиксами base и className', () => {
        const name = Utils.buildName('MineWorker', 'Miner');
        expect(name).toMatch(/^MineWorker_Miner_/);
    });

    it('генерирует уникальные имена', () => {
        const a = Utils.buildName('MineWorker', 'Miner');
        const b = Utils.buildName('MineWorker', 'Miner');
        expect(a).not.toBe(b);
    });
});

describe('Utils.formatValue', () => {
    it.each([
        [0, '0'],
        [0.25, '0.25'],
        [1, '1'],
        [999, '999'],
        [1000, '1K'],
        [1234567, '1.23M'],
        [123567, '124K'],
        [999999, '1M'],
        [949999, '950K'],
        [999999999, '1B'],
        [-500, '-500'],
        [-0.25, '-0.25'],
        [1e15, '1Qa'],
        [1e18, '1Qi'],
        [1e21, '1Sx'],
    ])('formatValue(%p) = %p', (input, expected) => {
        expect(Utils.formatValue(input as number)).toBe(expected);
    });
});