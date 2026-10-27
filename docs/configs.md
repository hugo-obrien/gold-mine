# Конфиги

Все игровые данные (кроме UI-заглушек) лежат в `assets/resources/configs/` и грузятся через `cc.resources`.

> **Принцип (ключевое требование):** всё, что относится к гейм-дизайну, должно настраиваться через файлы конфигов. Правка JSON — основной способ настройки; код трогается только для добавления *нового типа* данных/логики, а не для изменения значений.

## Текущий формат

### global-config.json

```json
{
  "defaultPriceMultiplier": 1.15,
  "mockMinerPrice": 10
}
```

| Ключ | Тип | Смысл | Где используется |
| --- | --- | --- | --- |
| `defaultPriceMultiplier` | number | множитель цены следующего рабочего | `GameManager.getNextWorkerPrice()` |
| `mockMinerPrice` | number | базовая цена шахтёра | `GameManager.getNextWorkerPrice()` |

Обработка:

- `ConfigLoader.loadGlobalConfig()` → `cc.resources.load("configs/global-config", cc.JsonAsset, …)`.
- `ConfigData` читает значения по именам из `ConfigKey` (`ConfigKeys.ts`): `PRICE_MULTIPLIER = "defaultPriceMultiplier"`, `MOCK_MINER_PRICE = "mockMinerPrice"`.
- Тип проверяется через `ConfigParser` (реализован только `NUMBER`). Отсутствующий ключ → `cc.error` + исключение.

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

## Как добавить новый параметр экономики

1. Добавить ключ в `assets/resources/configs/global-config.json`.
2. Добавить значение в enum `ConfigKey` (`assets/Script/configs/ConfigKeys.ts`) и в `ConfigKeyTypes` (тип: `ConfigType.NUMBER`).
3. Добавить поле в `ConfigData` (`assets/Script/configs/ConfigData.ts`): `this.newKey = this.getValue<number>(rawData, ConfigKey.NEW_KEY)`.
4. Использовать через `ConfigLoader.instance.globalConfig.newKey`.

Пример (цена входа в шахту):

```ts
export enum ConfigKey {
    PRICE_MULTIPLIER = "defaultPriceMultiplier",
    MOCK_MINER_PRICE = "mockMinerPrice",
    MINE_ENTRY_PRICE = "mineEntryPrice"   // новый
}

export const ConfigKeyTypes: Record<ConfigKey, ConfigType> = {
    [ConfigKey.PRICE_MULTIPLIER]: ConfigType.NUMBER,
    [ConfigKey.MOCK_MINER_PRICE]: ConfigType.NUMBER,
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

- `ConfigParser` поддерживает только `NUMBER`; строки и enum-типы вернутся «как есть» с `cc.warn`.
- `ConfigLoader` не хранит статистику повторных загрузок: если `loadConfig()` вызвать дважды, он загрузит заново (защита от двойной инициализации есть только в `GameManager`).
- Ошибка конфига валит запуск (`LoadingScreen` покажет `Failed to load game.`).
- Для конфиг-драйвена фич (ивенты/диалоги/здания) нужно расширение `ConfigParser` — это первый шаг roadmap.