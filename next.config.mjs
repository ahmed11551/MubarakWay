/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Don't ignore build errors - fix them instead
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Enable standalone output for Docker
  output: 'standalone',
}

export default nextConfig
