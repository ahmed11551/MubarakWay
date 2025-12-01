/**
 * Простой генератор иконок PWA (без зависимостей)
 * 
 * Создает SVG иконки, которые можно конвертировать в PNG
 * с помощью онлайн-инструментов или ImageMagick.
 */

const fs = require('fs')
const path = require('path')

// Цвета бренда MubarakWay
const PRIMARY_COLOR = '#16a34a' // Зеленый
const ACCENT_COLOR = '#22c55e' // Светло-зеленый
const BACKGROUND_COLOR = '#ffffff' // Белый

// Размеры иконок
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

// SVG шаблон для основной иконки (упрощенный логотип)
function generateIconSVG(size) {
  const center = size / 2
  const iconSize = size * 0.7
  const padding = size * 0.15
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" fill="${BACKGROUND_COLOR}" rx="${size * 0.25}"/>
  
  <!-- Gradient definition -->
  <defs>
    <linearGradient id="grad-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${PRIMARY_COLOR};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${ACCENT_COLOR};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Main icon: Simplified heart/sparkles symbol -->
  <g transform="translate(${center}, ${center})">
    <!-- Heart shape (simplified) -->
    <path d="M 0 ${iconSize * 0.2}
             C ${-iconSize * 0.2} ${-iconSize * 0.1}, ${-iconSize * 0.35} ${-iconSize * 0.05}, ${-iconSize * 0.35} ${iconSize * 0.15}
             C ${-iconSize * 0.35} ${iconSize * 0.3}, ${-iconSize * 0.1} ${iconSize * 0.45}, 0 ${iconSize * 0.5}
             C ${iconSize * 0.1} ${iconSize * 0.45}, ${iconSize * 0.35} ${iconSize * 0.3}, ${iconSize * 0.35} ${iconSize * 0.15}
             C ${iconSize * 0.35} ${-iconSize * 0.05}, ${iconSize * 0.2} ${-iconSize * 0.1}, 0 ${iconSize * 0.2}
             Z" 
          fill="url(#grad-${size})" 
          stroke="${PRIMARY_COLOR}" 
          stroke-width="${Math.max(size * 0.015, 1)}"
          stroke-linejoin="round"/>
    
    <!-- Small sparkle dots -->
    <circle cx="${-iconSize * 0.3}" cy="${-iconSize * 0.25}" r="${Math.max(size * 0.025, 2)}" fill="${PRIMARY_COLOR}" opacity="0.9"/>
    <circle cx="${iconSize * 0.3}" cy="${-iconSize * 0.3}" r="${Math.max(size * 0.02, 1.5)}" fill="${ACCENT_COLOR}" opacity="0.9"/>
    <circle cx="${-iconSize * 0.25}" cy="${iconSize * 0.35}" r="${Math.max(size * 0.02, 1.5)}" fill="${ACCENT_COLOR}" opacity="0.9"/>
  </g>
</svg>`
}

// Создать директорию для иконок
const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

console.log('🎨 Генерация SVG иконок PWA для MubarakWay...\n')

// Генерация основных иконок
SIZES.forEach(size => {
  const svg = generateIconSVG(size)
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`)
  
  fs.writeFileSync(svgPath, svg)
  console.log(`✅ Создан: icon-${size}x${size}.svg`)
})

// Создать простые PNG placeholder иконки (базовые, для тестирования)
// Для production нужно использовать реальные PNG иконки

console.log('\n✨ SVG иконки созданы!')
console.log('\n📝 Следующие шаги:')
console.log('1. Конвертируйте SVG в PNG используя:')
console.log('   - Онлайн: https://cloudconvert.com/svg-to-png')
console.log('   - Или: npm install sharp && node scripts/generate-pwa-icons.js')
console.log('   - Или: https://realfavicongenerator.net/ (загрузите icon-512x512.svg)')
console.log('\n2. Для production рекомендуется:')
console.log('   - Создать профессиональные иконки в Figma/Photoshop')
console.log('   - Использовать реальный логотип MubarakWay')
console.log('   - Убедиться, что иконки 192x192 и 512x512 - maskable (с безопасной зоной)\n')

