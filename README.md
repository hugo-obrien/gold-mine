# Gold Mine

Прототип игры про золотую шахту на **Cocos Creator 2.4.15** (TypeScript).
Игра строится вокруг **нескольких игровых петель**, собираемых из конфигов:

1. **Idle/Clicker/City Builder** — основной цикл заработка: тапы по самородку, покупка шахтёров, пассивный доход, постройка города.
2. **Сюжетные ивенты (Match-3 / Blast)** — в определённые сюжетные моменты открываются события с match-3 и blast-механиками; это динамические сцены, содержимое которых описывается конфигом.
3. **Диалоги** — простой фреймворк «2 портрета + поле текста», завязанный на сюжетные точки.

> Рабочее название проекта. `project.json` всё ещё содержит `"name": "HelloWorld"`.

## Ключевой принцип

**Конфиг-драйвен.** Всё, что относится к гейм-дизайну (цены, условия, составы/содержимое сцен, диалоги, ивенты), должно настраиваться файлами конфигов без захода в редактор. См. `docs/configs.md`.

## Стек

| Что | Версия / детали |
| --- | --- |
| Движок | Cocos Creator 2.4.15 |
| Язык | TypeScript (es5, commonjs, декораторы) |
| Сохранения | `cc.sys.localStorage` |
| Конфиги | JSON в `assets/resources/configs/`, загрузка через `cc.resources` |

## Быстрый старт

1. Открыть проект в Cocos Creator **2.4.x** (проект создан под 2.4.15).
2. Открыть стартовую сцену `assets/Scene/BootSceene.fire`.
3. Нажать Play. Загрузчик сам поднимет конфиги, `GameManager`, dev-консоль (только в сборке с `CC_DEBUG`) и перейдёт в `TownHall`.
4. В превью dev-консоль открывается клавишей `` ` `` (обратный апостроф).

Сборка — штатное меню Cocos Creator (Project → Build). Отдельных скриптов запуска/тестов в репозитории нет.

## Структура проекта

```
assets/
  Scene/            # .fire-сцены (BootSceene, TownHall, Mine, Buildings, Workers, legacy/TapClapTest)
  Script/
    GameInitializer.ts   # гарантирует инициализацию GameManager на сцене
    GlobalEvent.ts       # глобальная шина событий + GameEvent
    managers/            # GameManager, SaveManager, SceneManager
    configs/             # загрузка и парсинг JSON-конфигов
    model/               # Inventory, ресурсы (gold/food), рабочие (Worker/Miner)
    services/            # MineWorkerFactory
    components/          # cc.Component: сцены (LoadingScreen, Townhall) и UI (GoldNugget, StatLabel, SceneButton)
    utils/               # форматирование чисел, генерация ключей
    debug/               # dev-консоль: DebugConsole, DebugTrigger, CommandRegistry, BuiltinCommands
    legacy/              # задел match-3/blast механик (для ивентов); сейчас не подключён к основной игре
  resources/
    configs/             # global-config.json, resources.json
    prefabs/             # DebugConsole.prefab
    raw/                 # фоновые картинки сцен
  Texture/               # арт (gold-nugget, тестовые тайлы/UI из legacy)
```

## Документация

| Документ | О чём |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Слои, игровые петли, синглтоны, жизненный цикл запуска, события |
| [docs/gameplay.md](docs/gameplay.md) | Игровые циклы, сцены, экономика, ивенты, диалоги, оффлайн-доход, сохранение |
| [docs/configs.md](docs/configs.md) | Конфиги: формат, расширение парсера, план схем для ивентов/сцен/диалогов |
| [docs/debug-console.md](docs/debug-console.md) | Dev-консоль: команды, как добавить свою |
| [docs/development.md](docs/development.md) | Правила разработки, конфиг-драйвен, типовые задачи |
| [docs/status-and-roadmap.md](docs/status-and-roadmap.md) | Состояние, известные проблемы, roadmap реализации фич |

## Известные проблемы (кратко)

- `addGold` / `setGold` в dev-консоли обращаются к несуществующим методам `GameManager` — команды падают (`assets/Script/debug/commands/BuiltinCommands.ts:11-31`).
- Экономика шахтёра захардкожена в `Miner.ts` (TODO: перенести в конфиги).
- Оффлайн-доход не ограничен по времени (`GameManager.ts:136-143`).
- `ConfigParser` поддерживает только `NUMBER` — для конфиг-драйвена ивентов/диалогов потребуется расширить типы.
- `legacy/` (match-3) к игре не подключён — это осознанно: он станет основой ивентов; сцена `TapClapTest.fire` ссылается на скрипт, отсутствующий в текущих `.meta`.

Подробности и приоритеты: [docs/status-and-roadmap.md](docs/status-and-roadmap.md).