/**
 * Simple CAPTCHA utility for anti-spam protection
 * 
 * For production, consider using hCaptcha or reCAPTCHA
 * This is a lightweight alternative for MVP
 */

export interface CaptchaChallenge {
  question: string
  answer: number
  token: string
}

/**
 * Generate a simple math CAPTCHA challenge
 */
export function generateCaptcha(): CaptchaChallenge {
  const num1 = Math.floor(Math.random() * 10) + 1
  const num2 = Math.floor(Math.random() * 10) + 1
  const operation = Math.random() > 0.5 ? "+" : "*"
  
  let answer: number
  let question: string
  
  if (operation === "+") {
    answer = num1 + num2
    question = `${num1} + ${num2}`
  } else {
    answer = num1 * num2
    question = `${num1} × ${num2}`
  }
  
  // Generate a token for this challenge
  const token = Buffer.from(`${Date.now()}-${Math.random()}`).toString("base64")
  
  return {
    question,
    answer,
    token,
  }
}

/**
 * Verify CAPTCHA answer
 */
export function verifyCaptcha(
  userAnswer: number | string,
  expectedAnswer: number,
  token: string,
  maxAge: number = 5 * 60 * 1000 // 5 minutes
): boolean {
  // Parse user answer
  const parsedAnswer = typeof userAnswer === "string" ? parseInt(userAnswer, 10) : userAnswer
  
  if (isNaN(parsedAnswer)) {
    return false
  }
  
  // Verify answer matches
  if (parsedAnswer !== expectedAnswer) {
    return false
  }
  
  // Verify token is not too old (optional, if timestamp is encoded in token)
  // For simplicity, we'll just check the answer
  
  return true
}

/**
 * Store CAPTCHA challenge in session (for server-side verification)
 * In production, use Redis or session storage
 */
const captchaStore = new Map<string, { answer: number; expires: number }>()

export function storeCaptcha(token: string, answer: number, ttl: number = 5 * 60 * 1000) {
  captchaStore.set(token, {
    answer,
    expires: Date.now() + ttl,
  })
  
  // Cleanup expired entries
  setTimeout(() => {
    captchaStore.delete(token)
  }, ttl)
}

export function getCaptcha(token: string): { answer: number } | null {
  const stored = captchaStore.get(token)
  if (!stored) {
    return null
  }
  
  if (Date.now() > stored.expires) {
    captchaStore.delete(token)
    return null
  }
  
  return { answer: stored.answer }
}

