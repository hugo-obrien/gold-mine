import {SceneManager, SceneName} from '../../assets/Script/managers/SceneManager';
import {resetSingletons} from '../helpers';

describe('SceneManager', () => {
    beforeEach(() => {
        resetSingletons();
        (global as any).cc.warn.mockClear();
        (global as any).cc.error.mockClear();
        (global as any).cc.director.loadScene.mockClear();
    });

    afterEach(() => {
        resetSingletons();
    });

    it('loadScene(TOWN_HALL) вызывает cc.director.loadScene с "TownHall"', () => {
        SceneManager.instance.loadScene(SceneName.TOWN_HALL);
        const loadScene = (global as any).cc.director.loadScene;
        expect(loadScene).toHaveBeenCalledWith('TownHall', expect.any(Function));
    });

    it('loadScene(MINE) вызывает "Mine"', () => {
        SceneManager.instance.loadScene(SceneName.MINE);
        expect((global as any).cc.director.loadScene).toHaveBeenCalledWith('Mine', expect.any(Function));
    });

    it('повторный вызов во время загрузки — предупреждение и без перехода', () => {
        const sm = SceneManager.instance;
        sm.loadScene(SceneName.TOWN_HALL);
        // _isLoading ещё true (callback не вызван).
        sm.loadScene(SceneName.MINE);
        const loadScene = (global as any).cc.director.loadScene;
        expect(loadScene).toHaveBeenCalledTimes(1);
        expect((global as any).cc.warn).toHaveBeenCalled();
    });

    it('неизвестный SceneName — cc.error и без перехода', () => {
        SceneManager.instance.loadScene(999 as any);
        expect((global as any).cc.director.loadScene).not.toHaveBeenCalled();
        expect((global as any).cc.error).toHaveBeenCalled();
    });

    it('после callback _isLoading сбрасывается, следующий переход работает', () => {
        const sm = SceneManager.instance;
        sm.loadScene(SceneName.TOWN_HALL);
        // Получаем колбэк из вызова и вызываем его.
        const callback = (global as any).cc.director.loadScene.mock.calls[0][1];
        callback();
        sm.loadScene(SceneName.MINE);
        expect((global as any).cc.director.loadScene).toHaveBeenCalledTimes(2);
    });
});