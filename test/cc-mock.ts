/**
 * Мок глобального `cc` для юнит-тестов вне Cocos Creator.
 *
 * Проект в рантайме получает `cc` как глобал из движка (`creator.d.ts`).
 * В Jest движка нет, поэтому мы поднимаем минимальный мок с полями,
 * которые реально используются чистой логикой: log/warn/error,
 * sys.localStorage, EventTarget, game/director/resources/debug, а также
 * базовые типы для компонентов (Component, Node, декораторы ccclass/property).
 */

export const localStorageStore: Record<string, string> = {};

export function resetLocalStorage() {
    for (const key of Object.keys(localStorageStore)) {
        delete localStorageStore[key];
    }
}

export function createCcMock() {
    const localStorage = {
        getItem: (key: string) => localStorageStore[key] ?? null,
        setItem: (key: string, value: string) => {
            localStorageStore[key] = value;
        },
        removeItem: (key: string) => {
            delete localStorageStore[key];
        },
        clear: () => {
            resetLocalStorage();
        },
    };

    // @ccclass используется и как `@ccclass`, и как `@ccclass('Name')`.
    const ccclass = (nameOrTarget: any) => {
        if (typeof nameOrTarget === 'function') {
            // Использован как декоратор класса `@ccclass` без аргументов.
            return nameOrTarget;
        }
        // Использован как `@ccclass('Name')` — возвращает декоратор.
        return (target: any) => target;
    };

    // @property / @property(...) — property-декораторы.
    const property = () => (target: any, key?: string) => {
        if (key) {
            return;
        }
        return target;
    };

    // Базовый класс компонента. GameManager extends cc.Component.
    class Component {}

    // Базовый узел. GameManager.instance создаёт узел и вешает компонент.
    class Node {
        public readonly name: string;

        constructor(name: string) {
            this.name = name;
        }

        public addComponent(cls: any) {
            return new cls();
        }
    }

    return {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        sys: { localStorage },
        Component,
        Node,
        _decorator: { ccclass, property },
        EventTarget: class {
            private readonly listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

            public on(name: string, callback: (...args: any[]) => void, target?: any) {
                if (!this.listeners.has(name)) {
                    this.listeners.set(name, []);
                }
                this.listeners.get(name)!.push(callback.bind(target || undefined));
            }

            public off(name: string, callback?: (...args: any[]) => void, target?: any) {
                if (!callback) {
                    this.listeners.delete(name);
                    return;
                }
                const list = this.listeners.get(name);
                if (!list) {
                    return;
                }
                this.listeners.set(name, list.filter((cb) => cb !== callback.bind(target || undefined)));
            }

            public emit(name: string, ...args: any[]) {
                const list = this.listeners.get(name);
                if (!list) {
                    return;
                }
                list.forEach((cb) => cb(...args));
            }
        },
        game: {
            EVENT_HIDE: 'game_event_hide',
            on: jest.fn(),
            off: jest.fn(),
            restart: jest.fn(),
            addPersistRootNode: jest.fn(),
        },
        director: {
            loadScene: jest.fn(),
        },
        resources: {
            load: jest.fn(),
        },
        debug: {
            setDisplayStats: jest.fn(),
            isDisplayStats: () => false,
        },
    };
}