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
  webpack: async (config, options) => {
    // Only enable Module Federation if explicitly enabled via env var
    if (process.env.ENABLE_MODULE_FEDERATION === 'true') {
      try {
        const { default: NextFederationPlugin } = await import('@module-federation/nextjs-mf')
        
        // Module Federation configuration
        config.plugins.push(
          new NextFederationPlugin({
            name: 'mubarakway',
            filename: 'static/chunks/remoteEntry.js',
            exposes: {
              // Widgets
              './AppHeader': './src/widgets/header/ui/app-header',
              './BottomNav': './src/widgets/navigation/ui/bottom-nav',
              './PlatformStats': './src/widgets/stats/ui/platform-stats',
              './CampaignsList': './src/widgets/campaign-list/ui/campaigns-list',
              
              // Features
              './CreateCampaignForm': './src/features/create-campaign/ui/create-campaign-form',
              './DonationForm': './src/features/make-donation/ui/donation-form',
              './CampaignsSearch': './src/features/search-campaigns/ui/campaigns-search',
              
              // Entities
              './CampaignCard': './src/entities/campaign/ui/campaign-card',
              
              // Components
              './QuickDonationBlock': './components/quick-donation-block',
              './UltraQuickDonation': './components/ultra-quick-donation',
              './ZakatCalculatorForm': './components/zakat-calculator-form',
              './DonationFormComponent': './components/donation-form',
              
              // Shared utilities
              './ErrorHandler': './lib/error-handler',
              './BotApi': './lib/bot-api',
            },
            shared: {
              react: {
                singleton: true,
                requiredVersion: false,
                eager: false,
              },
              'react-dom': {
                singleton: true,
                requiredVersion: false,
                eager: false,
              },
              'next': {
                singleton: true,
                requiredVersion: false,
                eager: false,
              },
            },
            extraOptions: {
              exposePages: true,
              enableImageLoaderFix: true,
              enableUrlLoaderFix: true,
            },
          })
        )
      } catch (error) {
        console.warn('[Next.js Config] Module Federation disabled:', error)
      }
    }
    
    return config
  },
}

export default nextConfig
// Temporarily disabled: export default withNextIntl(nextConfig)
