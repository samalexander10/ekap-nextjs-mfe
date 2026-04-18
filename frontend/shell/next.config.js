// Next.js 16 + Webpack Mode + Module Federation (Dynamic Remotes)
//
// Next.js 16 defaults to Turbopack. We use --webpack (see package.json scripts)
// because Module Federation requires Webpack.
//
// The circular-dependency fix for webpack-sources is handled by the preload
// script (webpack-sources-fix.js) loaded via NODE_OPTIONS in package.json.
//
// Remote MFEs are loaded dynamically at runtime via lib/load-remote.ts,
// not through webpack's static remote config. The ModuleFederationPlugin
// here only sets up shared dependency scopes (react, react-dom).

const webpack = require("webpack");
const { ModuleFederationPlugin } = webpack.container;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",

  webpack(config, options) {
    const { isServer } = options;

    // Module Federation shared scopes — client side only
    if (!isServer) {
      config.plugins.push(
        new ModuleFederationPlugin({
          name: "shell",
          shared: {
            react: {
              singleton: true,
              eager: true,
              requiredVersion: false,
            },
            "react-dom": {
              singleton: true,
              eager: true,
              requiredVersion: false,
            },
          },
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig;
