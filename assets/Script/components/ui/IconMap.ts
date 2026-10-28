import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;
import {IconMapping} from "./IconMapping";

/**
 * Data-компонент префаба assets/resources/ui/icon-map.
 * Не рисует ничего: это "мешок данных" для центрального реестра иконок.
 * Контент-менеджер добавляет строки (кнопка "+" в инспекторе), задаёт ключ
 * и перетаскивает нужный SpriteFrame из атласа.
 */
@ccclass
export class IconMap extends cc.Component {
    @property([IconMapping])
    public mappings: IconMapping[] = [];
}