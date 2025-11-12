import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

type Campaign = {
  id: string
  title: string
  description: string
  goalAmount: number
  currentAmount: number
  category: string
  imageUrl: string
  donorCount: number
  daysLeft: number
  creatorName: string
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = (campaign.currentAmount / campaign.goalAmount) * 100
  const isCompleted = campaign.currentAmount >= campaign.goalAmount

  return (
    <Link 
      href={`/campaigns/${campaign.id}`}
      className="block"
      style={{ 
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-75">
        <div className="aspect-video bg-muted relative">
          <Image
            src={campaign.imageUrl || "/placeholder.svg"}
            alt={campaign.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {isCompleted && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
              <CheckCircle className="h-3 w-3" />
              Завершено
            </div>
          )}
          <Badge className="absolute top-2 left-2 capitalize">{campaign.category}</Badge>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-base line-clamp-2">{campaign.title}</CardTitle>
          <CardDescription className="text-xs line-clamp-2">{campaign.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Собрано</span>
              <span className="font-semibold">
                {campaign.currentAmount.toLocaleString("ru-RU")} ₽ из {campaign.goalAmount.toLocaleString("ru-RU")} ₽
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{campaign.donorCount} жертвователей</span>
            <span>{campaign.daysLeft > 0 ? `${campaign.daysLeft} дней осталось` : "Кампания завершена"}</span>
          </div>
          <div className="text-xs text-muted-foreground pt-1 border-t">от {campaign.creatorName}</div>
        </CardContent>
      </Card>
    </Link>
  )
}
