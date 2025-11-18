#!/usr/bin/env node

/**
 * Скрипт для настройки переменных окружения в Vercel
 * Использование: node scripts/setup-vercel-env.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

const requiredVars = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase Project URL (из Settings → API в Supabase)',
    example: 'https://xxxxx.supabase.co'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anon public key (из Settings → API)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service_role key (из Settings → API)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
];

const optionalVars = [
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    description: 'URL вашего сайта в Vercel',
    default: 'https://mubarak-way.vercel.app'
  },
  {
    key: 'NEXT_PUBLIC_BASE_URL',
    description: 'Базовый URL приложения',
    default: 'https://mubarak-way.vercel.app'
  }
];

async function setupEnvVars() {
  console.log('🚀 Настройка переменных окружения для Vercel\n');
  
  // Проверяем авторизацию
  try {
    const whoami = execSync('vercel whoami', { encoding: 'utf-8' }).trim();
    console.log(`✅ Авторизован как: ${whoami}\n`);
  } catch (error) {
    console.error('❌ Не авторизован в Vercel. Запустите: vercel login');
    process.exit(1);
  }

  const vars = {};

  // Собираем обязательные переменные
  console.log('📝 Введите обязательные переменные:\n');
  for (const varConfig of requiredVars) {
    const value = await question(`${varConfig.key} (${varConfig.description}): `);
    if (!value.trim()) {
      console.error(`❌ ${varConfig.key} обязательна!`);
      process.exit(1);
    }
    vars[varConfig.key] = value.trim();
  }

  // Собираем опциональные переменные
  console.log('\n📝 Опциональные переменные (нажмите Enter для значения по умолчанию):\n');
  for (const varConfig of optionalVars) {
    const value = await question(`${varConfig.key} (${varConfig.description}) [${varConfig.default}]: `);
    vars[varConfig.key] = value.trim() || varConfig.default;
  }

  // Добавляем переменные в Vercel
  console.log('\n🔧 Добавление переменных в Vercel...\n');
  
  const environments = ['production', 'preview', 'development'];
  
  for (const [key, value] of Object.entries(vars)) {
    for (const env of environments) {
      try {
        execSync(`vercel env add ${key} ${env}`, {
          input: value,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`✅ ${key} добавлена для ${env}`);
      } catch (error) {
        // Если переменная уже существует, обновляем её
        try {
          execSync(`vercel env rm ${key} ${env} --yes`, { stdio: 'ignore' });
          execSync(`vercel env add ${key} ${env}`, {
            input: value,
            stdio: ['pipe', 'pipe', 'pipe']
          });
          console.log(`✅ ${key} обновлена для ${env}`);
        } catch (updateError) {
          console.error(`❌ Ошибка при добавлении ${key} для ${env}:`, updateError.message);
        }
      }
    }
  }

  console.log('\n✨ Все переменные окружения настроены!');
  console.log('🔄 Vercel автоматически пересоберет проект...\n');
  
  rl.close();
}

setupEnvVars().catch(console.error);

