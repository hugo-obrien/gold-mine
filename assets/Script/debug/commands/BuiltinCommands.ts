import {CommandRegistry} from "../CommandRegistry";
import {GameManager} from "../../managers/GameManager";
import {DebugConsole} from "../DebugConsole";
import {SaveManager} from "../../managers/SaveManager";

export class BuiltinCommands {
    public static registerAll() {
        CommandRegistry.instance.register({
            name: `addGold`,
            description: `Add gold. Usage: addGold [amount]`,
            execute: (args) => {
                const amount = Number(args[0]) || 1000;
                GameManager.instance.addGold(amount);
                DebugConsole.instance?.appendLog(`Added ${amount} gold. Total: ${GameManager.instance.gold}`);
            }
        });

        CommandRegistry.instance.register({
            name: 'setGold',
            description: 'Set gold to exact value. Usage: setGold <amount>',
            execute: (args) => {
                const amount = Number(args[0]);
                if (isNaN(amount) || amount < 0) {
                    DebugConsole.instance?.appendLog(`Invalid amount: ${args[0]}`);
                    return;
                }

                GameManager.instance.setGold(amount);
                DebugConsole.instance?.appendLog(`Gold set to ${amount}`);
            }
        });

        CommandRegistry.instance.register({
            name: 'reset',
            description: 'Reset saved data',
            execute: () => {
                SaveManager.instance.clearAll();
                cc.game.restart();
            }
        });

        CommandRegistry.instance.register({
            name: 'fps',
            description: 'Toggle FPS display',
            execute: () => {
                cc.debug.setDisplayStats(!cc.debug.isDisplayStats());
            }
        });

        CommandRegistry.instance.register({
            name: 'scene',
            description: 'Load scene by name. Usage: scene <name>',
            execute: (args) => {
                const sceneName = args[0];
                if (!sceneName) {
                    DebugConsole.instance?.appendLog('Usage: scene <name>');
                    return;
                }

                cc.director.loadScene(sceneName);
                DebugConsole.instance?.appendLog(`Loading scene: ${sceneName}`);
            }
        })
    }
}