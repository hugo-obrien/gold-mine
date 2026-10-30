import {SaveManager} from '../../assets/Script/managers/SaveManager';
import {Miner} from '../../assets/Script/model/units/Miner';
import {Dwarf} from '../../assets/Script/model/units/Dwarf';
import {MineWorkerTypes} from '../../assets/Script/model/units/Worker';
import {resetLocalStorage} from '../cc-mock';

const cc = (global as any).cc;

describe('SaveManager', () => {
    beforeEach(() => {
        resetLocalStorage();
        cc.log.mockClear();
        cc.error.mockClear();
    });

    it('saveInventory/loadInventory — round-trip', () => {
        const sm = SaveManager.instance;
        sm.saveInventory([{typeId: 'gold', amount: 15}, {typeId: 'food', amount: 2}]);
        expect(sm.loadInventory()).toEqual([
            {typeId: 'gold', amount: 15},
            {typeId: 'food', amount: 2},
        ]);
    });

    it('saveWorkers/loadWorkers — round-trip с count', () => {
        const sm = SaveManager.instance;
        sm.saveWorkers([new Miner(), new Dwarf(), new Miner()]);
        const loaded = sm.loadWorkers();
        expect(loaded.length).toBe(3);

        // Порядок разворота не гарантирован (Map <type, count>), проверяем состав.
        const types = loaded.map((w) => w.type);
        expect(types).toContain(MineWorkerTypes.MINER);
        expect(types).toContain(MineWorkerTypes.DWARF);
        expect(loaded.filter((w) => w.type === MineWorkerTypes.MINER).length).toBe(2);
        expect(loaded.filter((w) => w.type === MineWorkerTypes.DWARF).length).toBe(1);
    });

    it('loadWorkers: битый JSON → [] и cc.error, без падения', () => {
        cc.sys.localStorage.setItem('mine_workers', '{broken json');
        const sm = SaveManager.instance;
        expect(sm.loadWorkers()).toEqual([]);
        expect(cc.error).toHaveBeenCalled();
    });

    it('loadWorkers: пустое значение → []', () => {
        expect(SaveManager.instance.loadWorkers()).toEqual([]);
    });

    it('saveLastTimestamp/loadLastTimestamp — round-trip', () => {
        const sm = SaveManager.instance;
        sm.saveLastTimestamp();
        const ts = sm.loadLastTimestamp();
        expect(ts).toBeGreaterThan(0);
    });

    it('loadLastTimestamp: нет значения → текущее время', () => {
        const before = Date.now();
        expect(SaveManager.instance.loadLastTimestamp()).toBeGreaterThanOrEqual(before);
    });

    it('clearAll очищает localStorage', () => {
        const sm = SaveManager.instance;
        sm.saveInventory([{typeId: 'gold', amount: 1}]);
        sm.clearAll();
        expect(sm.loadInventory()).toEqual([]);
    });
});