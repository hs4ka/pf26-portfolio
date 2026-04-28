import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@rive-app/react-canvas'],
  },
}

export default nextConfig
