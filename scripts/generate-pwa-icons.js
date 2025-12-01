/**
 * Генератор иконок PWA для MubarakWay
 * 
 * Этот скрипт создает простые иконки на основе бренда приложения.
 * Для production рекомендуется использовать профессиональные иконки.
 * 
 * Требования:
 * - npm install sharp
 * - Или используйте онлайн-генераторы: https://realfavicongenerator.net/
 */

const fs = require('fs')
const path = require('path')

// Цвета бренда
const PRIMARY_COLOR = '#16a34a' // Зеленый
const ACCENT_COLOR = '#22c55e' // Светло-зеленый
const BACKGROUND_COLOR = '#ffffff' // Белый

// Размеры иконок
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

// SVG шаблон для иконки
function generateIconSVG(size) {
  const center = size / 2
  const iconSize = size * 0.6
  const iconOffset = (size - iconSize) / 2
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${BACKGROUND_COLOR}" rx="${size * 0.2}"/>
  
  <!-- Gradient -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${PRIMARY_COLOR};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${ACCENT_COLOR};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Icon: Heart with Sparkles (simplified) -->
  <g transform="translate(${center}, ${center})">
    <!-- Heart shape -->
    <path d="M ${-iconSize * 0.15} ${iconSize * 0.1} 
             C ${-iconSize * 0.25} ${-iconSize * 0.1}, ${-iconSize * 0.4} ${-iconSize * 0.05}, ${-iconSize * 0.4} ${iconSize * 0.1}
             C ${-iconSize * 0.4} ${iconSize * 0.25}, ${-iconSize * 0.15} ${iconSize * 0.4}, 0 ${iconSize * 0.5}
             C ${iconSize * 0.15} ${iconSize * 0.4}, ${iconSize * 0.4} ${iconSize * 0.25}, ${iconSize * 0.4} ${iconSize * 0.1}
             C ${iconSize * 0.4} ${-iconSize * 0.05}, ${iconSize * 0.25} ${-iconSize * 0.1}, ${iconSize * 0.15} ${iconSize * 0.1}
             Z" 
          fill="url(#grad)" 
          stroke="${PRIMARY_COLOR}" 
          stroke-width="${size * 0.02}"/>
    
    <!-- Sparkle dots -->
    <circle cx="${-iconSize * 0.3}" cy="${-iconSize * 0.2}" r="${size * 0.03}" fill="${PRIMARY_COLOR}" opacity="0.8"/>
    <circle cx="${iconSize * 0.3}" cy="${-iconSize * 0.25}" r="${size * 0.025}" fill="${ACCENT_COLOR}" opacity="0.8"/>
    <circle cx="${-iconSize * 0.25}" cy="${iconSize * 0.3}" r="${size * 0.025}" fill="${ACCENT_COLOR}" opacity="0.8"/>
  </g>
</svg>`
}

// Создать директорию для иконок
const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

console.log('🎨 Генерация иконок PWA для MubarakWay...\n')

// Проверка наличия sharp
let sharp
try {
  sharp = require('sharp')
  console.log('✅ Sharp найден, генерируем PNG иконки...\n')
} catch (e) {
  console.log('⚠️  Sharp не установлен. Генерируем только SVG.\n')
  console.log('💡 Для генерации PNG установите: npm install sharp\n')
  console.log('💡 Или используйте онлайн-генератор: https://realfavicongenerator.net/\n')
}

// Генерация иконок
SIZES.forEach(size => {
  const svg = generateIconSVG(size)
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`)
  
  // Сохранить SVG
  fs.writeFileSync(svgPath, svg)
  console.log(`✅ Создан: icon-${size}x${size}.svg`)
  
  // Если sharp доступен, создать PNG
  if (sharp) {
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`)
    sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(pngPath)
      .then(() => {
        console.log(`✅ Создан: icon-${size}x${size}.png`)
      })
      .catch(err => {
        console.error(`❌ Ошибка при создании PNG ${size}x${size}:`, err.message)
      })
  }
})

// Создать дополнительные иконки для shortcuts
const shortcutIcons = [
  { name: 'donate', icon: '💝' },
  { name: 'history', icon: '📜' },
  { name: 'campaigns', icon: '🎯' },
]

if (sharp) {
  shortcutIcons.forEach(({ name, icon }) => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="${BACKGROUND_COLOR}" rx="20"/>
  <text x="48" y="48" font-size="48" text-anchor="middle" dominant-baseline="central" font-family="Arial">${icon}</text>
</svg>`
    
    const pngPath = path.join(iconsDir, `${name}-96x96.png`)
    sharp(Buffer.from(svg))
      .resize(96, 96)
      .png()
      .toFile(pngPath)
      .then(() => {
        console.log(`✅ Создан: ${name}-96x96.png`)
      })
      .catch(err => {
        console.error(`❌ Ошибка при создании ${name}-96x96.png:`, err.message)
      })
  })
}

console.log('\n✨ Генерация завершена!')
console.log('\n📝 Следующие шаги:')
console.log('1. Проверьте созданные иконки в public/icons/')
console.log('2. Для production используйте профессиональные иконки')
console.log('3. Рекомендуется использовать онлайн-генератор: https://realfavicongenerator.net/')
console.log('4. Или создайте иконки в Figma/Photoshop на основе логотипа MubarakWay\n')

