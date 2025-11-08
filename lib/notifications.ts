"use server"

import { sendTelegramMessage, getDonationNotificationMessage } from "@/lib/telegram"
import { createClient } from "@/lib/supabase/server"

/**
 * Отправить уведомление о пожертвовании создателю кампании
 */
export async function notifyCampaignCreator(
  campaignId: string,
  donation: {
    amount: number
    currency: string
    donorName?: string
    isAnonymous: boolean
  }
) {
  try {
    const supabase = await createClient()

    // Получаем информацию о кампании и её создателе
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("title, user_id, users!campaigns_user_id_fkey(telegram_id, email)")
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      console.error("[Notifications] Campaign not found:", campaignError)
      return { success: false, error: "Campaign not found" }
    }

    const creator = campaign.users as any

    // Telegram уведомление
    if (creator?.telegram_id) {
      const message = getDonationNotificationMessage({
        amount: donation.amount,
        currency: donation.currency,
        campaignName: campaign.title,
        donorName: donation.donorName,
        isAnonymous: donation.isAnonymous,
      })

      await sendTelegramMessage(creator.telegram_id, message)
    }

    // Email уведомление (если настроен)
    if (creator?.email) {
      await sendEmailNotification({
        to: creator.email,
        subject: `Новое пожертвование в кампанию "${campaign.title}"`,
        template: "donation_received",
        data: {
          campaignTitle: campaign.title,
          amount: donation.amount,
          currency: donation.currency,
          donorName: donation.isAnonymous ? "Анонимный донор" : donation.donorName || "Пользователь",
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("[Notifications] Error notifying campaign creator:", error)
    return { success: false, error: "Failed to send notification" }
  }
}

/**
 * Отправить уведомление о статусе кампании
 */
export async function notifyCampaignStatusChange(
  campaignId: string,
  status: "approved" | "rejected",
  reason?: string
) {
  try {
    const supabase = await createClient()

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("title, user_id, users!campaigns_user_id_fkey(telegram_id, email)")
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      console.error("[Notifications] Campaign not found:", campaignError)
      return { success: false, error: "Campaign not found" }
    }

    const creator = campaign.users as any
    const statusText = status === "approved" ? "одобрена" : "отклонена"

    // Telegram уведомление
    if (creator?.telegram_id) {
      let message = `📢 Ваша кампания "${campaign.title}" ${statusText}`
      if (status === "rejected" && reason) {
        message += `\n\nПричина: ${reason}`
      }
      if (status === "approved") {
        message += "\n\nТеперь ваша кампания видна всем пользователям!"
      }

      await sendTelegramMessage(creator.telegram_id, message)
    }

    // Email уведомление
    if (creator?.email) {
      await sendEmailNotification({
        to: creator.email,
        subject: `Кампания "${campaign.title}" ${statusText}`,
        template: "campaign_status",
        data: {
          campaignTitle: campaign.title,
          status,
          reason,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("[Notifications] Error notifying campaign status:", error)
    return { success: false, error: "Failed to send notification" }
  }
}

/**
 * Отправить уведомление донору о успешном пожертвовании
 */
export async function notifyDonor(
  userId: string,
  donation: {
    amount: number
    currency: string
    campaignName?: string
    fundName?: string
  }
) {
  try {
    const supabase = await createClient()

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("telegram_id, email")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error("[Notifications] User not found:", userError)
      return { success: false, error: "User not found" }
    }

    // Telegram уведомление
    if (user.telegram_id) {
      const targetName = donation.campaignName || donation.fundName || "благотворительность"
      const message = `✅ Пожертвование успешно!\n\nСумма: ${donation.amount} ${donation.currency}\nПолучатель: ${targetName}\n\nСпасибо за вашу поддержку!`

      await sendTelegramMessage(user.telegram_id, message)
    }

    // Email уведомление
    if (user.email) {
      await sendEmailNotification({
        to: user.email,
        subject: "Пожертвование успешно",
        template: "donation_success",
        data: {
          amount: donation.amount,
          currency: donation.currency,
          targetName: donation.campaignName || donation.fundName || "благотворительность",
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("[Notifications] Error notifying donor:", error)
    return { success: false, error: "Failed to send notification" }
  }
}

/**
 * Отправить email уведомление
 */
async function sendEmailNotification({
  to,
  subject,
  template,
  data,
}: {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}) {
  const emailService = process.env.EMAIL_SERVICE || "resend"
  const apiKey = process.env.EMAIL_API_KEY

  if (!apiKey) {
    console.warn("[Notifications] Email API key not configured, skipping email")
    return { success: false, error: "Email not configured" }
  }

  try {
    if (emailService === "resend") {
      return await sendResendEmail({ to, subject, template, data, apiKey })
    } else if (emailService === "sendgrid") {
      return await sendSendGridEmail({ to, subject, template, data, apiKey })
    } else {
      console.warn("[Notifications] Unknown email service:", emailService)
      return { success: false, error: "Unknown email service" }
    }
  } catch (error) {
    console.error("[Notifications] Email error:", error)
    return { success: false, error: "Failed to send email" }
  }
}

/**
 * Отправить email через Resend
 */
async function sendResendEmail({
  to,
  subject,
  template,
  data,
  apiKey,
}: {
  to: string
  subject: string
  template: string
  data: Record<string, any>
  apiKey: string
}) {
  const resendApiKey = apiKey
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "MubarakWay <noreply@mubarakway.app>",
      to: [to],
      subject,
      html: getEmailTemplate(template, data),
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to send email")
  }

  return { success: true }
}

/**
 * Отправить email через SendGrid
 */
async function sendSendGridEmail({
  to,
  subject,
  template,
  data,
  apiKey,
}: {
  to: string
  subject: string
  template: string
  data: Record<string, any>
  apiKey: string
}) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
          subject,
        },
      ],
      from: {
        email: process.env.EMAIL_FROM || "noreply@mubarakway.app",
        name: "MubarakWay",
      },
      content: [
        {
          type: "text/html",
          value: getEmailTemplate(template, data),
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || "Failed to send email")
  }

  return { success: true }
}

/**
 * Получить HTML шаблон email
 */
function getEmailTemplate(template: string, data: Record<string, any>): string {
  const templates: Record<string, (data: Record<string, any>) => string> = {
    donation_received: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Новое пожертвование в вашу кампанию!</h2>
        <p>Кампания: <strong>${data.campaignTitle}</strong></p>
        <p>Сумма: <strong>${data.amount} ${data.currency}</strong></p>
        <p>Донор: <strong>${data.donorName}</strong></p>
        <p>Спасибо за вашу работу!</p>
      </div>
    `,
    donation_success: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Пожертвование успешно!</h2>
        <p>Сумма: <strong>${data.amount} ${data.currency}</strong></p>
        <p>Получатель: <strong>${data.targetName}</strong></p>
        <p>Спасибо за вашу поддержку!</p>
      </div>
    `,
    campaign_status: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Статус кампании изменен</h2>
        <p>Кампания: <strong>${data.campaignTitle}</strong></p>
        <p>Статус: <strong>${data.status === "approved" ? "Одобрена" : "Отклонена"}</strong></p>
        ${data.reason ? `<p>Причина: ${data.reason}</p>` : ""}
      </div>
    `,
  }

  const templateFn = templates[template] || templates.donation_success]
  return templateFn(data)
}

