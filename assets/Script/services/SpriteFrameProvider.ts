import {IconMap} from "../components/ui/IconMap";

/**
 * Центральный реестр иконок.
 *
 * Загружает префаб assets/resources/ui/icon-map (data-компонент IconMap), читает
 * его mappings (ключ -> перетащенный SpriteFrame) и складывает в кэш.
 * Все места, где нужна иконка по ключу из конфигов, обращаются сюда через
 * getSpriteFrame(key).
 *
 * Если ключ не зарезолвлен (нет записи в префабе или спрайт отсутствует) — пишем
 * warn с ключом и возвращаем magenta-заглушку, чтобы контент-менеджер сразу видел
 * проблему, но игра продолжала работать.
 */
export class SpriteFrameProvider {
    private static _instance: SpriteFrameProvider;

    public static get instance(): SpriteFrameProvider {
        if (!this._instance) {
            this._instance = new SpriteFrameProvider();
        }
        return this._instance;
    }

    private readonly ICON_MAP_PREFAB = 'ui/icon-map';

    private readonly _frames: Map<string, cc.SpriteFrame> = new Map();
    private _loading: Promise<void> | null = null;
    private _fallbackFrame: cc.SpriteFrame | null = null;

    public get isLoaded(): boolean {
        return this._loading !== null;
    }

    public load(): Promise<void> {
        if (this._loading) {
            return this._loading;
        }

        this._loading = new Promise((resolve) => {
            cc.resources.load(this.ICON_MAP_PREFAB, cc.Prefab, (err, prefab) => {
                if (err || !prefab) {
                    cc.warn(`SpriteFrameProvider: icon-map prefab not found (${this.ICON_MAP_PREFAB}). Icons will fall back to magenta. Error: ${err ? err.message : ''}`);
                    resolve();
                    return;
                }

                try {
                    this.collectFrames(prefab);
                } catch (error) {
                    cc.warn(`SpriteFrameProvider: failed to build icon map: ${error.message}`);
                }
                resolve();
            });
        });

        return this._loading;
    }

    private collectFrames(prefab: cc.Prefab) {
        const node = cc.instantiate(prefab);
        const iconMap = node.getComponent(IconMap);

        if (!iconMap || !iconMap.mappings || iconMap.mappings.length === 0) {
            cc.warn('SpriteFrameProvider: icon-map has no mappings.');
            node.destroy();
            return;
        }

        for (const mapping of iconMap.mappings) {
            if (!mapping || !mapping.key) {
                continue;
            }
            this._frames.set(mapping.key, mapping.spriteFrame);
        }

        node.destroy();
        cc.log(`SpriteFrameProvider: loaded ${this._frames.size} icon mappings`);
    }

    public getSpriteFrame(key: string): cc.SpriteFrame {
        if (!key) {
            cc.warn('SpriteFrameProvider: getSpriteFrame called with empty key');
            return this.getFallbackFrame();
        }

        const frame = this._frames.get(key);
        if (frame) {
            return frame;
        }

        cc.warn(`SpriteFrameProvider: no sprite mapped for key "${key}"`);
        return this.getFallbackFrame();
    }

    private getFallbackFrame(): cc.SpriteFrame {
        if (this._fallbackFrame) {
            return this._fallbackFrame;
        }

        const size = 16;
        const data = new Uint8Array(size * size * 4);
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255;     // R
            data[i + 1] = 0;   // G
            data[i + 2] = 255; // B -> magenta
            data[i + 3] = 255; // A
        }

        const texture = new cc.Texture2D();
        texture.initWithData(data, cc.Texture2D.PixelFormat.RGBA8888, size, size);

        const frame = new cc.SpriteFrame();
        frame.setTexture(texture, new cc.Rect(0, 0, size, size));

        this._fallbackFrame = frame;
        return frame;
    }
}