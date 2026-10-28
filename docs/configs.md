# Конфиги

Все игровые данные (кроме UI-заглушек) лежат в `assets/resources/configs/` и грузятся через `cc.resources`.

> **Принцип (ключевое требование):** всё, что относится к гейм-дизайну, должно настраиваться через файлы конфигов. Правка JSON — основной способ настройки; код трогается только для добавления *нового типа* данных/логики, а не для изменения значений.

## Текущий формат

### global-config.json

```json
{
  "defaultPriceMultiplier": 1.15,
  "maxOfflineSeconds": 28800
}
```

| Ключ | Тип | Смысл | Где используется |
| --- | --- | --- | --- |
| `defaultPriceMultiplier` | number | множитель цены следующего рабочего | `GameManager.getNextWorkerPrice()` |
| `maxOfflineSeconds` | number | лимит оффлайн-дохода (сек) | `GameManager.processPostLoad()` |

Обработка:

- `ConfigLoader.loadGlobalConfig()` → `cc.resources.load("configs/global-config", cc.JsonAsset, …)`.
- `ConfigData` читает значения по именам из `ConfigKey` (`ConfigKeys.ts`).
- Тип проверяется через `ConfigParser` (`NUMBER`, `STRING`, `BOOLEAN`, `STRING_ARRAY`). Отсутствующий ключ → `cc.error` + исключение.

### workers.json — реестр рабочих

```json
{
  "workers": [
    {
      "id": "miner",
      "nameKey": "worker.miner",
      "icon": "miner",
      "goldPerSecond": 0.25,
      "basePrice": 10
    },
    {
      "id": "dwarf",
      "nameKey": "worker.dwarf",
      "icon": "dwarf",
      "goldPerSecond": 1,
      "basePrice": 25
    }
  ]
}
```

| Поле | Тип | Обязательно | Смысл |
| --- | --- | --- | --- |
| `id` | string | да | идентификатор рабочего (соответствует `MineWorkerTypes`) |
| `goldPerSecond` | number | да | пассивный доход |
| `basePrice` | number | да | базисная цена при покупке |
| `icon` | string | нет | ключ иконки |
| `nameKey` | string | нет | ключ локализации имени |

Обработка:

- `WorkerConfigLoader.load()` → `cc.resources.load('configs/workers', cc.JsonAsset, …)`.
- Записи без `id` или без `goldPerSecond`/`basePrice` пропускаются с `cc.warn`.
- `Miner.goldPerSecond`/`defaultPrice` и `Dwarf.goldPerSecond`/`defaultPrice` берутся из реестра по своему `id`.
- `GameManager.getNextWorkerPrice(type)` использует `basePrice` нужного типа; `WorkersScreen` строит UI (имя, нанято, цена, кнопка) из `getAllConfigs()` — при добавлении рабочего редактировать сцену не нужно.

### resources.json

```json
{
  "resources": [
    { "id": "gold", "icon": "gold" },
    { "id": "food", "icon": "food" }
  ]
}
```

| Поле | Тип | Обязательно | Смысл |
| --- | --- | --- | --- |
| `id` | string | да | идентификатор ресурса (совпадает с `ResourceType`) |
| `icon` | string | нет | имя иконки |
| `maxAmount` | number | нет | лимит накопления; если нет — без лимита |

Обработка:

- `ResourceConfigLoader.load()` → `cc.resources.load('configs/resources', cc.JsonAsset, …)`.
- Базовые типы (`gold`, `food`) регистрируются как дефолты до чтения файла (`registerBaseDefaults`).
- Записи без `id` пропускаются с `cc.warn`.
- `hasLimit` возвращает `maxAmount !== Infinity`.

## Как добавить новый параметр в global-config

1. Добавить ключ в `assets/resources/configs/global-config.json`.
2. Добавить значение в enum `ConfigKey` (`assets/Script/configs/ConfigKeys.ts`) и в `ConfigKeyTypes` (тип: `ConfigType.NUMBER`).
3. Добавить поле в `ConfigData` (`assets/Script/configs/ConfigData.ts`): `this.newKey = this.getValue<number>(rawData, ConfigKey.NEW_KEY)`.
4. Использовать через `ConfigLoader.instance.globalConfig.newKey`.

Пример (цена входа в шахту):

```ts
export enum ConfigKey {
    PRICE_MULTIPLIER = "defaultPriceMultiplier",
    MAX_OFFLINE_SECONDS = "maxOfflineSeconds",
    MINE_ENTRY_PRICE = "mineEntryPrice"   // новый
}

export const ConfigKeyTypes: Record<ConfigKey, ConfigType> = {
    [ConfigKey.PRICE_MULTIPLIER]: ConfigType.NUMBER,
    [ConfigKey.MAX_OFFLINE_SECONDS]: ConfigType.NUMBER,
    [ConfigKey.MINE_ENTRY_PRICE]: ConfigType.NUMBER
};
```

```ts
// ConfigData
public readonly mineEntryPrice: number;
// в конструкторе:
this.mineEntryPrice = this.getValue<number>(rawData, ConfigKey.MINE_ENTRY_PRICE);
```

5. Перезапустить сцену (конфиги кэшируются в `ConfigLoader`, повторной загрузки внутри сессии нет).

## Как добавить нового рабочего (реестр)

1. Добавить запись в `assets/resources/configs/workers.json` (id, goldPerSecond, basePrice, опционально icon/nameKey).
2. Добавить значение в `MineWorkerTypes` (`assets/Script/model/units/Worker.ts`).
3. Добавить класс рабочего (примеры: `Miner`, `Dwarf`) — `goldPerSecond`/`defaultPrice` читаются из `WorkerConfigLoader`.
4. Добавить `case` в `MineWorkerFactory.createByType` / `createByData` (вернуть экземпляр или `null`).
5. Добавить маппинг `id → MineWorkerTypes` в `WorkersScreen.typeFromConfigId`.
6. Строка в `WorkersScreen` появится автоматически из реестра (правка сцены не требуется).

## Как добавить новый ресурс

1. Добавить тип в `ResourceType` (`assets/Script/model/resources/Resource.ts`).
2. Добавить запись в `assets/resources/configs/resources.json` (id + опционально icon/maxAmount).
3. При необходимости добавить в `getAllBaseResourceTypes()`.

Сохранение и лимиты подхватятся автоматически через `Inventory` / `ResourceConfigLoader`.

## План: конфиг-драйвен платформа

### Требования

- Гейм-дизайнер меняет **только JSON**, не трогая редактор и код.
- Все «материалы» (спрайты, фоны, тайлы, портреты, префабы UI) задаются **ключами** (строками), а не прямыми ссылками на ассеты.
- Типизированная загрузка: чистый `any`-подход в `ConfigData` заменяется универсальным `ConfigParser`, умеющим `number | string | boolean | enum | string[] | ResourceRef | SpriteRef | nested configs`.
- Ошибка конфига должна давать понятное имя файла/поля (сейчас — только сообщение без пути).

### Предлагаемая структура каталога конфигов

```
assets/resources/configs/
  global-config.json        # экономика (существует)
  resources.json            # ресурсы (существует)
  buildings.json            # здания города (план)
  workers.json              # типы/параметры рабочих (план)
  dialogues.json            # диалоги (план)
  events.json               # реестр ивентов (план)
  events/
    match3_tutorial.json    # контент конкретного ивента (план)
    blast_forest.json       # контент blast-ивента (план)
  story.json                # сюжетные точки и триггеры (план)
  ui/                       # ключи→спрайты/префабы (план)
```

### Схемы (черновик, финализировать при реализации)

**events.json**

```json
{
  "type": "match3",
  "id": "match3_tutorial",
  "background": "bg_mine",
  "tiles": ["iron", "gold", "diamond"],
  "rules": { "rows": 9, "cols": 9, "tileSize": 33, "maxTurns": 20 },
  "win": { "score": 500 },
  "lose": { "turns": 0 },
  "dialogues": ["match3_intro"],
  "reward": { "gold": 100, "unlockBuilding": "sawmill" }
}
```

**dialogues.json**

```json
{
  "id": "match3_intro",
  "lines": [
    { "speaker": "miner", "portrait": "miner", "text": "Смотри, какие жилы!" },
    { "speaker": "boss",  "portrait": "boss",  "text": "Осторожно, это ловушка." }
  ]
}
```

**buildings.json**

```json
{
  "id": "sawmill",
  "nameKey": "building.sawmill",
  "cost": { "gold": 500 },
  "effect": { "incomeMultiplier": 1.1 },
  "requirements": { "storyPoint": "mine_opened" },
  "maxCount": 1
}
```

**story.json** (триггеры ивентов)

```json
{
  "events": [
    {
      "id": "event_1",
      "trigger": { "type": "resource", "resource": "gold", "amount": 100 },
      "dialog": "match3_intro",
      "event": "match3_tutorial",
      "onComplete": { "unlockBuilding": "sawmill" }
    }
  ]
}
```

Указанные схемы — **предложение**, финальные названия/поля зафиксируются при реализации (см. roadmap).

## Ограничения текущей реализации

- `ConfigParser` поддерживает `NUMBER | STRING | BOOLEAN | STRING_ARRAY`; enum-типы, вложенные объекты и ссылки на ресурсы (`ResourceRef`/`SpriteRef`) ещё не поддерживаются.
- `ConfigLoader` не хранит статистику повторных загрузок: если `loadConfig()` вызвать дважды, он загрузит заново (защита от двойной инициализации есть только в `GameManager`).
- Ошибка конфига валит запуск (`LoadingScreen` покажет `Failed to load game.`).
- Для конфиг-драйвена фич (ивенты/диалоги/здания) нужно расширение `ConfigParser` — это первый шаг roadmap.