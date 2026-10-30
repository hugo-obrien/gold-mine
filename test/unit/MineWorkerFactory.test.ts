import {MineWorkerFactory} from '../../assets/Script/services/MineWorkerFactory';
import {Miner} from '../../assets/Script/model/units/Miner';
import {Dwarf} from '../../assets/Script/model/units/Dwarf';
import {MineWorkerTypes} from '../../assets/Script/model/units/Worker';

const cc = (global as any).cc;

describe('MineWorkerFactory', () => {
    beforeEach(() => {
        cc.warn.mockClear();
    });

    it('createByType(MINER) возвращает Miner', () => {
        expect(MineWorkerFactory.createByType(MineWorkerTypes.MINER)).toBeInstanceOf(Miner);
    });

    it('createByType(DWARF) возвращает Dwarf', () => {
        expect(MineWorkerFactory.createByType(MineWorkerTypes.DWARF)).toBeInstanceOf(Dwarf);
    });

    it('createByData возвращает рабочих по типу', () => {
        expect(MineWorkerFactory.createByData({type: MineWorkerTypes.MINER})).toBeInstanceOf(Miner);
        expect(MineWorkerFactory.createByData({type: MineWorkerTypes.DWARF})).toBeInstanceOf(Dwarf);
    });

    it('неизвестный тип → null и cc.warn', () => {
        const worker = MineWorkerFactory.createByType(999 as any);
        expect(worker).toBeNull();
        expect(cc.warn).toHaveBeenCalled();
    });

    it('неизвестный тип в createByData → null', () => {
        expect(MineWorkerFactory.createByData({type: 999 as any})).toBeNull();
    });
});