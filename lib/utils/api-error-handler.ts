/**
 * Утилиты для обработки ошибок API на клиенте
 */

export type ApiErrorType = 
  | 'network'      // Сетевая ошибка (нет интернета, таймаут)
  | 'auth'         // Ошибка авторизации
  | 'validation'   // Ошибка валидации
  | 'not_found'    // Ресурс не найден
  | 'server'       // Серверная ошибка
  | 'payment'      // Ошибка платежа
  | 'unknown'      // Неизвестная ошибка

export interface ApiError {
  type: ApiErrorType
  message: string
  userMessage: string  // Сообщение для показа пользователю
  code?: string
  statusCode?: number
  retryable: boolean   // Можно ли повторить запрос
}

/**
 * Сообщения об ошибках для пользователя
 */
const USER_ERROR_MESSAGES: Record<ApiErrorType, string> = {
  network: 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
  auth: 'Необходимо войти в систему. Пожалуйста, авторизуйтесь.',
  validation: 'Некорректные данные. Проверьте введённую информацию.',
  not_found: 'Запрашиваемый ресурс не найден.',
  server: 'Сервер временно недоступен. Пожалуйста, попробуйте позже.',
  payment: 'Ошибка при обработке платежа. Попробуйте другой способ оплаты.',
  unknown: 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.',
}

/**
 * Определить тип ошибки по HTTP статусу
 */
function getErrorTypeFromStatus(status: number): ApiErrorType {
  if (status === 401 || status === 403) return 'auth'
  if (status === 400 || status === 422) return 'validation'
  if (status === 404) return 'not_found'
  if (status >= 500) return 'server'
  return 'unknown'
}

/**
 * Определить, можно ли повторить запрос
 */
function isRetryable(type: ApiErrorType, statusCode?: number): boolean {
  // Сетевые ошибки и 5xx можно повторять
  if (type === 'network' || type === 'server') return true
  // 429 Too Many Requests - можно повторить позже
  if (statusCode === 429) return true
  return false
}

/**
 * Парсинг ошибки из fetch Response
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  const type = getErrorTypeFromStatus(response.status)
  let message = `HTTP ${response.status}`
  let serverMessage = ''
  
  try {
    const data = await response.json()
    serverMessage = data.error || data.message || ''
    message = serverMessage || message
  } catch {
    // Не удалось распарсить JSON - используем статус
  }
  
  return {
    type,
    message,
    userMessage: serverMessage || USER_ERROR_MESSAGES[type],
    statusCode: response.status,
    retryable: isRetryable(type, response.status),
  }
}

/**
 * Обработка ошибки fetch (включая сетевые ошибки)
 */
export function handleFetchError(error: unknown): ApiError {
  // Таймаут или прерывание запроса
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      type: 'network',
      message: 'Request timeout',
      userMessage: 'Сервер не отвечает. Проверьте интернет-соединение и попробуйте снова.',
      retryable: true,
    }
  }
  
  // Сетевая ошибка (нет интернета)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: error.message,
      userMessage: USER_ERROR_MESSAGES.network,
      retryable: true,
    }
  }
  
  // Другие ошибки
  const message = error instanceof Error ? error.message : String(error)
  
  return {
    type: 'unknown',
    message,
    userMessage: USER_ERROR_MESSAGES.unknown,
    retryable: false,
  }
}

/**
 * Обёртка для безопасного вызова API
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    retries?: number
    retryDelay?: number
    onRetry?: (attempt: number, error: ApiError) => void
  }
): Promise<{ data: T; error: null } | { data: null; error: ApiError }> {
  const { retries = 0, retryDelay = 1000, onRetry } = options || {}
  let lastError: ApiError | null = null
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await apiCall()
      return { data, error: null }
    } catch (error) {
      lastError = handleFetchError(error)
      
      // Если ошибка не повторяемая или это последняя попытка
      if (!lastError.retryable || attempt === retries) {
        break
      }
      
      // Вызываем callback перед повтором
      onRetry?.(attempt + 1, lastError)
      
      // Ждём перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
    }
  }
  
  return { data: null, error: lastError || handleFetchError(new Error('Unknown error')) }
}

/**
 * Форматирование ошибки платежа
 */
export function formatPaymentError(error: string | ApiError): string {
  if (typeof error === 'string') {
    // Маппинг типичных ошибок платежей
    const paymentErrorMap: Record<string, string> = {
      'Insufficient funds': 'Недостаточно средств на карте',
      'Card declined': 'Карта отклонена банком',
      'Invalid card': 'Некорректные данные карты',
      'Expired card': 'Срок действия карты истёк',
      '3DS authentication failed': 'Не пройдена проверка 3D Secure',
      'Payment timeout': 'Истекло время ожидания платежа',
    }
    
    // Поиск совпадения в сообщении об ошибке
    for (const [key, value] of Object.entries(paymentErrorMap)) {
      if (error.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }
    
    return error
  }
  
  return error.userMessage
}

/**
 * Логирование ошибки API (для отладки)
 */
export function logApiError(error: ApiError, context?: Record<string, unknown>) {
  console.error('[API Error]', {
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    retryable: error.retryable,
    context,
    timestamp: new Date().toISOString(),
  })
}

