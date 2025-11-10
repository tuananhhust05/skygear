/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'skygear.online'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5656',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'skygear.online',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'skygear.online',
        pathname: '/**',
      },
    ],
    // Disable image optimization for external images to avoid 404 errors
    unoptimized: false,
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://skygear.online',
  },
}

module.exports = nextConfig

