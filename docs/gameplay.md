# Геймплей

## Игровые петли

Игра строится из нескольких петель, которые переключаются по сюжетным точкам:

### Петля 1: Idle / Clicker / City Builder (основная)

1. **Boot → Loading**: конфиги + `GameManager` + (в debug) консоль.
2. **TownHall**: игрок видит золото, количество рабочих, доход/сек; покупка рабочих перенесена на сцену Workers.
3. **Mine**: тап по самородку `gold-nugget` → `+1` золото.
4. **Workers**: найм рабочих из реестра (`workers.json`) — строка на тип: имя, нанято, цена, кнопка «Hire».
5. **Buildings**: заглушка; по плану — постройка зданий города.
6. Золото копится автоматически: `goldPerSecond * dt` каждый кадр.

Итого: **активный клик** (Mine) + **пассивный доход** (рабочие) + **покупка рабочих** (Workers) + **здания** (Buildings, план).

### Петля 2: Сюжетные ивенты (Match-3 / Blast)

По достижению сюжетных условий запускается ивент: динамическая сцена с match-3 или blast-механикой. Содержание (фон, тайлы, условия победы, диалоги, награды) задаётся конфигом ивента. После ивента игрок возвращается к основной петле с наградами/открытиями.

### Петля 3: Диалоги

В сюжетные моменты показывается простой диалог: **2 портрета (слева/справа) + поле текста между ними**. Диалоги описываются конфигом и могут запускаться как внутри ивента, так и в обычных сценах.

Матрица «когда что»:

| Состояние | Активная механика |
| --- | --- |
| База | Idle/Clicker + City Builder |
| Сюжетная точка | Диалог → Ивент (Match-3/Blast) → награда → возврат на базу |

## Сцены

| Файл | Сцена | Назначение | Статус |
| --- | --- | --- | --- |
| `assets/Scene/BootSceene.fire` | Boot | стартовая сцена, `LoadingScreen` | работает |
| `assets/Scene/TownHall.fire` | TownHall | ратуша: статы, переходы; покупка рабочих перенесена в Workers | работает |
| `assets/Scene/Mine.fire` | Mine | шахта: тап по самородку, счётчик золота, переход назад | работает |
| `assets/Scene/Buildings.fire` | Buildings | заглушка: будущий City Builder | план |
| `assets/Scene/Workers.fire` | Workers | найм рабочих: строки из реестра, цена, кнопка Hire, disable | работает |
| `assets/Scene/legacy/TapClapTest.fire` | legacy | тестовая match-3 сцена (задел ивентов) | ревизия при подключении |

Переходы: `SceneButton` (дропдаун `targetScene`) → `SceneManager.loadScene`. `SceneManager` маппит `SceneName` → строку имени сцены, защищается от повторных переходов.

> План: ивенты — это **динамические сцены**, которые собираются из конфига (`EventScene.fire` + loader по `eventId`), а не отдельные `.fire`-файлы на каждый ивент.

## Экономика

Параметры типов рабочих задаются в `assets/resources/configs/workers.json`, общие — в `assets/resources/configs/global-config.json`:

```json
{
  "defaultPriceMultiplier": 1.15,
  "maxOfflineSeconds": 28800
}
```

- Каждый тип рабочего — запись в `workers.json`: `goldPerSecond`, `basePrice`, опционально `icon`/`nameKey`.
- Баланс: miner `0.25`/с, базовая цена `10`; dwarf `1`/с, базовая цена `25`.
- Цена следующего рабочего типа: `floor(basePrice * priceMultiplier^количество_этого_типа)` — см. `GameManager.getNextWorkerPrice(type)`.
- Доход: сумма `goldPerSecond` всех рабочих (каждый тип читает значение из реестра).

### Ресурсы

- `gold` и `food` — базовые типы (`ResourceType`, `ResourceConfigLoader`).
- Предельное количество: `maxAmount` в `assets/resources/configs/resources.json`. Если `maxAmount` не задан — считается `Infinity`, то есть без лимита.
- `Inventory.add` уважает `maxAmount`, `Inventory.spend` не уводит в минус.

### Как работает покупка

UI-найм: `WorkersScreen` строит строки из `WorkerConfigLoader.getAllConfigs()`, кнопка вызывает `GameManager.instance.buyWorker(type)` (тип — из `typeFromConfigId`).

`GameManager.buyWorker(type)`:
1. считает `getNextWorkerPrice(type)` (`basePrice * priceMultiplier^count(type)`);
2. если хватает золота — создаёт рабочего через `MineWorkerFactory.createByType(type)`; при `null` (неизвестный тип) покупка отменяется без списания;
3. списывает цену, добавляет в список, сохраняет состав (`SaveManager.saveWorkers`) и эмитит `WORKERS_CHANGED`/`INCOME_CHANGED` → UI обновляет цену, доход и кнопку;
4. кнопка неактивна (`interactable=false`, opacity 130), когда `gold < price`.

## Город (City Builder) — план

- Здания задаются конфигом (`buildings.json`): `id`, цена, эффект (доход/слоты/улучшение), требования, порядок/лимит постройки.
- Прогресс города влияет на базовые параметры idle-петли (доход, стоимость рабочих и т.п.) через универсальный `BuildingEffect`.
- Награды за ивенты могут открывать/разблокировать здания.

## Ивенты — план

- `events.json` / `events/<id>.json` описывает: `type` (match3/blast), фон, набор тайлов, правил (поле/ходы/боевые параметры), цепочку диалогов, условия победы/поражения, награды.
- Запуск ивента: `EventManager.start(eventId)` по сюжетному триггеру или из dev-консоли.
- После результата ивента — событие результата → сохранение и возврат в `TownHall`.
- Механики match-3/blast переиспользуют код из `assets/Script/legacy/`, но оборачиваются в конфиг-управляемые модули.

## Диалоги — план

- `DialogConfig`: последовательность реплик; реплика = `{ speakerId, portraitKey, text, nextRef | actions }`.
- Портреты по ключам из атласа/`Texture`, тексты — локализуемые строки.
- UI: слева портрет, справа портрет, по центру текстовое поле; переключение по клику/кнопке «Далее».
- `DialogueSystem` умеет: запустить по `dialogId`, дождаться завершения, сообщить о результате; может встраиваться в ивент.
- Данные — в конфиге, без правки кода сценаристом.

## Пассивный доход и оффлайн-доход

- Онлайн: `GameManager.update(dt)` → `Inventory.add(GOLD, goldPerSecond * dt)`.
- Оффлайн: при загрузке `processPostLoad()` берёт `last_timestamp` из `SaveManager`, считает `diffSeconds` и начисляет `income * min(diffSeconds, maxOfflineSeconds)` золота. Лимит `maxOfflineSeconds` (28800 с = 8 ч) задан в `global-config.json`; после начисления `last_timestamp` обновляется.

## Сохранение

Хранится в `cc.sys.localStorage` под ключами:

| Ключ | Содержимое | Кто пишет |
| --- | --- | --- |
| `player_inventory` | массив `{typeId, amount}` | `Inventory.save()` при каждом изменении |
| `mine_workers` | массив `{type, count}` | `SaveManager.saveWorkers()` |
| `last_timestamp` | число (мс) | `SaveManager.saveLastTimestamp()` |

- Загрузка рабочих идёт через `MineWorkerFactory.createByData(type)`; `count` разворачивается в список экземпляров; неизвестные типы (вернул `null`) пропускаются.
- `SaveManager.clearAll()` — полный сброс (использует dev-команда `reset`).
- `GameManager` сохраняет при `cc.game.EVENT_HIDE` и в `onDestroy`.

Замечание: `Inventory.save()` сохраняет только ресурсы с `amount > 0`; нулевые значения при загрузке не восстанавливаются (это задумано как «пустой инвентарь»).

> План: расширить сохранение на прогресс города, сюжетные точки (`storyPointId`), прогресс ивентов и `flag`-ы — через `SaveManager` (отдельные ключи) и единый `SaveData`-реестр.

## Интерфейс

- `StatLabel` поддерживает `StatType.GOLD` (золото) и `StatType.MINER` (число рабочих).
- `WorkersScreen` (сцена Workers): строка на тип рабочего — `name`, `Hired: N`, `Next: price`, кнопка `Hire`; данные берутся из `WorkerConfigLoader`, типы настраиваются в `workers.json`.
- Форматирование больших чисел — `Utils.formatValue` (K/M/B/T/Qa/Qi/Sx, до 3 значащих цифр).
- Кнопка самородка `GoldNugget` (тап = +1 золото) — компонент прикреплён в сцене **Mine** (проверено запуском). В **TownHall** узел `gold-nugget` используется как **индикатор количества золота** и не является кликабельным — это ожидаемое поведение, а не баг.
- Проверка условий в UI — только состояние `GameManager.isInitialized` (см. `StatLabel.refreshValue`).