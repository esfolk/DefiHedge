/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CHAIN_IDS: process.env.NEXT_PUBLIC_CHAIN_IDS,
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      'raw.githubusercontent.com',
      'assets.coingecko.com',
      'logos.covalenthq.com',
    ],
    unoptimized: true,
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle WebAssembly modules
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle node modules that might not be compatible
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },

  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Transpile packages that might need it
  transpilePackages: [
    '@rainbow-me/rainbowkit',
    '@wagmi/core',
    'wagmi',
    'viem',
  ],
};

module.exports = nextConfig;
