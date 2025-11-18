/**
 * Campaign transformers (FSD entities layer)
 */

import type { Campaign, TransformedCampaign } from "../model/types"

/**
 * Вычисляет количество дней до дедлайна
 */
export function calculateDaysLeft(deadline: string | null | undefined): number | null {
  if (!deadline) return null
  
  const deadlineDate = new Date(deadline)
  const now = new Date()
  const diffMs = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Трансформирует кампанию из формата БД в формат для компонентов
 */
export function transformCampaign(campaign: Campaign): TransformedCampaign {
  const deadline = campaign.deadline ? new Date(campaign.deadline) : null
  const daysLeft = calculateDaysLeft(campaign.deadline)
  
  // Определяем, является ли кампания срочной (менее 7 дней до дедлайна)
  const urgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 7

  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    goalAmount: Number(campaign.goal_amount || 0),
    currentAmount: Number(campaign.current_amount || 0),
    category: campaign.category || "other",
    imageUrl: campaign.image_url || "/placeholder.svg",
    donorCount: Number(campaign.donor_count || 0),
    daysLeft: daysLeft ?? 0,
    creatorName: campaign.profiles?.display_name || "Неизвестный автор",
    urgent,
  }
}

/**
 * Трансформирует массив кампаний
 */
export function transformCampaigns(campaigns: Campaign[]): TransformedCampaign[] {
  return campaigns.map(transformCampaign)
}

/**
 * Фильтрует срочные кампании (менее 7 дней до дедлайна)
 */
export function filterUrgentCampaigns(campaigns: TransformedCampaign[]): TransformedCampaign[] {
  return campaigns.filter((c) => c.urgent && c.daysLeft > 0 && c.daysLeft <= 7)
}

/**
 * Фильтрует активные кампании (не завершённые и не скоро завершающиеся)
 */
export function filterActiveCampaigns(campaigns: TransformedCampaign[]): TransformedCampaign[] {
  return campaigns.filter(
    (c) => c.currentAmount < c.goalAmount && (c.daysLeft === 0 || c.daysLeft > 7)
  )
}

/**
 * Фильтрует завершающиеся кампании (менее 7 дней до дедлайна)
 */
export function filterEndingCampaigns(campaigns: TransformedCampaign[]): TransformedCampaign[] {
  return campaigns.filter((c) => c.daysLeft > 0 && c.daysLeft <= 7)
}

