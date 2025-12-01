/**
 * YooKassa payment integration
 * Готов к использованию после получения Shop ID и Secret Key
 */

export interface YooKassaConfig {
  shopId: string
  secretKey: string
  amount: number
  currency: string
  description: string
  returnUrl: string
  cancelUrl?: string
  metadata?: Record<string, any>
}

export interface YooKassaPaymentResponse {
  id: string
  status: string
  confirmation: {
    type: string
    confirmation_url: string
  }
  amount: {
    value: string
    currency: string
  }
  description: string
  metadata?: Record<string, any>
}

/**
 * Create payment in YooKassa
 * Используется на сервере через API route
 */
export async function createYooKassaPayment(config: YooKassaConfig): Promise<YooKassaPaymentResponse> {
  const shopId = process.env.YOOKASSA_SHOP_ID || config.shopId
  const secretKey = process.env.YOOKASSA_SECRET_KEY || config.secretKey

  if (!shopId || !secretKey) {
    throw new Error("YooKassa credentials not configured. Please set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY")
  }

  const authString = Buffer.from(`${shopId}:${secretKey}`).toString("base64")

  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotence-Key": `${Date.now()}-${Math.random()}`,
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify({
      amount: {
        value: config.amount.toFixed(2),
        currency: config.currency,
      },
      confirmation: {
        type: "redirect",
        return_url: config.returnUrl,
      },
      capture: true,
      description: config.description,
      metadata: config.metadata || {},
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`YooKassa API error: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

/**
 * Verify webhook signature from YooKassa
 */
export function verifyYooKassaSignature(body: string, signature: string, secretKey: string): boolean {
  const crypto = require("crypto")
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(body)
    .digest("base64")
  
  return signature === expectedSignature
}

/**
 * Detect payment provider based on card BIN or currency
 * Returns 'yookassa' for RUB or Russian cards, 'cloudpayments' otherwise
 */
export function detectPaymentProvider(currency: string, cardBin?: string): "yookassa" | "cloudpayments" {
  // Если валюта RUB - используем YooKassa
  if (currency === "RUB") {
    return "yookassa"
  }

  // Если есть BIN карты, проверяем российские карты (начинаются с 2, 4, 5 для основных банков)
  if (cardBin) {
    const russianBins = ["2", "4", "5"]
    if (russianBins.includes(cardBin[0])) {
      return "yookassa"
    }
  }

  // По умолчанию CloudPayments для международных карт
  return "cloudpayments"
}

