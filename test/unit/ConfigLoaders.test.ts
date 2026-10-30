import {ResourceConfigLoader} from '../../assets/Script/configs/ResourceConfigLoader';
import {WorkerConfigLoader} from '../../assets/Script/configs/WorkerConfigLoader';
import {resetSingletons} from '../helpers';

const cc = (global as any).cc;

describe('ResourceConfigLoader', () => {
    beforeEach(() => {
        resetSingletons();
        cc.warn.mockClear();
        cc.log.mockClear();
    });

    it('регистрирует базовые дефолты gold/food без лимита', () => {
        const loader = ResourceConfigLoader.instance;
        (loader as any).registerBaseDefaults();
        expect(loader.isKnownType('gold')).toBe(true);
        expect(loader.isKnownType('food')).toBe(true);
        // Отсутствие maxAmount = нет лимита (=> Infinity), hasLimit = false.
        expect(loader.getConfig('gold').hasLimit).toBe(false);
        expect(loader.getConfig('food').hasLimit).toBe(false);
    });

    it('parseConfigs добавляет типы из данных', () => {
        const loader = ResourceConfigLoader.instance;
        (loader as any).registerBaseDefaults();
        (loader as any).parseConfigs([{id: 'iron'}, {id: 'stone'}]);
        expect(loader.isKnownType('iron')).toBe(true);
        expect(loader.isKnownType('stone')).toBe(true);
    });

    it('запись без id — warn и skip', () => {
        const loader = ResourceConfigLoader.instance;
        (loader as any).parseConfigs([{id: ''}]);
        expect(cc.warn).toHaveBeenCalled();
    });

    it('getConfig неизвестного типа бросает', () => {
        expect(() => ResourceConfigLoader.instance.getConfig('unknown')).toThrow();
    });

    it('hasLimit: false при отсутствии лимита, true при заданном maxAmount', () => {
        const loader = ResourceConfigLoader.instance;
        (loader as any).parseConfigs([{id: 'iron', maxAmount: 100}, {id: 'stone'}]);
        expect(loader.getConfig('iron').hasLimit).toBe(true);
        expect(loader.getConfig('stone').hasLimit).toBe(false);
    });
});

describe('WorkerConfigLoader', () => {
    beforeEach(() => {
        resetSingletons();
        cc.warn.mockClear();
        cc.log.mockClear();
    });

    it('parseConfigs добавляет рабочих с валидными данными', () => {
        const loader = WorkerConfigLoader.instance;
        (loader as any).parseConfigs([{id: 'miner', goldPerSecond: 0.25, basePrice: 10}]);
        expect(loader.isKnownType('miner')).toBe(true);
        expect(loader.getConfig('miner').goldPerSecond).toBe(0.25);
        expect(loader.getConfig('miner').basePrice).toBe(10);
    });

    it('запись без id — warn и skip', () => {
        const loader = WorkerConfigLoader.instance;
        (loader as any).parseConfigs([{id: '', goldPerSecond: 1, basePrice: 1}]);
        expect(cc.warn).toHaveBeenCalled();
    });

    it('запись без goldPerSecond/basePrice — warn и skip', () => {
        const loader = WorkerConfigLoader.instance;
        (loader as any).parseConfigs([{id: 'miner'}]);
        expect(cc.warn).toHaveBeenCalled();
        expect(loader.isKnownType('miner')).toBe(false);
    });

    it('getConfig неизвестного типа бросает', () => {
        expect(() => WorkerConfigLoader.instance.getConfig('unknown')).toThrow();
    });
});