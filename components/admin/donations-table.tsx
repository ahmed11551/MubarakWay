"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getAllDonations } from "@/lib/actions/donations"

export function AdminDonationsTable() {
  const [donations, setDonations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDonations()
  }, [])

  async function fetchDonations() {
    setIsLoading(true)
    try {
      const result = await getAllDonations()
      if (result.error) {
        toast.error("Не удалось загрузить пожертвования")
        setDonations([])
      } else {
        // Transform donations to match table format
        const transformedDonations = (result.donations || []).map((donation: any) => ({
          id: donation.id,
          donor: donation.is_anonymous 
            ? "Анонимный донор" 
            : donation.profiles?.display_name || donation.profiles?.email || "Неизвестный",
          amount: Number(donation.amount || 0),
          currency: donation.currency || "RUB",
          type: donation.donation_type || "one_time",
          category: donation.category || "general",
          status: donation.status || "pending",
          createdAt: donation.created_at,
        }))
        setDonations(transformedDonations)
      }
    } catch (error) {
      console.error("Failed to fetch donations:", error)
      toast.error("Ошибка при загрузке пожертвований")
      setDonations([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Завершено</Badge>
      case "pending":
        return <Badge variant="outline">В обработке</Badge>
      case "failed":
        return <Badge variant="destructive">Ошибка</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка пожертвований...</span>
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Нет пожертвований для отображения</p>
        </div>
      ) : (
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Донор</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Дата</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.map((donation) => (
            <TableRow key={donation.id}>
              <TableCell className="font-medium">{donation.donor}</TableCell>
              <TableCell>
                {donation.amount.toLocaleString()} {donation.currency}
              </TableCell>
              <TableCell className="capitalize">{donation.type === "one_time" ? "Единоразово" : "Регулярно"}</TableCell>
              <TableCell className="capitalize">{donation.category}</TableCell>
              <TableCell>{getStatusBadge(donation.status)}</TableCell>
              <TableCell>{new Date(donation.createdAt).toLocaleString("ru-RU")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}
    </div>
  )
}
