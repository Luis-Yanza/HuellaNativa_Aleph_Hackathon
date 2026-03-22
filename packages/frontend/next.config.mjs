import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // 1. Plugins para limpiar prefijos 'node:'
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );

      // 2. Fallbacks agresivos
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        readline: false,
        dns: false,
        http2: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
        vm: require.resolve('vm-browserify'),
      };

      // 3. Aliases para dependencias que usan require('fs') directamente (Ledger dependencies)
      config.resolve.alias = {
        ...config.resolve.alias,
        'bindings': false,
        'node-gyp-build': false,
        '@ledgerhq/hw-transport-node-hid': false,
        '@ledgerhq/hw-transport-webusb': false,
        'usb': false,
        'serialport': false,
        '@ledgerhq/devices': false,
      };
    }
    return config;
  },
};

export default nextConfig;
