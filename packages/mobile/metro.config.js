const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const escapeRegExp = require('escape-string-regexp');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const coreRoot = path.resolve(monorepoRoot, 'packages/core/src');
const rootReact = path.resolve(monorepoRoot, 'node_modules/react');
const rootReactNative = path.resolve(monorepoRoot, 'node_modules/react-native');
const webPkg = path.resolve(monorepoRoot, 'packages/web');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = false;

// Map @knowlex/core to source so sub-path imports work without `exports` wildcards.
config.resolver.extraNodeModules = {
  '@knowlex/core': coreRoot,
  react: rootReact,
  'react-native': rootReactNative,
};

// Single-React invariant: block every nested react / react-native copy and
// the web package's tree so the bundler can never pick a duplicate.
// Duplicated React copies cause "Invalid hook call" + useRef-of-null at runtime.
config.resolver.blockList = [
  new RegExp(`${escapeRegExp(path.sep)}node_modules${escapeRegExp(path.sep)}.+${escapeRegExp(path.sep)}node_modules${escapeRegExp(path.sep)}react${escapeRegExp(path.sep)}.*`),
  new RegExp(`${escapeRegExp(path.sep)}node_modules${escapeRegExp(path.sep)}.+${escapeRegExp(path.sep)}node_modules${escapeRegExp(path.sep)}react-native${escapeRegExp(path.sep)}.*`),
  new RegExp(`^${escapeRegExp(webPkg)}${escapeRegExp(path.sep)}.*`),
];

// Belt-and-suspenders: route any direct react/react-native specifier to the root copy.
const reactRedirects = new Map([
  ['react', rootReact],
  ['react-native', rootReactNative],
]);
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [name, target] of reactRedirects) {
    if (moduleName === name || moduleName.startsWith(`${name}/`)) {
      const subpath = moduleName.slice(name.length);
      return context.resolveRequest(context, target + subpath, platform);
    }
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
