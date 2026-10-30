/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/test/setup.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {tsconfig: 'tsconfig.test.json'}],
    },
    testMatch: ['**/test/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    clearMocks: true,
};