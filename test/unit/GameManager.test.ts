import {GameManager} from '../../assets/Script/managers/GameManager';
import {Inventory} from '../../assets/Script/model/Inventory';
import {ResourceType} from '../../assets/Script/model/resources/Resource';
import {MineWorkerTypes} from '../../assets/Script/model/units/Worker';
import {SaveManager} from '../../assets/Script/managers/SaveManager';
import {GameEvent, GlobalEvent} from '../../assets/Script/GlobalEvent';
import {clearGlobalEvent, resetSingletons, setupGameEnv} from '../helpers';

describe('GameManager', () => {
    beforeEach(() => {
        resetSingletons();
        clearGlobalEvent();
        setupGameEnv();
    });

    afterEach(() => {
        resetSingletons();
    });

    it('gold берётся из Inventory', () => {
        const gm = GameManager.instance;
        Inventory.instance.add(ResourceType.GOLD, 50);
        expect(gm.gold).toBe(50);
    });

    it('goldPerSecond = сумма по рабочим (без null)', () => {
        const gm = GameManager.instance;
        expect(gm.goldPerSecond).toBe(0);
        gm.addWorker({type: MineWorkerTypes.MINER, goldPerSecond: 0.5} as any);
        gm.addWorker({type: MineWorkerTypes.DWARF, goldPerSecond: 1} as any);
        gm.addWorker(null as any);
        expect(gm.goldPerSecond).toBe(1.5);
    });

    it('getNextWorkerPrice: floor(basePrice * multiplier^count)', () => {
        const gm = GameManager.instance;
        expect(gm.getNextWorkerPrice('miner')).toBe(10);
        // 10 * 1.15^1 = 11.5 -> 11
        gm.addWorker({type: MineWorkerTypes.MINER, goldPerSecond: 0.25, configId: 'miner'} as any);
        expect(gm.getNextWorkerPrice('miner')).toBe(11);
        // dwarf: 25 * 1.15^2
        gm.addWorker({type: MineWorkerTypes.DWARF, goldPerSecond: 1, configId: 'dwarf'} as any);
        gm.addWorker({type: MineWorkerTypes.DWARF, goldPerSecond: 1, configId: 'dwarf'} as any);
        expect(gm.getNextWorkerPrice('dwarf')).toBe(Math.floor(25 * Math.pow(1.15, 2)));
    });

    it('buyWorker: достаточно золота — списывает и добавляет', () => {
        const gm = GameManager.instance;
        Inventory.instance.add(ResourceType.GOLD, 100);
        gm.buyWorker(MineWorkerTypes.MINER);
        expect(gm.workers.length).toBe(1);
        expect(Inventory.instance.getAmount(ResourceType.GOLD)).toBe(100 - 10);
        expect(gm.getWorkerCount('miner')).toBe(1);
    });

    it('buyWorker: не хватает золота — состав не меняется', () => {
        const gm = GameManager.instance;
        Inventory.instance.add(ResourceType.GOLD, 5);
        gm.buyWorker(MineWorkerTypes.MINER);
        expect(gm.workers.length).toBe(0);
        expect(Inventory.instance.getAmount(ResourceType.GOLD)).toBe(5);
    });

    it('buyWorker: неизвестный тип — отмена без списания', () => {
        const gm = GameManager.instance;
        Inventory.instance.add(ResourceType.GOLD, 100);
        gm.buyWorker(999 as any);
        expect(gm.workers.length).toBe(0);
        expect(Inventory.instance.getAmount(ResourceType.GOLD)).toBe(100);
    });

    it('addWorker сохраняет состав и эмитит события', () => {
        const gm = GameManager.instance;
        const workersSpy = jest.spyOn(GlobalEvent, 'emit');
        gm.addWorker({type: MineWorkerTypes.MINER, goldPerSecond: 0.25} as any);
        expect(workersSpy).toHaveBeenCalledWith(GameEvent.WORKERS_CHANGED, 1);
        expect(workersSpy).toHaveBeenCalledWith(GameEvent.INCOME_CHANGED, 0.25);
        expect(SaveManager.instance.loadWorkers().length).toBe(1);
    });

    it('update(dt) начисляет пассивный доход', () => {
        const gm = GameManager.instance;
        gm.addWorker({type: MineWorkerTypes.MINER, goldPerSecond: 0.25} as any);
        // update() игнорируется до initialize() — выставляем состояние как в игре.
        (gm as any)._isInitialized = true;
        (gm as any).update(2);
        expect(Inventory.instance.getAmount(ResourceType.GOLD)).toBeCloseTo(0.5);
    });

    it('initialize(): при last_timestamp начисляет оффлайн-доход с лимитом', async () => {
        const gm = GameManager.instance;
        gm.addWorker({type: MineWorkerTypes.MINER, goldPerSecond: 0.25} as any);
        SaveManager.instance.saveLastTimestamp();

        // Симулируем 2 часа (7200 c) оффлайна.
        const oldNow = Date.now;
        const mockNow = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 7200 * 1000);
        await gm.initialize();
        mockNow.mockRestore();

        // 0.25 * 7200 = 1800, лимит 28800 c не сработал.
        expect(Inventory.instance.getAmount(ResourceType.GOLD)).toBeCloseTo(1800);
    });

    it('initialize(): при нулевом/отрицательном diff оффлайн-доход не начисляется', async () => {
        const gm = GameManager.instance;
        gm.addWorker({type: MineWorkerTypes.MINER, goldPerSecond: 0.25} as any);
        SaveManager.instance.saveLastTimestamp();
        await gm.initialize();
        expect(Inventory.instance.getAmount(ResourceType.GOLD)).toBeCloseTo(0);
    });

    it('initialize(): эмитит GAME_INITIALIZED', async () => {
        const gm = GameManager.instance;
        const spy = jest.spyOn(GlobalEvent, 'emit');
        await gm.initialize();
        expect(spy).toHaveBeenCalledWith(GameEvent.GAME_INITIALIZED);
    });
});