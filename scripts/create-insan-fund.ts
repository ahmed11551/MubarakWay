/**
 * Script to create Insan fund in Supabase
 * Run with: npx tsx scripts/create-insan-fund.ts
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { resolve } from "path"

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables!")
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createInsanFund() {
  console.log("🔄 Creating/Updating Insan fund...")

  try {
    // Step 1: Insert or update Insan fund
    const { data, error } = await supabase
      .from("funds")
      .upsert(
        {
          id: "00000000-0000-0000-0000-000000000001",
          name: "Фонд Инсан",
          name_ar: "صندوق إنسان",
          description:
            'Благотворительный фонд "Инсан" - основной партнер платформы MubarakWay. Фонд занимается различными направлениями благотворительности: помощь сиротам, образование, здравоохранение, экстренная помощь, водоснабжение и другие важные социальные программы.',
          description_ar:
            "صندوق إنسان الخيري - الشريك الرئيسي لمنصة MubarakWay. يعمل الصندوق في مختلف مجالات الخير: مساعدة الأيتام، التعليم، الرعاية الصحية، المساعدة الطارئة، إمدادات المياه وغيرها من البرامج الاجتماعية المهمة.",
          logo_url:
            "https://fondinsan.ru/uploads/cache/Programs/Program47/1bc0623de3-2_400x400.png",
          category: "general",
          is_verified: true,
          is_active: true,
          total_raised: 0,
          donor_count: 0,
          website_url: "https://fondinsan.ru",
          contact_email: "info@fondinsan.ru",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      )
      .select()

    if (error) {
      console.error("❌ Error creating fund:", error)
      throw error
    }

    console.log("✅ Insan fund created/updated:", data?.[0]?.name)

    // Step 2: Deactivate all other funds
    console.log("🔄 Deactivating other funds...")

    const { error: updateError } = await supabase
      .from("funds")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .neq("id", "00000000-0000-0000-0000-000000000001")
      .eq("is_active", true)

    if (updateError) {
      console.warn("⚠️ Warning deactivating other funds:", updateError.message)
    } else {
      console.log("✅ Other funds deactivated")
    }

    // Step 3: Verify
    console.log("🔄 Verifying active funds...")

    const { data: activeFunds, error: selectError } = await supabase
      .from("funds")
      .select("id, name, is_active, category")
      .eq("is_active", true)

    if (selectError) {
      console.error("❌ Error verifying funds:", selectError)
      throw selectError
    }

    console.log("\n📊 Active funds:")
    if (activeFunds && activeFunds.length > 0) {
      activeFunds.forEach((fund) => {
        console.log(`  ✅ ${fund.name} (${fund.id}) - ${fund.category}`)
      })
      console.log(`\n✅ Success! Found ${activeFunds.length} active fund(s)`)
    } else {
      console.log("  ⚠️ No active funds found!")
    }

    return { success: true, activeFunds }
  } catch (error: any) {
    console.error("❌ Failed to create Insan fund:", error)
    throw error
  }
}

// Run the script
createInsanFund()
  .then(() => {
    console.log("\n✅ Script completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error)
    process.exit(1)
  })

