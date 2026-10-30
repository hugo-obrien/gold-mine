import {ConfigData} from '../../assets/Script/configs/ConfigData';

describe('ConfigData', () => {
    it('читает значения из корректного rawData', () => {
        const data = new ConfigData({defaultPriceMultiplier: 1.15, maxOfflineSeconds: 28800});
        expect(data.priceMultiplier).toBe(1.15);
        expect(data.maxOfflineSeconds).toBe(28800);
    });

    it('бросает ошибку при отсутствующем ключе', () => {
        expect(() => new ConfigData({defaultPriceMultiplier: 1.15})).toThrow();
    });

    it('пишет cc.error при отсутствующем ключе', () => {
        const cc = (global as any).cc;
        cc.error.mockClear();
        expect(() => new ConfigData({})).toThrow();
        expect(cc.error).toHaveBeenCalled();
    });
});