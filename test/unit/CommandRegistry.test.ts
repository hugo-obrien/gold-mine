import {CommandRegistry} from '../../assets/Script/debug/CommandRegistry';
import {BuiltinCommands} from '../../assets/Script/debug/commands/BuiltinCommands';
import {SaveManager} from '../../assets/Script/managers/SaveManager';
import {Inventory} from '../../assets/Script/model/Inventory';
import {ResourceType} from '../../assets/Script/model/resources/Resource';
import {DebugConsole} from '../../assets/Script/debug/DebugConsole';
import {clearGlobalEvent, resetSingletons, setupGameEnv} from '../helpers';

const cc = (global as any).cc;

describe('CommandRegistry', () => {
    beforeEach(() => {
        resetSingletons();
        clearGlobalEvent();
        setupGameEnv();
        cc.warn.mockClear();
        cc.log.mockClear();
        cc.director.loadScene.mockClear();
        cc.debug.setDisplayStats.mockClear();
        cc.game.restart.mockClear();
        // Мокаем DebugConsole.instance для BuiltinCommands.
        (DebugConsole as any)._instance = {appendLog: jest.fn()};
    });

    afterEach(() => {
        resetSingletons();
    });

    it('регистрирует и выполняет команду', () => {
        const reg = CommandRegistry.instance;
        const fn = jest.fn();
        reg.register({name: 'ping', description: '', execute: fn});
        expect(reg.execute('ping')).toBe('OK');
        expect(fn).toHaveBeenCalled();
    });

    it('перезаписывает команду с предупреждением', () => {
        const reg = CommandRegistry.instance;
        const fn1 = jest.fn();
        const fn2 = jest.fn();
        reg.register({name: 'cmd', description: '', execute: fn1});
        reg.register({name: 'cmd', description: '', execute: fn2});
        expect(cc.warn).toHaveBeenCalled();
        expect(reg.execute('cmd')).toBe('OK');
        expect(fn2).toHaveBeenCalled();
        expect(fn1).not.toHaveBeenCalled();
    });

    it('неизвестная команда → сообщение', () => {
        expect(CommandRegistry.instance.execute('nope')).toMatch(/Unknown command/);
    });

    it('не чувствителен к регистру', () => {
        const reg = CommandRegistry.instance;
        const fn = jest.fn();
        reg.register({name: 'Foo', description: '', execute: fn});
        expect(reg.execute('foo')).toBe('OK');
        expect(fn).toHaveBeenCalled();
    });

    it('execute с ошибкой в команде → "Failed: ..."', () => {
        const reg = CommandRegistry.instance;
        reg.register({
            name: 'boom', description: '',
            execute: () => { throw new Error('kaboom'); },
        });
        expect(reg.execute('boom')).toBe('Failed: kaboom');
    });
});

describe('BuiltinCommands', () => {
    beforeEach(() => {
        resetSingletons();
        clearGlobalEvent();
        setupGameEnv();
        cc.log.mockClear();
        cc.warn.mockClear();
        cc.director.loadScene.mockClear();
        cc.debug.setDisplayStats.mockClear();
        cc.game.restart.mockClear();
    });

    afterEach(() => {
        resetSingletons();
    });

    it('registerAll регистрирует addGold/setGold/reset/fps/scene', () => {
        BuiltinCommands.registerAll();
        const names = ['addgold', 'setgold', 'reset', 'fps', 'scene'];
        names.forEach((n) => expect(CommandRegistry.instance.execute(n)).not.toMatch(/Unknown command/));
    });

    it('addGold добавляет золото', () => {
        BuiltinCommands.registerAll();
        CommandRegistry.instance.execute('addGold 50');
        expect(Inventory.instance.getAmount(ResourceType.GOLD)).toBe(50);
    });

    it('addGold без аргумента добавляет дефолт 1000', () => {
        BuiltinCommands.registerAll();
        CommandRegistry.instance.execute('addGold');
        expect(Inventory.instance.getAmount(ResourceType.GOLD)).toBe(1000);
    });

    it('setGold устанавливает точное значение', () => {
        BuiltinCommands.registerAll();
        CommandRegistry.instance.execute('setGold 42');
        expect(Inventory.instance.getAmount(ResourceType.GOLD)).toBe(42);
    });

    it('setGold с невалидным значением игнорируется', () => {
        BuiltinCommands.registerAll();
        CommandRegistry.instance.execute('setGold abc');
        expect(Inventory.instance.getAmount(ResourceType.GOLD)).toBe(0);
    });

    it('reset очищает сейв и перезапускает игру', () => {
        BuiltinCommands.registerAll();
        Inventory.instance.add(ResourceType.GOLD, 10);
        CommandRegistry.instance.execute('reset');
        expect(SaveManager.instance.loadInventory()).toEqual([]);
        expect(cc.game.restart).toHaveBeenCalled();
    });

    it('fps переключает отображение статистики', () => {
        BuiltinCommands.registerAll();
        CommandRegistry.instance.execute('fps');
        expect(cc.debug.setDisplayStats).toHaveBeenCalled();
    });

    it('scene загружает сцену по имени', () => {
        BuiltinCommands.registerAll();
        CommandRegistry.instance.execute('scene Mine');
        expect(cc.director.loadScene).toHaveBeenCalledWith('Mine');
    });
});