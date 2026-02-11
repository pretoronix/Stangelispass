module.exports = function (api) {
    api.cache(true);
    const isTest = process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test';
    const plugins = [];
    if (!isTest) {
        plugins.push('react-native-reanimated/plugin');
    }
    return {
        presets: ['babel-preset-expo'],
        plugins,
    };
};
