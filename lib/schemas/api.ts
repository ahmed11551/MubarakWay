/**
 * Zod схемы для валидации API запросов
 */

import { z } from "zod"

// Campaign schemas
export const campaignStatusSchema = z.enum(["pending", "active", "completed", "rejected"])

export const campaignCategorySchema = z.enum([
  "medical",
  "education",
  "emergency",
  "family",
  "community",
  "other",
  "healthcare",
  "water",
  "orphans",
  "general",
])

export const getCampaignsQuerySchema = z.object({
  status: campaignStatusSchema.optional().default("active"),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => {
      const num = parseInt(val, 10)
      if (isNaN(num) || num < 1 || num > 100) {
        return 10
      }
      return num
    }),
  ids: z.string().optional(),
})

export const createCampaignBodySchema = z.object({
  title: z.string().min(1, "Название обязательно").max(200, "Название слишком длинное"),
  description: z.string().min(1, "Описание обязательно").max(1000, "Описание слишком длинное"),
  story: z.string().optional(),
  goalAmount: z.number().positive("Цель должна быть положительным числом").max(100000000, "Слишком большая цель"),
  currency: z.string().length(3, "Валюта должна быть в формате ISO 4217"),
  category: campaignCategorySchema,
  imageUrl: z.string().url("Некорректный URL изображения").optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  fundId: z.string().uuid("Некорректный ID фонда").optional().nullable(),
  linkedProjectIds: z.array(z.string().uuid()).optional(),
})

// Donation schemas
export const donationTypeSchema = z.enum(["one_time", "recurring", "zakat", "sadaqah"])

export const donationFrequencySchema = z.enum(["daily", "weekly", "monthly", "yearly"])

export const donationCategorySchema = z.enum(["sadaqah", "zakat", "general"])

export const createDonationBodySchema = z.object({
  amount: z.number().positive("Сумма должна быть положительной").max(10000000, "Слишком большая сумма"),
  currency: z.string().length(3, "Валюта должна быть в формате ISO 4217"),
  donationType: z.enum(["one_time", "recurring"]),
  frequency: donationFrequencySchema.optional(),
  category: donationCategorySchema,
  fundId: z.string().uuid("Некорректный ID фонда").optional().nullable(),
  campaignId: z.string().uuid("Некорректный ID кампании").optional().nullable(),
  message: z.string().max(500, "Сообщение слишком длинное").optional().nullable(),
  isAnonymous: z.boolean().default(false),
})

export const getDonationParamsSchema = z.object({
  id: z.string().uuid("Некорректный ID пожертвования"),
})

// Fund schemas
export const getFundsQuerySchema = z.object({
  category: z.string().optional(),
})

export const getFundParamsSchema = z.object({
  id: z.string().uuid("Некорректный ID фонда"),
})

// Search schemas
export const searchCampaignsQuerySchema = z.object({
  query: z.string().min(1, "Поисковый запрос не может быть пустым").max(100, "Запрос слишком длинный"),
  category: campaignCategorySchema.optional(),
  status: campaignStatusSchema.optional(),
})

// Stats schemas
export const getStatsQuerySchema = z.object({
  period: z.enum(["day", "week", "month", "year"]).optional().default("month"),
})

// Reports schemas
export const uploadReportBodySchema = z.object({
  fundId: z.string().uuid("Некорректный ID фонда"),
  title: z.string().min(1, "Название обязательно").max(200, "Название слишком длинное"),
  description: z.string().optional(),
  fileUrl: z.string().url("Некорректный URL файла"),
  reportDate: z.string().datetime().optional(),
})

// Telegram schemas
export const telegramWebhookBodySchema = z.object({
  update_id: z.number(),
  message: z.any().optional(),
  callback_query: z.any().optional(),
})

// Auth schemas
export const telegramAuthQuerySchema = z.object({
  id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().url().optional(),
  auth_date: z.string(),
  hash: z.string(),
})

