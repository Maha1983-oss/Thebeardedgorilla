import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compress: true, // Enable gzip compression for responses

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "recharts",
    ],
  },

  // Reduce memory usage during build
  productionBrowserSourceMaps: false,

  // Ignore ESLint errors during production builds to prevent build failures
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during production builds to prevent build failures
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize chunking for large components
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: "all",
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            recharts: {
              test: /[\\/]node_modules[\\/](recharts)[\\/]/,
              name: "recharts",
              priority: 20,
            },
            default: false,
            vendors: false,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
