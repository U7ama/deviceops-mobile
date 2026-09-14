const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const mainApp = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    mainApp.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });
};
