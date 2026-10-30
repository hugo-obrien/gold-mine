/**
 * Хелперы для настройки синглтонов и конфигов между юнит-тестами.
 *
 * Синглтоны проекта (Inventory, SaveManager, ConfigLoader, ResourceConfigLoader,
 * WorkerConfigLoader, CommandRegistry) держат статический `_instance` и
 * «липкое» состояние. Здесь мы сбрасываем их и заполняем тестовые конфиги
 * напрямую через `(X as any)._instance`, что на рантайме корректно, т.к.
 * приватность в TS — только на уровне типов.
 */

import {Inventory} from '../assets/Script/model/Inventory';
import {SaveManager} from '../assets/Script/managers/SaveManager';
import {GameManager} from '../assets/Script/managers/GameManager';
import {SceneManager} from '../assets/Script/managers/SceneManager';
import {ConfigLoader} from '../assets/Script/configs/ConfigLoader';
import {ConfigData} from '../assets/Script/configs/ConfigData';
import {ResourceConfigLoader} from '../assets/Script/configs/ResourceConfigLoader';
import {ResourceConfig, ResourceConfigData} from '../assets/Script/configs/ResourceConfig';
import {WorkerConfigLoader} from '../assets/Script/configs/WorkerConfigLoader';
import {WorkerConfig, WorkerConfigData} from '../assets/Script/configs/WorkerConfig';
import {CommandRegistry} from '../assets/Script/debug/CommandRegistry';
import {SpriteFrameProvider} from '../assets/Script/services/SpriteFrameProvider';
import {GlobalEvent} from '../assets/Script/GlobalEvent';
import {resetLocalStorage} from './cc-mock';

/** Сбрасывает все синглтоны и хранилище. Вызывать в beforeEach каждого набора. */
export function resetSingletons() {
    resetLocalStorage();
    (Inventory as any)._instance = undefined;
    (SaveManager as any)._instance = undefined;
    (GameManager as any)._instance = undefined;
    (SceneManager as any)._instance = undefined;
    (ConfigLoader as any)._instance = undefined;
    (ResourceConfigLoader as any)._instance = undefined;
    (WorkerConfigLoader as any)._instance = undefined;
    (CommandRegistry as any)._instance = undefined;
}

/** Настраивает ResourceConfigLoader с заданными типами (по умолчанию gold/food). */
export function setupResourceConfigs(configs: ResourceConfigData[] = [
    {id: 'gold'},
    {id: 'food'},
]) {
    const loader = new ResourceConfigLoader();
    (loader as any)._isLoaded = true;
    const map: Map<string, ResourceConfig> = (loader as any)._configs;
    configs.forEach((c) => map.set(c.id, new ResourceConfig(c)));
    (ResourceConfigLoader as any)._instance = loader;
    return loader;
}

/** Настраивает WorkerConfigLoader с заданными типами (по умолчанию miner/dwarf). */
export function setupWorkerConfigs(configs: WorkerConfigData[] = [
    {id: 'miner', goldPerSecond: 0.25, basePrice: 10},
    {id: 'dwarf', goldPerSecond: 1, basePrice: 25},
]) {
    const loader = new WorkerConfigLoader();
    (loader as any)._isLoaded = true;
    const map: Map<string, WorkerConfig> = (loader as any)._configs;
    configs.forEach((c) => map.set(c.id, new WorkerConfig(c)));
    (WorkerConfigLoader as any)._instance = loader;
    return loader;
}

/** Настраивает ConfigLoader с заданной глобальной конфигурацией. */
export function setupGlobalConfig(config: {defaultPriceMultiplier?: number; maxOfflineSeconds?: number} = {
    defaultPriceMultiplier: 1.15,
    maxOfflineSeconds: 28800,
}) {
    const loader = new ConfigLoader();
    (loader as any)._configData = new ConfigData(config as any);
    (ConfigLoader as any)._instance = loader;
    return loader;
}

/** Настраивает SpriteFrameProvider как загруженный (нужно для ConfigLoader.isLoaded). */
export function setupSpriteFrameProvider() {
    const provider = new SpriteFrameProvider();
    (provider as any)._loading = Promise.resolve();
    (SpriteFrameProvider as any)._instance = provider;
    return provider;
}

/** Полная настройка окружения для GameManager/Inventory. */
export function setupGameEnv(config?: {
    resourceConfigs?: ResourceConfigData[];
    workerConfigs?: WorkerConfigData[];
    globalConfig?: {defaultPriceMultiplier?: number; maxOfflineSeconds?: number};
}) {
    setupResourceConfigs(config?.resourceConfigs);
    setupWorkerConfigs(config?.workerConfigs);
    setupGlobalConfig(config?.globalConfig);
    setupSpriteFrameProvider();
}

/** Чистит слушатели GlobalEvent между тестами. */
export function clearGlobalEvent() {
    (GlobalEvent as any).listeners = new Map();
}