/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite que .sql files sejam lidos como arquivos no servidor
  webpack: (config) => {
    config.module.rules.push({
      test: /\.sql$/i,
      type: 'asset/source',
    });
    return config;
  },
};

module.exports = nextConfig;
