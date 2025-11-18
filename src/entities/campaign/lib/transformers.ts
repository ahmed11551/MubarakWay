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
  // Срочной считается кампания с дедлайном от 1 до 7 дней включительно
  // Но для фильтрации также учитываются кампании до 30 дней, если нет очень срочных
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
    daysLeft: daysLeft ?? null, // Сохраняем null вместо 0, чтобы различать "нет дедлайна" и "дедлайн прошел"
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
 * Фильтрует срочные кампании
 * Сначала ищет кампании с дедлайном до 7 дней
 * Если таких нет, показывает кампании с дедлайном до 30 дней
 */
export function filterUrgentCampaigns(campaigns: TransformedCampaign[]): TransformedCampaign[] {
  // Сначала фильтруем кампании с дедлайном до 7 дней
  const veryUrgent = campaigns.filter(
    (c) => c.daysLeft !== null && c.daysLeft > 0 && c.daysLeft <= 7
  )
  
  // Если есть очень срочные, возвращаем их
  if (veryUrgent.length > 0) {
    return veryUrgent
  }
  
  // Если нет очень срочных, показываем кампании с дедлайном до 30 дней
  const urgent = campaigns.filter(
    (c) => c.daysLeft !== null && c.daysLeft > 0 && c.daysLeft <= 30
  )
  
  // Сортируем по дням до дедлайна (ближайшие первыми)
  return urgent.sort((a, b) => {
    if (a.daysLeft === null) return 1
    if (b.daysLeft === null) return -1
    return a.daysLeft - b.daysLeft
  })
}

/**
 * Фильтрует активные кампании (не завершённые и не скоро завершающиеся)
 */
export function filterActiveCampaigns(campaigns: TransformedCampaign[]): TransformedCampaign[] {
  return campaigns.filter(
    (c) => c.currentAmount < c.goalAmount && (c.daysLeft === null || c.daysLeft === 0 || c.daysLeft > 7)
  )
}

/**
 * Фильтрует завершающиеся кампании (менее 7 дней до дедлайна)
 */
export function filterEndingCampaigns(campaigns: TransformedCampaign[]): TransformedCampaign[] {
  return campaigns.filter((c) => c.daysLeft !== null && c.daysLeft > 0 && c.daysLeft <= 7)
}

