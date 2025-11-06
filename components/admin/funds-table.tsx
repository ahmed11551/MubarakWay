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
import { Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function AdminFundsTable() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fundToDelete, setFundToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // TODO: Fetch real funds from database
  const funds = [
    {
      id: "1",
      name: "Исламская помощь",
      category: "general",
      verified: true,
      totalRaised: 5000000,
      donorCount: 1234,
    },
    {
      id: "2",
      name: "Помощь сиротам",
      category: "orphans",
      verified: true,
      totalRaised: 3500000,
      donorCount: 890,
    },
    {
      id: "3",
      name: "Вода для жизни",
      category: "water",
      verified: true,
      totalRaised: 2800000,
      donorCount: 567,
    },
  ]

  const handleDeleteClick = (fundId: string) => {
    setFundToDelete(fundId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!fundToDelete) return

    setIsDeleting(true)
    try {
      // TODO: Implement actual delete API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Фонд удалён")
      setDeleteDialogOpen(false)
      setFundToDelete(null)
    } catch (error) {
      toast.error("Не удалось удалить фонд")
    } finally {
      setIsDeleting(false)
    }
  }

  const fundToDeleteData = funds.find((f) => f.id === fundToDelete)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button>Добавить фонд</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Собрано</TableHead>
            <TableHead>Доноров</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {funds.map((fund) => (
            <TableRow key={fund.id}>
              <TableCell className="font-medium">{fund.name}</TableCell>
              <TableCell className="capitalize">{fund.category}</TableCell>
              <TableCell>
                {fund.verified ? (
                  <Badge className="bg-green-600">Проверен</Badge>
                ) : (
                  <Badge variant="outline">Не проверен</Badge>
                )}
              </TableCell>
              <TableCell>₽{fund.totalRaised.toLocaleString()}</TableCell>
              <TableCell>{fund.donorCount}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600"
                    onClick={() => handleDeleteClick(fund.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить фонд?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить фонд "{fundToDeleteData?.name}"?
              Это действие нельзя отменить. Все данные фонда будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
