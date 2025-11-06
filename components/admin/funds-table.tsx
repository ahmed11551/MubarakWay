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
import { Edit, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getFunds } from "@/lib/actions/funds"
import { deleteFund } from "@/lib/actions/funds"

export function AdminFundsTable() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fundToDelete, setFundToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [funds, setFunds] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFunds()
  }, [])

  async function fetchFunds() {
    setIsLoading(true)
    try {
      const result = await getFunds()
      if (result.error) {
        toast.error("Не удалось загрузить фонды")
        setFunds([])
      } else {
        // Transform funds to match table format
        const transformedFunds = (result.funds || []).map((fund: any) => ({
          id: fund.id,
          name: fund.name || fund.name_ru || "Без названия",
          category: fund.category || "general",
          verified: fund.is_verified !== undefined ? fund.is_verified : fund.isVerified || false,
          totalRaised: Number(fund.total_raised || fund.totalRaised || 0),
          donorCount: Number(fund.donor_count || fund.donorCount || 0),
        }))
        setFunds(transformedFunds)
      }
    } catch (error) {
      console.error("Failed to fetch funds:", error)
      toast.error("Ошибка при загрузке фондов")
      setFunds([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (fundId: string) => {
    setFundToDelete(fundId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!fundToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteFund(fundToDelete)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Фонд удалён")
        setDeleteDialogOpen(false)
        setFundToDelete(null)
        fetchFunds() // Refresh the list
      }
    } catch (error) {
      console.error("Deletion error:", error)
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

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка фондов...</span>
        </div>
      ) : funds.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Нет фондов для отображения</p>
        </div>
      ) : (
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
      )}

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
