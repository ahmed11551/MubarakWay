/**
 * Analytics service for tracking user events
 * 
 * Tracks key events like donations, campaigns, zakat calculations, etc.
 * Can be extended to integrate with external analytics services (GA, Mixpanel, etc.)
 */

import { logger } from "./logger"

export type AnalyticsEvent =
  | "donation_initiated"
  | "donation_succeeded"
  | "donation_failed"
  | "subscription_created"
  | "subscription_canceled"
  | "campaign_created"
  | "campaign_joined"
  | "campaign_completed"
  | "zakat_calc_submitted"
  | "zakat_paid"
  | "partner_applied"
  | "report_uploaded"
  | "report_verified"

export interface AnalyticsEventData {
  event: AnalyticsEvent
  userId?: string
  timestamp?: number
  [key: string]: unknown
}

/**
 * Track an analytics event
 * 
 * @param event - Event name
 * @param data - Event data
 */
export async function trackEvent(event: AnalyticsEvent, data: Record<string, unknown> = {}) {
  try {
    const eventData: AnalyticsEventData = {
      event,
      timestamp: Date.now(),
      ...data,
    }

    // Log event (structured logging)
    logger.info(`[Analytics] Event: ${event}`, eventData)

    // In production, you can send to external analytics service
    // Example: await sendToAnalyticsService(eventData)

    // Store in database for internal analytics
    // This can be done via a background job or API endpoint
    if (process.env.NODE_ENV === "production") {
      // Optionally send to external service
      // await fetch('/api/analytics/track', { method: 'POST', body: JSON.stringify(eventData) })
    }
  } catch (error) {
    logger.error("[Analytics] Failed to track event", error, { event, data })
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Track donation events
 */
export async function trackDonation(
  action: "initiated" | "succeeded" | "failed",
  donationId: string,
  data: {
    userId?: string
    amount: number
    currency: string
    fundId?: string
    campaignId?: string
    provider?: string
    error?: string
  }
) {
  await trackEvent(`donation_${action}` as AnalyticsEvent, {
    donation_id: donationId,
    ...data,
  })
}

/**
 * Track campaign events
 */
export async function trackCampaign(
  action: "created" | "joined" | "completed",
  campaignId: string,
  data: {
    userId?: string
    title?: string
    goalAmount?: number
    currentAmount?: number
    donationAmount?: number
  }
) {
  await trackEvent(`campaign_${action}` as AnalyticsEvent, {
    campaign_id: campaignId,
    ...data,
  })
}

/**
 * Track zakat events
 */
export async function trackZakat(
  action: "calc_submitted" | "paid",
  data: {
    userId?: string
    calculationId?: string
    zakatDue?: number
    aboveNisab?: boolean
    amount?: number
  }
) {
  await trackEvent(`zakat_${action}` as AnalyticsEvent, data)
}

/**
 * Track subscription events
 */
export async function trackSubscription(
  action: "created" | "canceled",
  subscriptionId: string,
  data: {
    userId?: string
    plan?: string
    period?: string
    amount?: number
  }
) {
  await trackEvent(`subscription_${action}` as AnalyticsEvent, {
    subscription_id: subscriptionId,
    ...data,
  })
}

/**
 * Track partner application
 */
export async function trackPartnerApplication(
  action: "applied",
  applicationId: string,
  data: {
    orgName?: string
    countryCode?: string
    categories?: string[]
  }
) {
  await trackEvent("partner_applied", {
    application_id: applicationId,
    ...data,
  })
}

/**
 * Track report events
 */
export async function trackReport(
  action: "uploaded" | "verified",
  reportId: string,
  data: {
    fundId?: string
    periodStart?: string
    periodEnd?: string
    totalCollected?: number
  }
) {
  await trackEvent(`report_${action}` as AnalyticsEvent, {
    report_id: reportId,
    ...data,
  })
}

