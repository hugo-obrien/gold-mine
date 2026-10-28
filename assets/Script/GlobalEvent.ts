export const GlobalEvent = new cc.EventTarget();

export enum GameEvent {
    BUILDINGS_LOADED = 'GameEvent:BuildingsLoaded',
    INVENTORY_LOADED = 'GameEvent:InventoryLoaded',

    SCORE_CHANGED = 'GameEvent:ScoreChanged',
    WORKERS_CHANGED = 'GameEvent:WorkersChanged',
    INCOME_CHANGED = 'GameEvent:IncomeChanged',
    RESOURCE_CHANGED = 'GameEvent:ResourceChanged',
    GAME_INITIALIZED = 'GameEvent:GameInitialized'
}