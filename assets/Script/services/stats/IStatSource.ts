import {StatKind} from "./StatKind";

/**
 * Источник значения для элемента ресурс-бара.
 *
 * Каждый вид статистики (ресурсы, шахтёры и т.д.) реализует этот интерфейс.
 * Бар не знает, откуда берутся данные: он вызывает getValue/getIconKey и
 * подписывается на changeEvent, чтобы обновлять только свои элементы.
 */
export interface IStatSource {
    /** Вид статистики, по которому бар выбирает источник для записи. */
    readonly kind: StatKind;

    /** Событие GlobalEvent, после которого значение этого вида могло измениться. */
    readonly changeEvent: string;

    getValue(id: string): number;

    getIconKey(id: string): string;
}