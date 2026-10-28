import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;
import {StatKind} from "../../../services/stats/StatKind";

/**
 * Одна строка ресурс-бара, задаётся в инспекторе префаба сцены.
 * Порядок записей в массиве задаёт порядок отображения.
 * Значение `id` - ключ ресурса (например, 'gold') или config id шахтёра (например, 'dwarf').
 */
@ccclass('ResourceBarEntry')
export class ResourceBarEntry {
    @property({type: cc.Enum(StatKind), tooltip: 'Вид статистики'})
    public kind: StatKind = StatKind.RESOURCE;

    @property({tooltip: 'Ключ ресурса или config id шахтёра'})
    public id: string = '';
}