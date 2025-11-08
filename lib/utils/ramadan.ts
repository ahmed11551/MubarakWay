/**
 * Утилиты для работы с датами Рамадана
 * Рамадан - это 9-й месяц исламского календаря (лунный календарь)
 */

/**
 * Получить даты Рамадана для текущего года (по григорианскому календарю)
 * Рамадан 2025: примерно 1 марта - 30 марта 2025
 * Рамадан 2026: примерно 20 февраля - 21 марта 2026
 * Рамадан 2027: примерно 9 февраля - 10 марта 2027
 * 
 * Примечание: Даты Рамадана меняются каждый год, так как исламский календарь лунный
 * Для точных дат нужно использовать исламский календарь (Hijri)
 */
export function getRamadanDates(year: number): { start: Date; end: Date } {
  // Примерные даты Рамадана по годам (нужно обновлять каждый год)
  const ramadanDates: Record<number, { start: string; end: string }> = {
    2025: { start: "2025-03-01", end: "2025-03-30" },
    2026: { start: "2026-02-20", end: "2026-03-21" },
    2027: { start: "2027-02-09", end: "2027-03-10" },
    2028: { start: "2028-01-28", end: "2028-02-26" },
    2029: { start: "2029-01-17", end: "2029-02-15" },
    2030: { start: "2030-01-06", end: "2030-02-04" },
  }

  if (ramadanDates[year]) {
    return {
      start: new Date(ramadanDates[year].start),
      end: new Date(ramadanDates[year].end),
    }
  }

  // Fallback: используем примерные даты для 2025
  return {
    start: new Date(`${year}-03-01`),
    end: new Date(`${year}-03-30`),
  }
}

/**
 * Проверить, находится ли дата в периоде Рамадана
 */
export function isRamadanDate(date: Date): boolean {
  const year = date.getFullYear()
  const { start, end } = getRamadanDates(year)
  
  // Устанавливаем время на начало дня для корректного сравнения
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = new Date(end)
  endDate.setHours(23, 59, 59, 999)
  
  return checkDate >= startDate && checkDate <= endDate
}

/**
 * Получить текущий период Рамадана (если сейчас Рамадан)
 */
export function getCurrentRamadanPeriod(): { start: Date; end: Date } | null {
  const now = new Date()
  const year = now.getFullYear()
  const { start, end } = getRamadanDates(year)
  
  if (isRamadanDate(now)) {
    return { start, end }
  }
  
  // Проверяем следующий год
  const nextYear = year + 1
  const nextRamadan = getRamadanDates(nextYear)
  const nextStart = new Date(nextRamadan.start)
  
  if (now < nextStart) {
    return { start, end }
  }
  
  return null
}

/**
 * Получить форматированные даты Рамадана для отображения
 */
export function getRamadanDateRange(year?: number): string {
  const targetYear = year || new Date().getFullYear()
  const { start, end } = getRamadanDates(targetYear)
  
  const startFormatted = start.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "numeric",
  })
  
  const endFormatted = end.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })
  
  return `${startFormatted} - ${endFormatted}`
}

