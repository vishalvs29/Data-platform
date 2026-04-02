module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.api.json',
        }],
    },
    testMatch: [
        '**/tests/**/*.test.ts',
    ],
    setupFilesAfterEnv: [],
    verbose: true,
};
