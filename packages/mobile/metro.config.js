const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const coreRoot = path.resolve(monorepoRoot, 'packages/core/src');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root for changes in @knowlex/core
config.watchFolders = [monorepoRoot];

// Resolve packages from both mobile/node_modules and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = false;

// Map @knowlex/core directly to the core src directory so Metro can
// resolve sub-path imports like @knowlex/core/api/client-api without
// needing package exports wildcard support.
config.resolver.extraNodeModules = {
  '@knowlex/core': coreRoot,
};

module.exports = config;
