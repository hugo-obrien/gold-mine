import {createCcMock} from './cc-mock';

// Гарантируем глобальный cv до инициализации тестовых модулей.
(global as any).cc = createCcMock();