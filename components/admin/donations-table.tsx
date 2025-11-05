"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function AdminDonationsTable() {
  // TODO: Fetch real donations from database
  const donations = [
    {
      id: "1",
      donor: "Ахмед И.",
      amount: 5000,
      currency: "RUB",
      type: "one_time",
      category: "sadaqah",
      status: "completed",
      createdAt: "2024-01-15T10:30:00",
    },
    {
      id: "2",
      donor: "Анонимный донор",
      amount: 10000,
      currency: "RUB",
      type: "recurring",
      category: "zakat",
      status: "completed",
      createdAt: "2024-01-15T09:15:00",
    },
    {
      id: "3",
      donor: "Фатима А.",
      amount: 2500,
      currency: "RUB",
      type: "one_time",
      category: "general",
      status: "pending",
      createdAt: "2024-01-15T08:45:00",
    },
  ]

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
    </div>
  )
}
