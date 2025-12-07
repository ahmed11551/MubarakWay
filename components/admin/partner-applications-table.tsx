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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Check, X, Eye, Loader2, Mail, Globe, MapPin } from "lucide-react"
import { toast } from "sonner"
import { getPartnerApplications, approvePartnerApplication, rejectPartnerApplication } from "@/lib/actions/partner-applications"

export function AdminPartnerApplicationsTable() {
  const [applications, setApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState<string | null>(null)
  const [isRejecting, setIsRejecting] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [applicationToReject, setApplicationToReject] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [applicationToView, setApplicationToView] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState("received")

  useEffect(() => {
    fetchApplications()
  }, [activeTab])

  async function fetchApplications() {
    setIsLoading(true)
    try {
      const status = activeTab === "all" ? undefined : (activeTab as any)
      const result = await getPartnerApplications(status)
      if (result.error) {
        toast.error(result.error)
        setApplications([])
      } else {
        setApplications(result.applications || [])
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error)
      toast.error("Ошибка при загрузке заявок")
      setApplications([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (application: any) => {
    setApplicationToView(application)
    setViewDialogOpen(true)
  }

  const handleApprove = async (applicationId: string) => {
    setIsApproving(applicationId)
    try {
      const result = await approvePartnerApplication(applicationId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Заявка одобрена. Фонд добавлен в каталог партнёров.")
        fetchApplications()
      }
    } catch (error) {
      console.error("Approval error:", error)
      toast.error("Не удалось одобрить заявку")
    } finally {
      setIsApproving(null)
    }
  }

  const handleRejectClick = (applicationId: string) => {
    setApplicationToReject(applicationId)
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!applicationToReject) return

    setIsRejecting(applicationToReject)
    try {
      const result = await rejectPartnerApplication(applicationToReject, rejectReason || undefined)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Заявка отклонена")
        setRejectDialogOpen(false)
        setApplicationToReject(null)
        setRejectReason("")
        fetchApplications()
      }
    } catch (error) {
      console.error("Rejection error:", error)
      toast.error("Не удалось отклонить заявку")
    } finally {
      setIsRejecting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received":
        return <Badge variant="outline">Получена</Badge>
      case "in_review":
        return <Badge className="bg-blue-600">На проверке</Badge>
      case "approved":
        return <Badge className="bg-green-600">Одобрена</Badge>
      case "rejected":
        return <Badge variant="destructive">Отклонена</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="received">Новые</TabsTrigger>
          <TabsTrigger value="in_review">На проверке</TabsTrigger>
          <TabsTrigger value="approved">Одобренные</TabsTrigger>
          <TabsTrigger value="rejected">Отклонённые</TabsTrigger>
          <TabsTrigger value="all">Все</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Нет заявок со статусом "{activeTab}"</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Организация</TableHead>
                    <TableHead>Страна</TableHead>
                    <TableHead>Контакты</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.org_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {app.country_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          {app.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{app.email}</span>
                            </div>
                          )}
                          {app.website && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{app.website}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleView(app)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {app.status === "received" || app.status === "in_review" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(app.id)}
                                disabled={isApproving === app.id}
                              >
                                {isApproving === app.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleRejectClick(app.id)}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{applicationToView?.org_name}</DialogTitle>
            <DialogDescription>Детали заявки на партнёрство</DialogDescription>
          </DialogHeader>
          {applicationToView && (
            <div className="space-y-4">
              <div>
                <Label>Организация</Label>
                <p className="font-medium">{applicationToView.org_name}</p>
              </div>
              <div>
                <Label>Страна</Label>
                <p>{applicationToView.country_code}</p>
              </div>
              <div>
                <Label>Категории</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {applicationToView.categories?.map((cat: string) => (
                    <Badge key={cat} variant="outline">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Веб-сайт</Label>
                <a href={applicationToView.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {applicationToView.website}
                </a>
              </div>
              <div>
                <Label>Контактное лицо</Label>
                <p>{applicationToView.contact_name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p>{applicationToView.email}</p>
              </div>
              {applicationToView.phone && (
                <div>
                  <Label>Телефон</Label>
                  <p>{applicationToView.phone}</p>
                </div>
              )}
              {applicationToView.telegram_username && (
                <div>
                  <Label>Telegram</Label>
                  <p>@{applicationToView.telegram_username}</p>
                </div>
              )}
              {applicationToView.about && (
                <div>
                  <Label>О фонде</Label>
                  <p className="text-sm text-muted-foreground">{applicationToView.about}</p>
                </div>
              )}
              {applicationToView.comment && (
                <div>
                  <Label>Комментарий модератора</Label>
                  <p className="text-sm text-muted-foreground">{applicationToView.comment}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить заявку</AlertDialogTitle>
            <AlertDialogDescription>
              Укажите причину отклонения (необязательно). Заявитель получит уведомление.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Причина отклонения</Label>
              <Textarea
                id="reject-reason"
                placeholder="Например: Не соответствует требованиям партнёрства..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason("")}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={isRejecting !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Отклонить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

