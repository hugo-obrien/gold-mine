import {Resource} from '../../assets/Script/model/resources/Resource';

describe('Resource', () => {
    it('создаёт ресурс с заданным количеством', () => {
        const r = new Resource('gold', 10);
        expect(r.typeId).toBe('gold');
        expect(r.amount).toBe(10);
    });

    it('добавляет и расходует количество', () => {
        const r = new Resource('gold', 10);
        r.add(5);
        expect(r.amount).toBe(15);
        expect(r.spend(3)).toBe(true);
        expect(r.amount).toBe(12);
    });

    it('spend больше, чем есть — false и без изменения', () => {
        const r = new Resource('gold', 5);
        expect(r.spend(6)).toBe(false);
        expect(r.amount).toBe(5);
    });

    it('setAmount меняет количество', () => {
        const r = new Resource('gold', 0);
        r.setAmount(42);
        expect(r.amount).toBe(42);
    });

    it('toSaveData возвращает тип и количество', () => {
        const r = new Resource('gold', 7);
        expect(r.toSaveData()).toEqual({typeId: 'gold', amount: 7});
    });

    it.each([
        [null, 0],
        ['', 0],
        ['gold', -1],
    ])('невалидные аргументы (%p, %p) бросают', (typeId, amount) => {
        expect(() => new Resource(typeId as string, amount as number)).toThrow();
    });

    it.each([
        ['add', -1],
        ['spend', -1],
        ['setAmount', -1],
    ])('отрицательное количество в %s бросает', (method, amount) => {
        const r = new Resource('gold', 10);
        expect(() => (r as any)[method](amount)).toThrow();
    });
});