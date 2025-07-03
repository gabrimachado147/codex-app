const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure Metro to handle TypeScript files properly
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-preset'),
};

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  resolverMainFields: ['react-native', 'browser', 'module', 'main'],
  unstable_enablePackageExports: true,
  unstable_enableSymlinks: true,
};

module.exports = config;