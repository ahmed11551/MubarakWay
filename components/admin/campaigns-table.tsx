"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, Eye } from "lucide-react"

export function AdminCampaignsTable() {
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
                      <Button size="sm" variant="ghost" className="text-green-600">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600">
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
    </div>
  )
}
