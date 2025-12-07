// Temporarily disable next-intl plugin to avoid build errors
// Will be enabled after full migration to [locale] structure
// import createNextIntlPlugin from 'next-intl/plugin';
// const withNextIntl = createNextIntlPlugin('./i18n.ts');

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
  // Temporarily disable Module Federation to fix build errors
  // Will be re-enabled when webpack is properly configured
  // Module Federation requires additional setup and is not critical for core functionality
}

export default nextConfig
// Temporarily disabled: export default withNextIntl(nextConfig)
