"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Eye, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getCampaigns } from "@/lib/actions/campaigns"
import { approveCampaign, rejectCampaign } from "@/lib/actions/campaigns"
import Link from "next/link"

export function AdminCampaignsTable() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isApproving, setIsApproving] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    fetchCampaigns()
  }, [activeTab])

  async function fetchCampaigns() {
    setIsLoading(true)
    try {
      const status = activeTab === "all" ? undefined : activeTab
      const result = await getCampaigns(status)
      if (result.error) {
        toast.error("Не удалось загрузить кампании")
        setCampaigns([])
      } else {
        // Transform campaigns to match table format
        const transformedCampaigns = (result.campaigns || []).map((campaign: any) => ({
          id: campaign.id,
          title: campaign.title,
          creator: campaign.profiles?.display_name || "Неизвестный",
          status: campaign.status,
          goal: Number(campaign.goal_amount || 0),
          raised: Number(campaign.current_amount || 0),
          createdAt: campaign.created_at,
        }))
        setCampaigns(transformedCampaigns)
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error)
      toast.error("Ошибка при загрузке кампаний")
      setCampaigns([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectClick = (campaignId: string) => {
    setCampaignToDelete(campaignId)
    setDeleteDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!campaignToDelete) return

    setIsDeleting(true)
    try {
      const result = await rejectCampaign(campaignToDelete)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Кампания отклонена")
        setDeleteDialogOpen(false)
        setCampaignToDelete(null)
        fetchCampaigns() // Refresh the list
      }
    } catch (error) {
      console.error("Rejection error:", error)
      toast.error("Не удалось отклонить кампанию")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleApprove = async (campaignId: string) => {
    setIsApproving(campaignId)
    try {
      const result = await approveCampaign(campaignId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Кампания одобрена")
        fetchCampaigns() // Refresh the list
      }
    } catch (error) {
      console.error("Approval error:", error)
      toast.error("Не удалось одобрить кампанию")
    } finally {
      setIsApproving(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">На модерации</Badge>
      case "active":
        return <Badge className="bg-green-600">Активна</Badge>
      case "completed":
        return <Badge variant="secondary">Завершена</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const campaignToReject = campaigns.find((c) => c.id === campaignToDelete)

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">На модерации</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="completed">Завершённые</TabsTrigger>
          <TabsTrigger value="all">Все</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка кампаний...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Нет кампаний для отображения</p>
        </div>
      ) : (
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Создатель</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Цель</TableHead>
            <TableHead>Собрано</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.title}</TableCell>
              <TableCell>{campaign.creator}</TableCell>
              <TableCell>{getStatusBadge(campaign.status)}</TableCell>
              <TableCell>₽{campaign.goal.toLocaleString()}</TableCell>
              <TableCell>₽{campaign.raised.toLocaleString()}</TableCell>
              <TableCell>{new Date(campaign.createdAt).toLocaleDateString("ru-RU")}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  {campaign.status === "pending" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-green-600"
                        onClick={() => handleApprove(campaign.id)}
                        disabled={isApproving === campaign.id}
                      >
                        {isApproving === campaign.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600"
                        onClick={() => handleRejectClick(campaign.id)}
                        disabled={isDeleting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить кампанию?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите отклонить кампанию "{campaignToReject?.title}"?
              Это действие нельзя отменить. Кампания будет удалена и не будет опубликована.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Отклонение..." : "Отклонить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
