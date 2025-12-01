/**
 * Генерация аватаров животных для пользователей
 * Детерминированный алгоритм на основе user_id
 */

const ANIMALS = [
  { name: "Орлан-белохвост", emoji: "🦅", color: "#8B4513" },
  { name: "Чернозобая Гагара", emoji: "🦆", color: "#2F4F4F" },
  { name: "Белка", emoji: "🐿️", color: "#FF8C00" },
  { name: "Трогон", emoji: "🦜", color: "#FF1493" },
  { name: "Черепаха", emoji: "🐢", color: "#228B22" },
  { name: "Дрофа", emoji: "🦃", color: "#CD853F" },
  { name: "Кроншнеп", emoji: "🦆", color: "#4682B4" },
  { name: "Сокол", emoji: "🦅", color: "#1C1C1C" },
  { name: "Олень", emoji: "🦌", color: "#8B4513" },
  { name: "Волк", emoji: "🐺", color: "#696969" },
  { name: "Лиса", emoji: "🦊", color: "#FF4500" },
  { name: "Медведь", emoji: "🐻", color: "#8B4513" },
  { name: "Заяц", emoji: "🐰", color: "#F5F5DC" },
  { name: "Еж", emoji: "🦔", color: "#808080" },
  { name: "Сова", emoji: "🦉", color: "#4B0082" },
]

/**
 * Получить аватар животного для пользователя
 */
export function getAnimalAvatar(userId: string) {
  // Преобразуем UUID в число для детерминированного выбора
  const hash = userId.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  const index = hash % ANIMALS.length
  return ANIMALS[index]
}

/**
 * Получить цвет для аватара
 */
export function getAvatarColor(userId: string): string {
  const animal = getAnimalAvatar(userId)
  return animal.color
}

/**
 * Получить эмодзи для аватара
 */
export function getAvatarEmoji(userId: string): string {
  const animal = getAnimalAvatar(userId)
  return animal.emoji
}

/**
 * Получить название животного для аватара
 */
export function getAvatarName(userId: string): string {
  const animal = getAnimalAvatar(userId)
  return animal.name
}

