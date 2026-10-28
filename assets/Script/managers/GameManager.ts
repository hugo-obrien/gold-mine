import {SaveManager} from "./SaveManager";
import {GameEvent, GlobalEvent} from "../GlobalEvent";
import {MineWorkerFactory} from "../services/MineWorkerFactory";
import {ConfigLoader} from "../configs/ConfigLoader";
import {WorkerConfigLoader} from "../configs/WorkerConfigLoader";
import {Inventory} from "../model/Inventory";
import {ResourceType} from "../model/resources/Resource";
import {MineWorker, MineWorkerTypes} from "../model/units/Worker";
import {Miner} from "../model/units/Miner";
import ccclass = cc._decorator.ccclass;

@ccclass
export class GameManager extends cc.Component {

    private static _instance: GameManager;

    public static get instance(): GameManager {
        if (!this._instance) {
            const node = new cc.Node('GameManager');
            this._instance = node.addComponent(GameManager);
            cc.game.addPersistRootNode(node);
        }
        return this._instance;
    }

    private _isInitialized: boolean = false;
    private _workers: MineWorker[] = [];

    public get gold(): number {
        return Inventory.instance.get(ResourceType.GOLD).amount;
    }

    public get workers(): MineWorker[] {
        return this._workers;
    }

    public get goldPerSecond(): number {
        let gps = 0;
        for (const worker of this._workers) {
            if (!worker) {
                continue;
            }

            gps += worker.goldPerSecond;
        }

        return gps;
    }

    public get isInitialized(): boolean {
        return this._isInitialized;
    }

    public async initialize() {
        if (this._isInitialized) {
            cc.log('GameManager.initialize(): Already initialized, skipping');
            return
        }

        this._isInitialized = true;

        if (!ConfigLoader.instance.isLoaded) {
            cc.log(`GameManager.initialize(): Waiting for config load...`);
            await ConfigLoader.instance.loadConfig();
        }

        cc.game.on(cc.game.EVENT_HIDE, this.saveGame, this);

        this.tryLoadGame();
        GlobalEvent.emit(GameEvent.GAME_INITIALIZED);
    }

    protected onDestroy() {
        cc.game.off(cc.game.EVENT_HIDE, this.saveGame, this);
        this.saveGame();
    }

    protected update(dt: number) {
        if (!this._isInitialized) {
            return;
        }

        this.updateGold(dt);
    }

    private updateGold(dt: number) {
        const income = this.goldPerSecond;
        if (income > 0) {
            const goldEarned = income * dt;
            Inventory.instance.add(ResourceType.GOLD, goldEarned);
        }
    }

    public buyWorker(type: MineWorkerTypes = MineWorkerTypes.MINER) {
        const worker = MineWorkerFactory.createByType(type);
        if (!worker) {
            cc.warn(`GameManager.buyWorker(): cannot create worker of type ${type}`);
            return;
        }

        const finalPrice = this.getNextWorkerPrice(worker.configId);
        if (Inventory.instance.has(ResourceType.GOLD, finalPrice)) {
            Inventory.instance.spend(ResourceType.GOLD, finalPrice);
            this.addWorker(worker);
        } else {
            cc.log('Not enough gold');
        }
    }

    public addGold(amount: number) {
        Inventory.instance.add(ResourceType.GOLD, amount);
    }

    public setGold(amount: number) {
        Inventory.instance.set(ResourceType.GOLD, amount);
    }

    public getWorkerCount(configId: string): number {
        return this._workers.filter(worker => !!worker && worker.configId === configId).length;
    }

    public getNextWorkerPrice(configId: string): number {
        const config = ConfigLoader.instance.globalConfig;
        const workerConfig = WorkerConfigLoader.instance.getConfig(configId);
        const count = this.getWorkerCount(configId);
        const priceMultiplier = config.priceMultiplier;
        const mockPrice = workerConfig.basePrice;

        return Math.floor(mockPrice * Math.pow(priceMultiplier, count));
    }

    public addWorker(worker: MineWorker) {
        this._workers.push(worker);
        SaveManager.instance.saveWorkers(this._workers);
        this.notifyWorkersChanged();
    }

    private saveGame() {
        Inventory.instance.save();
        SaveManager.instance.saveWorkers(this._workers);
        SaveManager.instance.saveLastTimestamp();
    }

    private tryLoadGame() {
        cc.log('GameManager.loadGame() called');

        Inventory.instance.initialize();

        this._workers = SaveManager.instance.loadWorkers();
        this.notifyWorkersChanged();

        const lastTimestamp = SaveManager.instance.loadLastTimestamp();
        const diffSeconds = Math.floor((Date.now() - lastTimestamp) / 1000);

        this.processPostLoad(diffSeconds);
    }

    private processPostLoad(diffSeconds: number) {
        const income = this.goldPerSecond;
        if (income > 0 && diffSeconds > 0) {
            const maxOfflineSeconds = ConfigLoader.instance.globalConfig.maxOfflineSeconds;
            const cappedSeconds = Math.min(diffSeconds, maxOfflineSeconds);
            const offlineMined = income * cappedSeconds;
            Inventory.instance.add(ResourceType.GOLD, offlineMined);
            SaveManager.instance.saveLastTimestamp();
            cc.log(`Offline mined: ${offlineMined} (${cappedSeconds}s of ${diffSeconds}s)`);
        }
    }

    private notifyWorkersChanged() {
        GlobalEvent.emit(GameEvent.WORKERS_CHANGED, this._workers.length);
        GlobalEvent.emit(GameEvent.INCOME_CHANGED, this.goldPerSecond);
    }
}