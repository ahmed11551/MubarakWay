// Email notification utilities using Resend
// To use this, you need to:
// 1. Install: pnpm add resend
// 2. Set RESEND_API_KEY in environment variables
// 3. Verify your domain in Resend dashboard

type EmailOptions = {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // Check if Resend is configured
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email send")
    return { success: false, error: "Email service not configured" }
  }

  try {
    // Dynamic import to avoid errors if resend is not installed
    const { Resend } = await import("resend")
    const resend = new Resend(apiKey)

    const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || "noreply@mubarakway.com"

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    if (error) {
      console.error("[Email] Send error:", error)
      return { success: false, error: error.message || "Failed to send email" }
    }

    console.log("[Email] Sent successfully:", data?.id)
    return { success: true }
  } catch (error) {
    console.error("[Email] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Email templates
export function getDonationConfirmationEmail(donation: {
  amount: number
  currency: string
  fundName?: string
  campaignName?: string
  isAnonymous: boolean
}): string {
  const recipient = donation.fundName || donation.campaignName || "благотворительный фонд"
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Подтверждение пожертвования</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Спасибо за ваше пожертвование!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Ваше пожертвование успешно обработано:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Сумма:</strong> ${donation.amount} ${donation.currency}</p>
            <p style="margin: 10px 0;"><strong>Получатель:</strong> ${recipient}</p>
            ${donation.isAnonymous ? '<p style="margin: 10px 0;"><em>Пожертвование сделано анонимно</em></p>' : ''}
          </div>
          <p>Ваша поддержка помогает делать мир лучше. Да вознаградит вас Аллах за вашу щедрость!</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Это автоматическое письмо. Пожалуйста, не отвечайте на него.
          </p>
        </div>
      </body>
    </html>
  `
}

export function getCampaignDonationNotificationEmail(campaign: {
  title: string
  donorName: string
  amount: number
  currency: string
  isAnonymous: boolean
}): string {
  const donorName = campaign.isAnonymous ? "Анонимный донор" : campaign.donorName
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Новое пожертвование в вашу кампанию</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Новое пожертвование!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Ваша кампания получила новое пожертвование:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Кампания:</strong> ${campaign.title}</p>
            <p style="margin: 10px 0;"><strong>Донор:</strong> ${donorName}</p>
            <p style="margin: 10px 0;"><strong>Сумма:</strong> ${campaign.amount} ${campaign.currency}</p>
          </div>
          <p>Продолжайте делиться вашей кампанией, чтобы собрать больше средств!</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Это автоматическое письмо. Пожалуйста, не отвечайте на него.
          </p>
        </div>
      </body>
    </html>
  `
}

export function getCampaignApprovalEmail(campaign: {
  title: string
  approved: boolean
}): string {
  const status = campaign.approved ? "одобрена" : "отклонена"
  const message = campaign.approved
    ? "Ваша кампания была одобрена и теперь доступна для пожертвований!"
    : "К сожалению, ваша кампания не прошла модерацию. Пожалуйста, проверьте требования и попробуйте снова."
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Статус модерации кампании</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Кампания ${status}</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Ваша кампания "${campaign.title}" была ${status}.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>${message}</p>
          </div>
          ${campaign.approved ? '<p>Теперь вы можете делиться ссылкой на вашу кампанию и собирать пожертвования!</p>' : ''}
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Это автоматическое письмо. Пожалуйста, не отвечайте на него.
          </p>
        </div>
      </body>
    </html>
  `
}

