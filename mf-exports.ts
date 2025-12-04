/**
 * Module Federation Exports
 * 
 * Этот файл содержит все экспорты для Module Federation.
 * Используется для удобного импорта модулей в host-приложении.
 */

// Widgets
export { AppHeader } from './src/widgets/header/ui/app-header'
export { BottomNav } from './src/widgets/navigation/ui/bottom-nav'
export { PlatformStats } from './src/widgets/stats/ui/platform-stats'
export { CampaignsList } from './src/widgets/campaign-list/ui/campaigns-list'

// Features
export { CampaignCreationForm } from './src/features/create-campaign/ui/create-campaign-form'
export { DonationForm as FeatureDonationForm } from './src/features/make-donation/ui/donation-form'
export { CampaignsSearch } from './src/features/search-campaigns/ui/campaigns-search'

// Entities
export { CampaignCard } from './src/entities/campaign/ui/campaign-card'

// Components
export { QuickDonationBlock } from './components/quick-donation-block'
export { UltraQuickDonation } from './components/ultra-quick-donation'
export { ZakatCalculatorForm } from './components/zakat-calculator-form'
export { CampaignCreationForm as ComponentCampaignCreationForm } from './components/campaign-creation-form'
export { DonationForm } from './components/donation-form'

// Shared utilities
export { handleApiError, AppError, logError } from './lib/error-handler'
export { 
  fetchBotApiStats, 
  fetchBotApiFunds, 
  fetchBotApiCampaigns,
  isBotApiConfigured 
} from './lib/bot-api'

// Types
export type { Campaign, TransformedCampaign } from './src/entities/campaign/model/types'
export type { DonationInput } from './lib/actions/donations'
export type { PlatformStats as PlatformStatsType } from './lib/stats'

