import {Inventory} from '../../assets/Script/model/Inventory';
import {ResourceType} from '../../assets/Script/model/resources/Resource';
import {SaveManager} from '../../assets/Script/managers/SaveManager';
import {GameEvent, GlobalEvent} from '../../assets/Script/GlobalEvent';
import {clearGlobalEvent, resetSingletons, setupGameEnv} from '../helpers';

describe('Inventory', () => {
    beforeEach(() => {
        resetSingletons();
        clearGlobalEvent();
        setupGameEnv();
    });

    afterEach(() => {
        resetSingletons();
    });

    it('add увеличивает количество и сохраняет', () => {
        const inv = Inventory.instance;
        inv.add(ResourceType.GOLD, 10);
        expect(inv.getAmount(ResourceType.GOLD)).toBe(10);
        expect(SaveManager.instance.loadInventory()).toEqual([{typeId: 'gold', amount: 10}]);
    });

    it('add <= 0 ничего не делает', () => {
        const inv = Inventory.instance;
        inv.add(ResourceType.GOLD, 0);
        inv.add(ResourceType.GOLD, -5);
        expect(inv.getAmount(ResourceType.GOLD)).toBe(0);
    });

    it('add уважает maxAmount', () => {
        setupGameEnv({resourceConfigs: [{id: 'gold', maxAmount: 100}]});
        const inv = Inventory.instance;
        inv.add(ResourceType.GOLD, 150);
        expect(inv.getAmount(ResourceType.GOLD)).toBe(100);
    });

    it('spend списывает и возвращает true', () => {
        const inv = Inventory.instance;
        inv.add(ResourceType.GOLD, 10);
        expect(inv.spend(ResourceType.GOLD, 3)).toBe(true);
        expect(inv.getAmount(ResourceType.GOLD)).toBe(7);
    });

    it('spend больше, чем есть — false и без изменения', () => {
        const inv = Inventory.instance;
        inv.add(ResourceType.GOLD, 5);
        expect(inv.spend(ResourceType.GOLD, 6)).toBe(false);
        expect(inv.getAmount(ResourceType.GOLD)).toBe(5);
    });

    it('spend на отсутствующий ресурс — false', () => {
        const inv = Inventory.instance;
        expect(inv.spend(ResourceType.GOLD, 1)).toBe(false);
    });

    it('has / hasAll', () => {
        const inv = Inventory.instance;
        inv.add(ResourceType.GOLD, 10);
        inv.add(ResourceType.FOOD, 2);
        expect(inv.has(ResourceType.GOLD, 5)).toBe(true);
        expect(inv.has(ResourceType.GOLD, 11)).toBe(false);
        // Контракт hasAll: Map<typeId, amount> (ключи уникальны).
        expect(inv.hasAll(new Map([['gold', 10]]))).toBe(true);
        expect(inv.hasAll(new Map([['gold', 11]]))).toBe(false);
        expect(inv.hasAll(new Map([['gold', 4], ['food', 2]]))).toBe(true);
        expect(inv.hasAll(new Map([['gold', 4], ['food', 5]]))).toBe(false);
    });

    it('set меняет количество и сохраняет', () => {
        const inv = Inventory.instance;
        inv.set(ResourceType.GOLD, 77);
        expect(inv.getAmount(ResourceType.GOLD)).toBe(77);
        expect(SaveManager.instance.loadInventory()).toEqual([{typeId: 'gold', amount: 77}]);
    });

    it('set с отрицательным — бросает', () => {
        expect(() => Inventory.instance.set(ResourceType.GOLD, -1)).toThrow();
    });

    it('initialize из сейва; неизвестный тип пропускается', () => {
        SaveManager.instance.saveInventory([
            {typeId: 'gold', amount: 5},
            {typeId: 'unknown', amount: 999},
        ]);
        const inv = Inventory.instance;
        inv.initialize();
        expect(inv.getAmount(ResourceType.GOLD)).toBe(5);
        expect(inv.getAmount('unknown')).toBe(0);
    });

    it('get для неизвестного типа бросает', () => {
        expect(() => Inventory.instance.get('nope')).toThrow();
    });

    it('каждое изменение эмитит RESOURCE_CHANGED', () => {
        const inv = Inventory.instance;
        const spy = jest.spyOn(GlobalEvent, 'emit');
        inv.add(ResourceType.GOLD, 1);
        expect(spy).toHaveBeenCalledWith(GameEvent.RESOURCE_CHANGED, 'gold', 1);
    });
});