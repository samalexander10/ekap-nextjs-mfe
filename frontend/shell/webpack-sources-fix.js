// Preload fix for Next.js 16 + Module Federation + Webpack mode.
//
// Next.js 16 hooks all `require('webpack/...')` and `require('webpack-sources')`
// to its internal compiled shims under `next/dist/compiled/webpack/`. These shims
// do things like `module.exports = require('./webpack.js').sources` which, when
// NEXT_PRIVATE_LOCAL_WEBPACK=true, loads the local webpack package. The local
// webpack then requires 'webpack-sources' or 'webpack/lib/...' — which the hooks
// redirect back to the shims — creating circular dependencies.
//
// This preload script (loaded via NODE_OPTIONS=--require) patches the
// hookPropertyMap so all webpack and webpack-sources requires resolve to the
// real local packages, preventing the circular dependency.

try {
  const hookModule = require("next/dist/server/require-hook");
  const map = hookModule.hookPropertyMap;

  const realWebpackSourcesPath = require.resolve("webpack-sources");

  // Keys that should resolve to the real webpack-sources package
  const webpackSourcesKeys = [
    "webpack-sources",
    "webpack-sources/lib",
    "webpack-sources/lib/index",
    "webpack-sources/lib/index.js",
  ];

  for (const key of webpackSourcesKeys) {
    map.set(key, realWebpackSourcesPath);
  }

  // All webpack/lib/* keys should resolve to the local webpack package, not
  // the compiled shims. We'll resolve each one from the local webpack install.
  const webpackLibKeys = [
    "webpack",
    "webpack/package",
    "webpack/package.json",
    "webpack/lib/webpack",
    "webpack/lib/webpack.js",
    "webpack/lib/node/NodeEnvironmentPlugin",
    "webpack/lib/node/NodeEnvironmentPlugin.js",
    "webpack/lib/BasicEvaluatedExpression",
    "webpack/lib/BasicEvaluatedExpression.js",
    "webpack/lib/node/NodeTargetPlugin",
    "webpack/lib/node/NodeTargetPlugin.js",
    "webpack/lib/node/NodeTemplatePlugin",
    "webpack/lib/node/NodeTemplatePlugin.js",
    "webpack/lib/LibraryTemplatePlugin",
    "webpack/lib/LibraryTemplatePlugin.js",
    "webpack/lib/SingleEntryPlugin",
    "webpack/lib/SingleEntryPlugin.js",
    "webpack/lib/optimize/LimitChunkCountPlugin",
    "webpack/lib/optimize/LimitChunkCountPlugin.js",
    "webpack/lib/webworker/WebWorkerTemplatePlugin",
    "webpack/lib/webworker/WebWorkerTemplatePlugin.js",
    "webpack/lib/ExternalsPlugin",
    "webpack/lib/ExternalsPlugin.js",
    "webpack/lib/web/FetchCompileWasmTemplatePlugin",
    "webpack/lib/web/FetchCompileWasmTemplatePlugin.js",
    "webpack/lib/web/FetchCompileWasmPlugin",
    "webpack/lib/web/FetchCompileWasmPlugin.js",
    "webpack/lib/web/FetchCompileAsyncWasmPlugin",
    "webpack/lib/web/FetchCompileAsyncWasmPlugin.js",
    "webpack/lib/ModuleFilenameHelpers",
    "webpack/lib/ModuleFilenameHelpers.js",
    "webpack/lib/GraphHelpers",
    "webpack/lib/GraphHelpers.js",
    "webpack/lib/NormalModule",
    "webpack/lib/NormalModule.js",
  ];

  for (const key of webpackLibKeys) {
    try {
      const resolved = require.resolve(key);
      map.set(key, resolved);
    } catch {
      // Some webpack/lib/* modules may not exist in all versions (e.g.,
      // SingleEntryPlugin was removed in webpack 5). That's fine — skip them.
    }
  }

  // Intercept future .set() calls (from loadWebpackHook in config-utils.js)
  // to prevent Next.js from overwriting our fixes with the compiled shims.
  const origSet = map.set.bind(map);
  const protectedPrefixes = ["webpack-sources", "webpack"];
  map.set = function (key, value) {
    if (
      typeof key === "string" &&
      typeof value === "string" &&
      value.includes("next/dist/compiled/webpack/") &&
      protectedPrefixes.some((p) => key === p || key.startsWith(p + "/"))
    ) {
      // Silently skip — keep our local-package resolution
      return map;
    }
    return origSet(key, value);
  };
} catch {
  // Silently ignore if next/dist/server/require-hook isn't available yet
}
