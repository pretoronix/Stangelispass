module.exports = {
    preset: 'jest-expo',
    setupFiles: ['<rootDir>/jest/setupEnv.js'],
    setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-qrcode-svg)',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^expo$': '<rootDir>/jest/expoMock.js',
        '^expo(/.*)?$': '<rootDir>/jest/expoMock.js',
    },
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};
