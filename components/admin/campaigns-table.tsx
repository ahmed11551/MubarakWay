"use client"

import { useState } from "react"
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
import { Check, X, Eye } from "lucide-react"
import { toast } from "sonner"

export function AdminCampaignsTable() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // TODO: Fetch real campaigns from database
  const campaigns = [
    {
      id: "1",
      title: "Строительство водяной скважины",
      creator: "Ахмед Исмаилов",
      status: "pending",
      goal: 500000,
      raised: 0,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      title: "Помощь детям-сиротам",
      creator: "Фатима Алиева",
      status: "active",
      goal: 300000,
      raised: 125000,
      createdAt: "2024-01-10",
    },
    {
      id: "3",
      title: "Лечение тяжелобольного ребёнка",
      creator: "Марьям Хасанова",
      status: "pending",
      goal: 1000000,
      raised: 0,
      createdAt: "2024-01-14",
    },
  ]

  const handleRejectClick = (campaignId: string) => {
    setCampaignToDelete(campaignId)
    setDeleteDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!campaignToDelete) return

    setIsDeleting(true)
    try {
      // TODO: Implement actual rejection API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Кампания отклонена")
      setDeleteDialogOpen(false)
      setCampaignToDelete(null)
    } catch (error) {
      toast.error("Не удалось отклонить кампанию")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleApprove = async (campaignId: string) => {
    try {
      // TODO: Implement actual approval API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Кампания одобрена")
    } catch (error) {
      toast.error("Не удалось одобрить кампанию")
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
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {campaign.status === "pending" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-green-600"
                        onClick={() => handleApprove(campaign.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600"
                        onClick={() => handleRejectClick(campaign.id)}
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
