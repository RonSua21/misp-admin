import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "decimal.js-light": require.resolve("decimal.js-light"),
    };
    return config;
  },
};
export default nextConfig;
