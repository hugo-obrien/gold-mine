# Правила разработки

## Общие принципы

1. **Слои не прыгают.** `components/*` работают через менеджеры/события, `managers/*` — через модель и конфиги. Не пишите `cc.sys.localStorage` из компонентов UI (для этого есть `SaveManager`).
2. **Данные — в конфиги.** Числа экономики не хардкодить в компонентах/моделях; путь: JSON → `ConfigKey` → `ConfigData` → использование.
3. **Конфиг-драйвен (ключевое требование).** Гейм-дизайнер меняет JSON, а не редактор и не код. Если нужно изменить баланс/контент — ищем способ сделать это в конфиге; код меняем только для нового *типа* данных/логики.
4. **Создание рабочих — только через `MineWorkerFactory`.** Не `new Miner()` в бизнес-логике.
5. **Синглтоны.** `GameManager` — `cc.Component` + persist; остальные (`Inventory`, `SaveManager`, `SceneManager`, `ConfigLoader`, `CommandRegistry`) — обычные классы со статическим `instance` и без узлов.
6. **События.** Глобальные — только через `GlobalEvent`/`GameEvent`; `on`/`off` парами, отписка в `onDestroy`.

## Структура скриптов

```
assets/Script/
  GameInitializer.ts       # страховка инициализации GameManager
  GlobalEvent.ts           # шина + enum GameEvent
  managers/                # GameManager, SaveManager, SceneManager
  configs/                 # ConfigData/Loader/Parser/Keys, ResourceConfig(+Loader)
  model/                   # Inventory, resources/, units/
  services/                # MineWorkerFactory
  components/
    scenes/                # LoadingScreen, Townhall (логика сцены)
    ui/                    # GoldNugget, StatLabel, SceneButton (переиспользуемые)
  utils/                   # Utils
  debug/                   # dev-консоль и команды
  legacy/                  # задел match-3/blast для ивентов — сохраняется
```

## Типовые задачи

### Добавить сцену

1. Создать сцену `assets/Scene/<Name>.fire`.
2. Добавить `SceneName` в `SceneManager` (`SceneName.ts` → `SCENE_MAP`).
3. Переход: `SceneButton` с `targetScene` (свойство в инспекторе) или `SceneManager.instance.loadScene(SceneName.<NAME>)`.
4. Если сцена — основной экран после загрузки, обновить дефолт в `LoadingScreen` (сейчас там `TOWN_HALL`).

> Для **ивентов** сцену не создаём на каждый ивент: используется универсальная динамическая сцена, собираемая из конфига (`EventScene.fire` + `eventId`).

### Добавить новый тип ресурса

1. `ResourceType` в `assets/Script/model/resources/Resource.ts`.
2. Запись в `assets/resources/configs/resources.json`.
3. По необходимости — в `getAllBaseResourceTypes()`.
4. Использовать только через `Inventory` (`add`/`spend`/`has`), не напрямую.

### Добавить нового рабочего

1. Реализовать интерфейс `MineWorker` (`assets/Script/model/units/Worker.ts`): `key`, `goldPerSecond`, `defaultPrice`, `serialize()`.
2. Добавить значение в `MineWorkerTypes`.
3. Добавить `case` в `MineWorkerFactory.createByType` / `createByData`.
4. Параметры (`goldPerSecond`, цена) вынести в конфиги — см. `docs/configs.md`. Сейчас `Miner` содержит TODO на эту тему.

### Добавить здание (City Builder)

1. Описать в `buildings.json`: `id`, цена, эффект, требования, лимит.
2. Использовать универсальную логику применения `BuildingEffect` (без хардкода эффектов в коде сцены).
3. При необходимости расширить модель зданий (`buildings/`) и фабрику построек.

### Добавить ивент (Match-3 / Blast)

1. Описать ивент в `events/<id>.json` (тип, фон, тайлы, правила, диалоги, условия, награды).
2. Зарегистрировать в реестре ивентов (`events.json`) и связать с сюжетной точкой (`story.json`).
3. Убедиться, что указанная механика покрыта модулем (`Match3Module`/`BlastModule`), при необходимости — расширить модуль.
4. Запуск — через `EventManager.start(id)`; контенто-независимую логику не дублировать.

### Добавить диалог

1. Описать в `dialogues.json`: `id`, список реплик (`speaker`, `portrait`, `text`, `nextRef`/действия).
2. Использовать `DialogueSystem.start(dialogId)` из сцены/ивента.
3. Портреты и тексты — по ключам, без прямых ссылок на ассеты в коде.

### Добавить dev-команду

См. `docs/debug-console.md` — регистрация в `BuiltinCommands.registerAll()`.

## Конвенции именования

- Файлы/классы — `PascalCase` (компоненты — `XxxComponent`-суффикс не обязателен, но унаследовано: `GoldNugget`, `StatLabel`, `Townhall`).
- Методы/поля — `camelCase`; приватные — `_prefix`.
- Сцены — `PascalCase` файлы (`TownHall.fire`), префабы — `Name.prefab`.
- Конфиги — `kebab-case` (`global-config.json`, `match3_tutorial.json` — пример из плана; финальный стиль выбрать при реализации).
- Известные исключения: `BootSceene` (опечатка), `Mine_Enter.jpeg`/`Mine_Inner.jpeg` — оставлены как есть, менять только если есть задача.

## Ручная проверка

- Запуск: открыть `BootSceene.fire` → Play. Ожидание: «Loading...» → TownHall.
- Dev-консоль: `` ` `` → команды (`addGold`/`setGold` сейчас сломаны — P1).
- Экономика: купить шахтёра → доход/сек и цена растут; тап по самородку → +1 золото (в Mine; в TownHall самородок — индикатор, тап не работает by design).
- Сохранение: обновить страницу/перезапустить → золото и рабочие сохранились.

Проверено 27.10.2026 (см. `docs/status-and-roadmap.md`).

## Что НЕ делать без отдельной задачи

- Не удалять `legacy/` — это задел ивент-механик.
- Не переименовывать `BootSceene` / `Mine_Enter` / `Mine_Inner` (ломка ссылок в `.fire` и `.meta`).
- Не добавлять зависимостей без подтверждения.
- Не «чистить» `.meta` вручную — управление через Cocos Creator.
- Не хардкодить гейм-дизайновые значения в коде (цены, эффекты, условия, тексты) — вместо этого заводить конфиг.