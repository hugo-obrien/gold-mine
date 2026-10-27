# Dev-консоль

Встроенная консоль разработчика. Работает только при `CC_DEBUG` (в редакторе/превью Cocos Creator — обычно включён).

## Включение

`LoadingScreen.loadDebugConsole()`:
1. грузит префаб `assets/resources/prefabs/DebugConsole.prefab` через `cc.resources.load('prefabs/DebugConsole', cc.Prefab, …)`;
2. инстанциирует его, добавляет как persist-узел `DebugConsoleRoot`;
3. вызывает `BuiltinCommands.registerAll()`.

Префаб содержит `DebugConsole` (панель, лог, EditBox) и `DebugTrigger` (слушатель клавиш).

## Открытие/закрытие

- Клавиша `` ` `` (обратный апостроф, `cc.macro.KEY.grave`) — `DebugTrigger.onKeyDown()` → `DebugConsole.toggle()`.
- Команда `console` внутри консоли.

## Лог

- `DebugConsole.appendLog(message)` — добавляет строку, максимум 100 строк (`MAX_LOG_LINES = 100`), автоскролл вниз.
- Команда выполняется по `editing-return` в `inputBox`.

## Доступные команды

Источник: `assets/Script/debug/commands/BuiltinCommands.ts`.

| Команда | Аргументы | Описание | Статус |
| --- | --- | --- | --- |
| `addGold [amount]` | number (по умолчанию 1000) | добавить золото | ⚠️ сломан: вызывает несуществующий `GameManager.addGold()` |
| `setGold <amount>` | number (обязателен) | установить золото точно | ⚠️ сломан: `(GameManager as any)._gold` и `notifyScoreChanged()` не существуют |
| `reset` | — | `SaveManager.clearAll()` + `cc.game.restart()` | работает |
| `fps` | — | переключить `cc.debug.setDisplayStats` | работает |
| `scene <name>` | имя сцены | `cc.director.loadScene(name)` | работает (без проверки имени) |
| `console` | — | переключить видимость консоли | работает, регистрируется в `DebugConsole.onLoad` |

Неизвестная команда: `Unknown command. Slowly remove your hands from console`. Ошибка выполнения: `Failed: <message>`.

## Как добавить команду

1. Создать/дополнить регистрацию в `BuiltinCommands.registerAll()` (или своём модуле) :

```ts
CommandRegistry.instance.register({
    name: 'myCommand',
    description: 'What it does. Usage: myCommand <arg>',
    execute: (args) => {
        const value = Number(args[0]);
        // действие
    }
});
```

2. `register` регистрирует имя в нижнем регистре; повторная регистрация перезаписывает с `cc.warn`.
3. Выполнение идёт через `CommandRegistry.execute(input)`: `name` + аргументы через `split(/\s+/)`, возвращает `OK` или `Failed: …`.

## Примечания

- `CommandRegistry` — singleton; команды сохраняются между сценами, пока жив префаб `DebugConsole` (persist).
- `DebugConsole.instance` задаётся в `onLoad`; при дубликате узла — уничтожается, остаётся первый.
- Сломанные команды `addGold`/`setGold` — см. `docs/status-and-roadmap.md`; правильный путь: добавить методы в `GameManager` (`addGold`, `setGold` + событие `RESOURCE_CHANGED`), а не трогать приватные поля.