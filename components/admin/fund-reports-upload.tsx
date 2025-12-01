"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, FileText } from "lucide-react"
import { toast } from "sonner"

interface Fund {
  id: string
  name: string
}

export function FundReportsUpload({ funds }: { funds: Fund[] }) {
  const [selectedFund, setSelectedFund] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [periodStart, setPeriodStart] = useState<string>("")
  const [periodEnd, setPeriodEnd] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast.error("Только PDF файлы разрешены")
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 10 МБ")
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!selectedFund || !file) {
      toast.error("Выберите фонд и файл")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("fundId", selectedFund)
      if (periodStart) formData.append("periodStart", periodStart)
      if (periodEnd) formData.append("periodEnd", periodEnd)

      const response = await fetch("/api/reports/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Не удалось загрузить отчёт")
      }

      toast.success("Отчёт успешно загружен!")
      // Reset form
      setSelectedFund("")
      setFile(null)
      setPeriodStart("")
      setPeriodEnd("")
      // Reset file input
      const fileInput = document.getElementById("pdf-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить отчёт")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Загрузка отчётов фондов
        </CardTitle>
        <CardDescription>
          Загрузите PDF отчёты фондов для отображения пользователям
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fund-select">Фонд</Label>
          <Select value={selectedFund} onValueChange={setSelectedFund}>
            <SelectTrigger id="fund-select">
              <SelectValue placeholder="Выберите фонд" />
            </SelectTrigger>
            <SelectContent>
              {funds.map((fund) => (
                <SelectItem key={fund.id} value={fund.id}>
                  {fund.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pdf-upload">PDF файл</Label>
          <Input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Выбран: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} МБ)
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="period-start">Период начала (опционально)</Label>
            <Input
              id="period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period-end">Период окончания (опционально)</Label>
            <Input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              disabled={isUploading}
            />
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFund || !file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Загрузить отчёт
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

