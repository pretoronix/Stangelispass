// Pin the timezone before worker processes are forked so date-dependent tests
// (e.g. the Early Bird / Night Owl achievement tests, written against local CET)
// are deterministic regardless of the host/CI timezone. This must live here in
// the parent process; setting it later (e.g. in a setupFile) is too late because
// V8 caches the timezone on first use. Honors an existing TZ override.
process.env.TZ = process.env.TZ || 'Europe/Zurich';

module.exports = {
    preset: 'jest-expo',
    setupFiles: ['<rootDir>/jest/setupEnv.js'],
    setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
    coverageReporters: ['text', 'json-summary', 'lcov'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/__tests__/**',
        '!src/**/?(*.)+(spec|test).[jt]s?(x)',
        '!src/**/jest/**',
    ],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-qrcode-svg)',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^expo$': '<rootDir>/jest/expoMock.js',
        '^expo(/.*)?$': '<rootDir>/jest/expoMock.js',
    },
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/helpers/',
        '/__tests__/fixtures/',
    ],
    coverageThreshold: {
        global: {
            // Ratchet baseline: prevent coverage regressions without blocking the current state.
            // "Changed-files" enforcement is implemented in `scripts/coverageRatchet.mjs`.
            branches: 41,
            functions: 45,
            lines: 54,
            statements: 53,
        },
    },
};
