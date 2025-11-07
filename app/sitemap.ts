import { MetadataRoute } from "next"
import { getCampaigns } from "@/lib/actions/campaigns"
import { getFunds } from "@/lib/actions/funds"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarakway.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/campaigns`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/funds`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/donate`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/zakat-calculator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ]

  // Dynamic campaign pages
  let campaignPages: MetadataRoute.Sitemap = []
  try {
    const campaignsResult = await getCampaigns("active")
    if (campaignsResult.campaigns) {
      campaignPages = campaignsResult.campaigns.map((campaign) => ({
        url: `${siteUrl}/campaigns/${campaign.id}`,
        lastModified: campaign.updated_at ? new Date(campaign.updated_at) : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error("Error generating campaign sitemap:", error)
  }

  // Dynamic fund pages
  let fundPages: MetadataRoute.Sitemap = []
  try {
    const fundsResult = await getFunds()
    if (fundsResult.funds) {
      fundPages = fundsResult.funds.map((fund) => ({
        url: `${siteUrl}/funds/${fund.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error("Error generating fund sitemap:", error)
  }

  return [...staticPages, ...campaignPages, ...fundPages]
}

