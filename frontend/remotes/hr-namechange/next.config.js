const { NextFederationPlugin } = require("@module-federation/nextjs-mf");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack(config, options) {
    config.plugins.push(
      new NextFederationPlugin({
        name: "hrNamechange",
        filename: "static/chunks/remoteEntry.js",
        exposes: {
          "./NameChangeForm": "./src/components/NameChangeForm",
          "./NameChangeStatus": "./src/components/NameChangeStatus",
        },
        shared: {
          react: { singleton: true, eager: true, requiredVersion: false },
          "react-dom": { singleton: true, eager: true, requiredVersion: false },
        },
        extraOptions: {
          exposePages: false,
        },
      })
    );
    return config;
  },
};

module.exports = nextConfig;
