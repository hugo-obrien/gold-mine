# Автотесты

Документ описывает, как в текущем проекте (**Gold Mine**, Cocos Creator 2.4.15) настраиваются и организованы автотесты, и какой набор тестов предлагается для текущего функционала. Ориентирован на то, что тесты **не должны зависеть от движка** там, где это возможно, — чтобы баланс и конфиги можно было проверять в CI без запуска редактора.

> Ключевой факт проекта: игра **конфиг-драйвен**, а бизнес-логика вынесена в обычные классы (`Inventory`, `SaveManager`, `ConfigParser`, `Miner`/`Dwarf`, `MineWorkerFactory`, `CommandRegistry`, `Utils`). Лишь `GameManager` — `cc.Component`. Это делает большую часть игровой логики пригодной для юнит-тестов вне движка.

## Слои и тестируемость

| Слой | Что тут | Тестируемость |
| --- | --- | --- |
| `Utils` (`utils/Utils.ts`) | `buildName`, `formatValue` | чистая функция — идеально |
| `configs/` | `ConfigParser`, `ConfigData`, `ResourceConfig`, `WorkerConfig`, лоадеры | классы; от `cc.*` зависят только лоадеры (log/resources) |
| `model/resources/` | `Resource`, `Gold`, `Food` | чистая логика |
| `model/units/` | `Miner`, `Dwarf`, интерфейс `MineWorker` | читают конфиги через `WorkerConfigLoader` |
| `model/Inventory.ts` | `add/spend/has/hasAll/set`, `maxAmount`, события | зависит от `SaveManager` + `ResourceConfigLoader` |
| `managers/GameManager.ts` | покупка, доход/сек, оффлайн-доход, сейв | `cc.Component`, но бизнес-методы изолированы |
| `managers/SaveManager.ts` | сериализация в `cc.sys.localStorage` | почти чистая; нужен mock `localStorage` |
| `managers/SceneManager.ts` | `SceneName` → имя сцены, защита от дабл-загрузки | нужен mock `cc.director` |
| `services/MineWorkerFactory.ts` | создание рабочих по типу/данным | чистая, switch по enum |
| `debug/` | `CommandRegistry`, `BuiltinCommands` | `CommandRegistry` — чистый реестр |
| `components/**` | `GoldNugget`, `StatLabel`, `Townhall`, `WorkersScreen`, `ResourceBar` и др. | тянут рендер — сложно |
| `legacy/` | match-3/blast задел | не подключён к игре, тесты — на позднем этапе |

## Как в Cocos Creator 2.4.15 настраиваются автотесты

Встроенного unit-тест-раннера (вроде `jest` в редакторе) в 2.4.x **нет**: тесты не входят в сборку редактора и `package.json` в проекте нет. Рабочие варианты, от дешёвого к дорогому:

### A. Юнит-тесты логики — Jest + ts-jest (основа)

Проект собирается под `es5`/`commonjs`/декораторы; `cc` — глобал из `creator.d.ts`. Чтобы тестировать классы вне движка, поднимается **мок модуля `cc`** (объект с нужными полями: `log/error/warn`, `sys.localStorage`, `EventTarget`, `resources`, `director`, `game`, `debug`). Так тестируются все сети: модель, конфиги, классы-менеджеры, `Utils`, `SaveManager`.

Что уже есть в проекте и облегчает это:
- `tsconfig.json`: `experimentalDecorators: true` — `ts-jest` поддержит;
- `creator.d.ts` даёт типы `cc` для линта (в рантайме `cc` подменяется моком);
- `package.json` отсутствует — для Jest понадобятся dev-зависимости (это отдельное решение, см. § «Следующие шаги»).

### B. Интеграционная проверка компонентов — in-game test-runner

`cc.Component`-ы (`GameManager`, `Townhall`, `WorkersScreen`, `StatLabel`, `ResourceBar`) двигают сцену/рендер, их юнит-тестировать без движка бессмысленно. Практично: отдельный компонент `TestRunner` на тестовой сцене, который в `CC_DEBUG` прогоняет сценарии и пишет pass/fail в лог/консоль (или через `CommandRegistry`). Проект уже так проверяется вручную — см. `docs/status-and-roadmap.md` («проверено в превью»), но это не автоматизировано.

### C. E2E по веб-сборке — Puppeteer / headless

Собрать web-сборку (штатное меню Project → Build) и гонять через Puppeteer: ассерты по состоянию, вынесенному в глобал, или по видимым лейблам/событиям. Закрывает сквозной контур: запуск `BootSceene` → `TownHall`, тап по самородку, покупка, сохранение/перезапуск, оффлайн-доход.

### D. Конфиг-валидатор (без запуска игры)

`global-config.json`, `workers.json`, `resources.json` прогонять через реальные `ConfigParser`/`ConfigData` и валидацию схемы. Это и есть «инструмент валидации конфигов» из roadmap этапа 8 — автотест в CI.

## Предлагаемый набор тестов

Приоритет: **P0** — быстро даёт ценность и почти не трогает движок; **P1** — менеджеры с моками; **P2** — компоненты/E2E.

### P0 — «чистое ядро» (Jest, без движка)

**`Utils.formatValue`** — уже был регресс (P1c: `0.25` выводился как `0`):
- `0` → `"0"`; `0.25` → `"0.25"`; `1`, `999` → `"1"`, `"999"`;
- `1000` → `"1K"`; `1234567` → `"1.23M"`;
- граница промоушена: `999999` → `"1M"` (не `"999.999K"`), `999999999` → `"1B"`;
- негатив: `-500` → `"-500"`, `-0.25` → `"-0.25"`;
- очень большие: `1e18` → `"1Qi"`, `1e21` → `"1Sx"`.

**`ConfigParser`**:
- каждая ветка `NUMBER`/`STRING`/`BOOLEAN`/`STRING_ARRAY` → валидное значение;
- невалидные: `{NUMBER: "abc"}`, `{STRING: 123}`, `{BOOLEAN: "true"}`, `{STRING_ARRAY: "a"}` / `[1,2]` → бросает ошибку.

**`ConfigData`**:
- корректный объект → значения прочитаны;
- отсутствующий ключ → `throw` + `cc.error`.

**`Resource`** (`model/resources/Resource.ts`):
- `add`/`spend`/`setAmount` меняют `amount` корректно;
- `spend` больше, чем есть → `false` и без изменения;
- guard'ы: отрицательный `initialAmount`/`add`/`spend`/`setAmount` → ошибка; пустой `typeId` → ошибка.

**`Miner` / `Dwarf`** (`model/units/`):
- `configId`/`type`/`goldPerSecond`/`defaultPrice` берутся из `WorkerConfigLoader` (через мок): `Miner.goldPerSecond` = `0.25`, `Dwarf` = `1`; `configId` = `miner`/`dwarf`.

**`MineWorkerFactory`** (`services/MineWorkerFactory.ts`):
- `createByType(MINER|DWARF)` → экземпляр соответствующего класса;
- `createByData`/`createByType` с неизвестным типом → `null` + `cc.warn`.

**`SaveManager`** (мок `cc.sys.localStorage`):
- round-trip: `saveInventory`→`loadInventory`, `saveWorkers`→`loadWorkers` (с `count`), `saveLastTimestamp`/`loadLastTimestamp`;
- `loadWorkers` с битым JSON → `[]` + `cc.error`, не падает;
- `loadWorkers` с записью неизвестного типа → пропуск;
- `clearAll` → всё очищено.

### P1 — менеджеры и реестры (Jest + mock `cc`)

**`GameManager`** (`managers/GameManager.ts`) — самое ценное, уже были баги в экономике:
- `gold` берётся из `Inventory`;
- `goldPerSecond` = сумма по рабочим (без `null`);
- `getNextWorkerPrice`: `floor(basePrice * multiplier^count)` — 0 шт, 1 шт, рост цены, `basePrice` из реестра;
- `buyWorker`: достаточно золота → списание + добавление + сейв + `WORKERS_CHANGED`/`INCOME_CHANGED`; не хватает → «Not enough gold», состав не меняется; неизвестный тип → `null` → отмена без списания;
- `addWorker` → сейв + события;
- `update(dt)` → начисляет `goldPerSecond * dt` (доход `0.25`/с);
- оффлайн-доход `processPostLoad`: положительный `diff` → `income * min(diff, maxOfflineSeconds)`, лимит `28800`; нулевой/отрицательный `diff` → без начисления. *(метод приватный — см. § «Требования к коду для тестируемости».)*

**`SceneManager`** (`managers/SceneManager.ts`):
- `loadScene(TOWN_HALL)` → `cc.director.loadScene('TownHall')`;
- `loadScene` при `_isLoading = true` → `cc.warn`, повторный вызов не исполняется;
- `loadScene` с неизвестным `SceneName` → `cc.error` + без перехода.

**`Inventory`** (`model/Inventory.ts`, мок `SaveManager` + `ResourceConfigLoader`):
- `initialize` из сейва; неизвестный тип → `cc.warn` + skip; эмитит `INVENTORY_LOADED`;
- `add` уважает `maxAmount` (лимит и без лимита), `spend` не уводит в минус, `has`/`hasAll`, `set`;
- `get` для неизвестного типа → `throw`;
- каждое изменение → `save()` + `RESOURCE_CHANGED`.

**`ResourceConfigLoader` / `WorkerConfigLoader`**:
- дефолты `gold`/`food` регистрируются до загрузки файла;
- запись без `id` → `warn`+skip; рабочего без `goldPerSecond`/`basePrice` → `warn`+skip;
- `getConfig` неизвестного → `throw`; `isKnownType`/`getAllConfigs`;
- `ResourceConfig.hasLimit` = `maxAmount !== Infinity`.

**`CommandRegistry` / `BuiltinCommands`** (`debug/`):
- регистрация, перезапись (с `cc.warn`), `unregister`, регистронезависимый `execute`;
- неизвестная команда → `Unknown command. …`;
- `BuiltinCommands`: `addGold`/`setGold` работают через `GameManager.addGold/setGold` (фикс из roadmap); `reset` → `clearAll` + `cc.game.restart`; `fps` → `cc.debug.setDisplayStats`; `scene <name>` → `cc.director.loadScene`.

**`ConfigLoader`** (`configs/ConfigLoader.ts`):
- `loadConfig` → параллельно грузит 4 источника; `isLoaded` = все загружены;
- `loadGlobalConfig` с ошибкой загрузки файла → `reject`;
- `globalConfig` до загрузки → `throw`.

### P2 — компоненты и E2E (превью/сборка, дороже)

- **`GoldNugget`**: тап → `Inventory.add(GOLD, 1)` + анимация. В сцене Mine кликабелен, в TownHall — индикатор (by design). Тест через in-game runner: иди в Mine, эмулируй `touch`, проверь золото.
- **`WorkersScreen`**: строится 1 строка на `WorkerConfig`, кнопка `Hire` с `interactable` (недоступна при `gold < price`), `refreshAll` по `WORKERS_CHANGED`/`INCOME_CHANGED`/`RESOURCE_CHANGED`.
- **`StatLabel`**: `refreshValue` для GOLD/MINER, корректный `formatValue`; подписки на события.
- **`Townhall`**: `incomeLabel` = `Utils.formatValue(goldPerSecond)`; обновление по `INCOME_CHANGED`.
- **`ResourceBar`**: строит элементы по `entries`, значения из `IStatSource`, подписка/отписка от событий. Отдельно — `ResourceStatSource`/`WorkerStatSource`.
- **E2E (Puppeteer по веб-сборке)**:
  1. Загрузка → конфиги + `GameManager` + переход в TownHall;
  2. тап по самородку в Mine → +1 золото;
  3. покупка miner/dwarf → списание, рост дохода, цена;
  4. сохранение → перезапуск → золото/рабочие на месте;
  5. оффлайн-доход: подставить большой `last_timestamp`, начисление ограничено `maxOfflineSeconds`;
  6. dev-консоль: `addGold`/`setGold`/`reset`/`scene`.
- **Конфиг-валидатор (CI)**: `global-config.json`/`workers.json`/`resources.json` прогонять через реальные `ConfigParser`+`ConfigData`.

## Требования к коду для тестируемости

Небольшие правки, которые потребуются для чистых тестов (сейчас код не менялся):

1. **Синглтоны глобальны и «липкие».** `Inventory`, `ConfigLoader`, `GameManager._workers` держат состояние между тестами. Нужны `beforeEach`-сбросы: проще всего добавить тест-хуки `reset()`/сброс `_instance`, либо `jest.resetModules()` + свежий `require`. Сейчас такого API нет — это первое, что потребуется.
2. **`processPostLoad`/`tryLoadGame` — приватные.** Оффлайн-доход важен, но проверяется через приватный метод. Либо тестировать через публичный `initialize`/`update` (длинно), либо вынести расчёт в чистый helper (например, `computeOfflineIncome(income, diff, max)`).
3. **`Inventory.get` бросает на неизвестный тип** и логирует очень щедро (`has()`, `updateGold`) — в тестах не мешает, но консоль замусорена (есть в roadmap).
4. **`tsconfig` собирает под `es5`/декораторы** — `ts-jest` это переживёт, но нужен отдельный `tsconfig.test.json` (например, `target: es2017`) для Jest.
5. **`cc.resources`/`cc.director`/`cc.game`** придётся мокать целиком; для лоадеров — подсовывать фейковый `JsonAsset`.

## Конфигурация (черновик)

```
package.json            # devDeps: jest, ts-jest, @types/jest
jest.config.js          # preset: ts-jest, testEnvironment: node, setupFiles: test/setup.ts
test/setup.ts           # мок глобального cc (log/error/warn, sys.localStorage, EventTarget...)
test/unit/…             # ядро + менеджеры (P0/P1)
test/integration/…      # in-game TestRunner (опц.)
e2e/                    # Puppeteer по собранной веб-сборке (опц.)
test/ci/config-validate # валидатор JSON-конфигов
```

Мок `cc` (суть):

```ts
// test/setup.ts
const store: Record<string, string> = {};
(global as any).cc = {
  log: jest.fn(), warn: jest.fn(), error: jest.fn(),
  sys: { localStorage: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    clear: () => { for (const k in store) delete store[k]; },
  }},
  EventTarget: class { on() {} off() {} emit() {} },
  game: { on() {}, off() {}, restart: jest.fn() },
  director: { loadScene: jest.fn() },
  resources: { load: jest.fn() },
  debug: { setDisplayStats: jest.fn(), isDisplayStats: () => false },
};
```

Пример теста:

```ts
import { Utils } from '../../assets/Script/utils/Utils';

describe('Utils.formatValue', () => {
  it.each([
    [0, '0'], [0.25, '0.25'], [999, '999'],
    [1000, '1K'], [1234567, '1.23M'], [999999, '1M'],
    [-500, '-500'], [1e18, '1Qi'],
  ])('%p -> %p', (n, out) => expect(Utils.formatValue(n)).toBe(out));
});
```

## Критерии приёмки

- `configs` (global/resources/workers) валидируются без запуска движка — ловят опечатки и «съехавшие» типы;
- баланс (`formatValue`, `getNextWorkerPrice`, оффлайн-доход) закреплён регресс-тестами;
- сохранение/загрузка (`SaveManager`, `Inventory`) покрыты round-trip и «битыми данными»;
- `GameManager` (покупка/доход/события) покрыт юнит-тестами с моком `cc`;
- компоненты сцены (`GoldNugget`, `StatLabel`, `Townhall`, `WorkersScreen`, `ResourceBar`) покрыты in-game runner (опц.);
- тесты запускаются из корня проекта одной командой (`npm test`) и не требуют открытия Cocos Creator.

## Следующие шаги

1. Этап 0 (см. `docs/status-and-roadmap.md`): P1/P1c/P2/P3 — быстрые фиксы, разблокируют тесты.
2. Развернуть скелет P0: `package.json` + `jest.config.js` + `test/setup.ts` + `test/unit/…` по `Utils`/`ConfigParser`/`Resource`/`SaveManager`.
3. Покрыть менеджеры (P1) моком `cc`; вынести расчёт оффлайн-дохода в helper для тестируемости.
4. После этапов 3–6 (диалоги, ивенты, здания) — расширить тесты на новые конфиги и модели (P0/P1) и in-game runner (P2).