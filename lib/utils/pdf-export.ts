/**
 * Client-side PDF export utility
 * Uses jsPDF for PDF generation
 */

"use client"

// Dynamic import for jsPDF to reduce bundle size
let jsPDF: any = null

async function loadJsPDF() {
  if (!jsPDF) {
    const module = await import("jspdf")
    jsPDF = module.jsPDF
  }
  return jsPDF
}

interface DonationRecord {
  id: string
  date: string
  type: string
  amount: number
  currency: string
  recipient: string
  status: string
}

/**
 * Generate PDF from donation records
 */
export async function generateDonationsPDF(records: DonationRecord[], userName?: string): Promise<Blob> {
  const PDF = await loadJsPDF()
  const doc = new PDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Set font (jsPDF supports basic fonts)
  doc.setFont("helvetica", "normal")

  // Title
  doc.setFontSize(20)
  doc.text("MubarakWay - История пожертвований", 20, 20)

  // Export date
  doc.setFontSize(10)
  doc.text(`Дата экспорта: ${new Date().toLocaleDateString("ru-RU")}`, 20, 30)

  if (userName) {
    doc.text(`Пользователь: ${userName}`, 20, 35)
  }

  // Summary
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
  doc.setFontSize(12)
  doc.text(`Всего пожертвований: ${records.length}`, 20, 45)
  doc.text(`Общая сумма: ${totalAmount.toLocaleString("ru-RU")} ₽`, 20, 50)

  // Table header
  let yPos = 60
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("№", 20, yPos)
  doc.text("Дата", 30, yPos)
  doc.text("Тип", 50, yPos)
  doc.text("Сумма", 80, yPos)
  doc.text("Получатель", 110, yPos)
  doc.text("Статус", 160, yPos)

  // Table rows
  doc.setFont("helvetica", "normal")
  yPos += 5

  records.forEach((record, index) => {
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }

    doc.text((index + 1).toString(), 20, yPos)
    doc.text(record.date, 30, yPos)
    doc.text(record.type, 50, yPos)
    doc.text(`${record.amount} ${record.currency}`, 80, yPos)
    doc.text(record.recipient.substring(0, 20), 110, yPos) // Truncate long names
    doc.text(record.status, 160, yPos)

    yPos += 7
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Страница ${i} из ${pageCount}`,
      20,
      doc.internal.pageSize.height - 10
    )
  }

  // Generate blob
  const pdfBlob = doc.output("blob")
  return pdfBlob
}

/**
 * Download PDF file
 */
export async function downloadDonationsPDF(
  records: DonationRecord[],
  fileName?: string,
  userName?: string
): Promise<void> {
  try {
    const blob = await generateDonationsPDF(records, userName)
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName || `donations_${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Failed to generate PDF:", error)
    throw new Error("Не удалось создать PDF файл")
  }
}

