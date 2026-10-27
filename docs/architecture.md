# Архитектура

## Общий принцип

Код разложен по слоям: UI и компоненты сцен общаются с менеджерами, менеджеры — с моделью и конфигами. Прямого доступа UI к `localStorage` нет, запись идёт через `Inventory` → `SaveManager`.

```
components (cc.Component, UI/сцены)
        │ вызовы + подписки на GlobalEvent
        ▼
managers (GameManager, SceneManager, SaveManager)
        │
        ▼
model (Inventory, Resource, рабочие)  +  configs (ConfigLoader)  +  services (фабрики)
```

## Игровые петли

Игра строится на нескольких петлях, которые связаны сюжетными триггерами:

| Петля | Что делает | Где живёт (текущее / план) |
| --- | --- | --- |
| Idle/Clicker | тапы по самородку, покупка шахтёров, пассивный доход | `TownHall`, `Mine` (реализовано) |
| City Builder | постройка зданий города, покупка рабочих | `Buildings` (заглушка, план: расширить) |
| Сюжетные ивенты | match-3 / blast сцены, открывающиеся по сюжетным точкам | `legacy/` + динамические сцены (план) |
| Диалоги | 2 портрета + поле текста, привязаны к сюжетным точкам | план |

Общий поток: **производство ресурсов → сюжетная точка → ивент (динамическая сцена) → награда/прогресс → возврат к производству**.

## Динамические сцены (план)

Под динамической сценой понимается **одна универсальная сцена, собирающаяся из конфига**: фон, используемые тайлы, диалоги, условия победы и т.п. Это нужно для ивентов match-3/blast (минимум 2 механики).

Предполагаемая структура:

```
configs/events/<eventId>.json   # описание ивента (сцена, тайлы, условия, награда)
        └─ Сцена EventScene.fire — универсальный контейнер
                └─ EventSceneManager / ModuleLoader
                        ├─ Match3Module (использует legacy Grid/BoardView/…)
                        ├─ BlastModule    (использует legacy BlastGameManager/…)
                        └─ DialogueSystem (см. ниже)
```

Ключевое требование: **контент — в JSON, код — общий**. Конфиг определяет, какие тайлы, какой фон, какие диалоги, какие условия победы/поражения и какие награды.

## Сюжетные триггеры (план)

Триггеры — условия, после которых запускается ивент/диалог. Изначально достаточно смешанных условий:

| Тип условия | Пример | Источник |
| --- | --- | --- |
| Ресурсное | накоплено N золота / N еды | `Inventory` |
| Прогресс | куплено N рабочих, построено N зданий | `GameManager` / `Buildings` |
| Сюжетная точка | выполнено условие `storyPointId` | конфиг сюжета |
| Событийное | событие из `GlobalEvent` | шина |

Рекомендуется хранить условия декларативно (JSON), а проверять через условия-предикаты (`StoryConditionChecker`) — без хардкода условий в сценах.

## Система диалогов (план)

Минимальный набор: **2 портрета (слева/справа) + текстовое поле по центру**. Диалог описывается конфигом (список реплик: говорящий, портрет, текст, необязательная ветвление/эффекты).

Ожидаемые решения:
- `DialogConfig` (`speakerId`, `portraitKey`, `text`, `nextRef`, опционально действия).
- `DialogueUI` — универсальный компонент (слева/справа портреты, центральная панель).
- `DialogueSystem` — контроллер очереди реплик, вход по `storyPointId`, выход — событие `DIALOGUE_FINISHED`.
- Запуск как внутри ивента, так и из привычной сцены (без отдельной сцены под диалог).

## Ключевые сущности

### Синглтоны

| Класс | Тип | Файл | Ответственность |
| --- | --- | --- | --- |
| `GameManager` | `cc.Component` + статический `instance` (самосоздаётся, persist) | `assets/Script/managers/GameManager.ts` | золото, рабочие, доход/сек, покупка, оффлайн-доход, сохранение |
| `Inventory` | обычный класс, статический `instance` | `assets/Script/model/Inventory.ts` | ресурсы: количество, add/spend/has, maxAmount |
| `SaveManager` | обычный класс, статический `instance` | `assets/Script/managers/SaveManager.ts` | сериализация в `cc.sys.localStorage` |
| `SceneManager` | обычный класс, статический `instance` | `assets/Script/managers/SceneManager.ts` | переходы между сценами |
| `ConfigLoader` | обычный класс, статический `instance` | `assets/Script/configs/ConfigLoader.ts` | загрузка `global-config.json` + ресурсных конфигов |
| `ResourceConfigLoader` | обычный класс, статический `instance` | `assets/Script/configs/ResourceConfigLoader.ts` | реестр типов ресурсов |
| `CommandRegistry` | обычный класс, статический `instance` | `assets/Script/debug/CommandRegistry.ts` | команды dev-консоли |

Важно: `GameManager` — единственный компонент-синглтон. Остальные — чистые классы, на сцене им не нужен узел.

### Жизненный цикл запуска

```
BootSceene.fire
   └─ LoadingScreen.onLoad()
        ├─ ConfigLoader.instance.loadConfig()      // global-config + resources
        ├─ GameManager.instance.initialize()
        │    ├─ Inventory.instance.initialize()    // чтение сейва ресурсов
        │    ├─ SaveManager.loadWorkers()          // чтение сейва рабочих
        │    └─ processPostLoad()                  // оффлайн-доход
        ├─ (CC_DEBUG) загрузка prefab DebugConsole + BuiltinCommands.registerAll()
        └─ SceneManager.loadScene(SceneName.TOWN_HALL)
```

`GameInitializer` (`assets/Script/GameInitializer.ts`) — страховка: если на сцене есть этот компонент, он вызовет `GameManager.initialize()` в `onLoad`.

`LoadingScreen` обрабатывает ошибку: при сбое инициализации ставит `Failed to load game.` и не переходит дальше.

## События

Шина — `GlobalEvent = new cc.EventTarget()` (`assets/Script/GlobalEvent.ts`), enum `GameEvent`:

| Событие | Payload | Кто эмитит | Кто слушает |
| --- | --- | --- | --- |
| `INVENTORY_LOADED` | — | `Inventory.initialize()` | — |
| `RESOURCE_CHANGED` | `(typeId, amount)` | `Inventory.add/spend` | `StatLabel` (золото) |
| `WORKERS_CHANGED` | `number` (кол-во) | `GameManager.notifyWorkersChanged()` | `Townhall`, `StatLabel` |
| `INCOME_CHANGED` | `number` (доход/сек) | `GameManager.notifyWorkersChanged()` | `Townhall`, `StatLabel` |
| `SCORE_CHANGED` | — | не используется (остаток от старой версии) | — |
| `BUILDINGS_LOADED` | — | не используется | — |

> План: ввести события сюжетного прогресса. Если сторону сюжета/ивентов нужно вынести, удобно будет иметь отдельный бус (например, `StoryEvent`) — но пока согласованно используем `GlobalEvent`.

Подписки снимаются в `onDestroy` (`GlobalEvent.off`). Исключение — `Townhall.onDestroy`, где слушатель клика кнопки отписывается новым замыканием (на деле не тем же), стоит иметь в виду при рефакторинге.

## Слои подробнее

### managers

- `GameManager`: `gold`, `workers`, `goldPerSecond` (сумма по рабочим), `buyWorker()` (списание + создание `Miner` через фабрику), `getNextWorkerPrice()` (цена = `mockMinerPrice * priceMultiplier^кол-во`), `update(dt)` — пассивный доход, `saveGame()` на `EVENT_HIDE` и `onDestroy`.
- `SaveManager`: ключи `player_inventory`, `mine_workers`, `last_timestamp`; загрузка с `try/catch`, при ошибке — пустой массив.
- `SceneManager`: enum `SceneName` (TOWN_HALL=0, MINE=1, BUILDINGS=2, WORKERS=3) → имя файла сцены; защита от повторного перехода (`_isLoading`).

### configs

- `ConfigLoader.loadConfig()` параллельно грузит `configs/global-config` и ресурсные конфиги.
- `ConfigData` валидирует ключи и типы через `ConfigParser` (пока умеет только `NUMBER`).
- `ResourceConfigLoader` — реестр типов ресурсов (id, icon, maxAmount), с дефолтами для базовых золота/еды.

### model

- `Inventory`: `Map<string, Resource>`, `get` создаёт ресурс с 0, `add/spend/has/hasAll/getAmount`, уважает `maxAmount` из конфига, сохраняется при каждом изменении.
- `Resource`: `typeId`, `amount`; методы `add/spend/setAmount` бросают ошибку на отрицательных значениях.
- `Worker` — интерфейс `MineWorker` + `MineWorkerSaveData` + enum `MineWorkerTypes`; `Miner` — реализация с `goldPerSecond=0.25`, `defaultPrice=10` (пока захардкожено).
- `MineWorkerFactory` — `createByData(data)` и `createByType(type)`, switch по enum.

### components

- `LoadingScreen`: весь сценарий запуска (см. выше).
- `Townhall`: кнопка покупки, лейблы цены и дохода; обновляется по событиям.
- `GoldNugget`: тап → `Inventory.add(gold, 1)` + анимация масштаба. В сцене TownHall узел `gold-nugget` используется как **индикатор количества золота** и не имеет компонента `GoldNugget` (тап там не работает — это ожидаемо).
- `StatLabel`: enum `StatType` (GOLD/MINER) → событие → текст через `Utils.formatValue`.
- `SceneButton`: `targetScene: SceneName`, по тапу вызывает `SceneManager.loadScene`.

### services

- `MineWorkerFactory` — единственное место создания рабочих (и из данных сейва, и по типу).

### legacy (задел ивент-механик)

`assets/Script/legacy/` — match-3 «TapClap»: `Grid`, `Tile`, `TileBlueprint`, `BoardView`, `UIManager`, `BlastGameManager`, поведения (`CommonBlast`, `Bomb`), реестр поведений через `@RegisterBehavior`. **Это осознанно сохранённый задел** для будущих сюжетных ивентов (match-3/blast механики), а не мусор. К текущему идл-геймплею он **не подключён** и не участвует в загрузке; `assets/Scene/legacy/TapClapTest.fire` ссылается на скрипт, которого нет среди текущих мет (uuid `89e3cyvC9dGUrfoKqkdusTh`), т.е. эта тестовая сцена требует пересборки/переназначения компонентов при подключении legacy-модуля.