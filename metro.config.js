const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure Metro can handle TypeScript files properly
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
};

// Configure resolver for TypeScript and platform-specific files
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'ts', 'tsx'],
  platforms: ['ios', 'android', 'native', 'web'],
  alias: {
    '@': path.resolve(__dirname),
  },
};

// Ensure proper Metro server configuration
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Handle TypeScript imports properly
      if (req.url && req.url.endsWith('.ts')) {
        req.url = req.url.replace('.ts', '.js');
      }
      if (req.url && req.url.endsWith('.tsx')) {
        req.url = req.url.replace('.tsx', '.js');
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;