import { createAdminClient } from "@/lib/supabase/admin"

export type PlatformStats = {
  totalCollected: number
  activeDonors: number
  activeCampaigns: number
  averageCheck: number
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = createAdminClient()

  const [activeDonorsRes, activeCampaignsRes, avgCheckRes] = await Promise.all([
    supabase.from("donations").select("donor_id", { count: "exact", head: true }).eq("status", "completed").not("donor_id", "is", null),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("donations").select("amount").eq("status", "completed"),
  ]).catch(() => [null, null, null])

  // Sum total collected
  let totalCollected = 0
  {
    const { data, error } = await supabase.from("donations").select("amount").eq("status", "completed")
    if (!error && data) {
      totalCollected = data.reduce((acc: number, row: { amount: number }) => acc + Number(row.amount || 0), 0)
    }
  }

  const activeDonors = (activeDonorsRes && "count" in activeDonorsRes ? activeDonorsRes.count : 0) || 0
  const activeCampaigns = (activeCampaignsRes && "count" in activeCampaignsRes ? activeCampaignsRes.count : 0) || 0

  let averageCheck = 0
  if (avgCheckRes && "data" in avgCheckRes && Array.isArray(avgCheckRes.data) && avgCheckRes.data.length > 0) {
    const amounts = avgCheckRes.data.map((r: { amount: number }) => Number(r.amount || 0))
    const sum = amounts.reduce((a: number, b: number) => a + b, 0)
    averageCheck = amounts.length ? sum / amounts.length : 0
  }

  return {
    totalCollected,
    activeDonors,
    activeCampaigns,
    averageCheck,
  }
}


